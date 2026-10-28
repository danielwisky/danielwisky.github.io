---
layout: post
title: "Tracing distribuído: seguindo uma requisição de ponta a ponta"
subtitle: "Logs contam o que aconteceu em cada serviço e métricas mostram a tendência; o trace mostra o caminho"
tags: [Arquitetura, Observabilidade]
---

Um cliente reclama que finalizar a compra está levando oito segundos. O dashboard do serviço de pedidos mostra o p99 subindo, então a lentidão é real. Só que esse serviço chama o de estoque, que chama o de preços, e em paralelo o pedido passa pelo antifraude e pelo pagamento. Cada um tem seus próprios logs e suas próprias métricas, e todos parecem razoavelmente saudáveis quando olhados isoladamente. A pergunta que nenhum deles responde sozinho é: dos oito segundos daquela requisição, onde foi parar o tempo?

É esse o buraco que o tracing distribuído preenche. Ele fecha o trio com os [logs](/2026-10-05-logs-que-ajudam-a-debugar/) e as [métricas](/2026-10-26-metricas-red-use-sinais-de-ouro/): os logs descrevem eventos dentro de um serviço, as métricas agregam o comportamento de muitas requisições, e o trace conta a história de uma requisição só, atravessando todos os serviços por onde ela passou.

## Trace e span

O vocabulário é pequeno. Um **trace** representa a jornada inteira de uma requisição. Ele é formado por **spans**, e cada span é uma unidade de trabalho com início e fim: a chamada HTTP que o serviço de pedidos recebeu, a query que ele fez no banco, a chamada que ele disparou para o estoque. Cada span guarda o id do trace, o próprio id e o id do span pai, e é isso que permite montar a árvore depois.

Visualizado numa ferramenta como Jaeger, Tempo ou Zipkin, um trace vira uma espécie de gráfico de Gantt:

```
POST /pedidos                          ████████████████████████  8,1 s
  ├─ SELECT cliente                    █                         40 ms
  ├─ GET /estoque/reservas               ███████████████████     6,9 s
  │    └─ GET /precos/tabela               ██████████████████    6,8 s
  │         └─ SELECT tabela_preco           █████████████████   6,7 s
  └─ POST /pagamentos                                       ██   900 ms
```

Com isso na tela, a investigação que levaria uma tarde cruzando logs de cinco serviços leva segundos: o tempo está numa query do serviço de preços, dois níveis abaixo do serviço onde o sintoma apareceu.

Spans também carregam atributos (o método HTTP, o status, o nome da tabela, o id do tenant) e eventos com horário, como uma exceção que foi lançada no meio do caminho.

## Propagação de contexto

Para que o span do serviço de preços saiba que pertence ao mesmo trace que começou no serviço de pedidos, o contexto precisa viajar junto com a requisição. Em HTTP, o padrão hoje é o header `traceparent`, definido pela especificação W3C Trace Context:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

São quatro campos: a versão, o id do trace, o id do span que fez a chamada e as flags (o `01` indica que esse trace foi amostrado). Cada serviço lê o header na entrada, cria seus spans como filhos desse contexto e escreve um header novo nas chamadas que fizer adiante.

É aqui que a maioria dos traces quebra. Basta um elo da corrente não propagar o header, seja um cliente HTTP criado à mão, seja um proxy que descarta headers desconhecidos, e o trace se parte em dois pedaços sem relação aparente. O mesmo vale para fronteiras assíncronas: uma mensagem publicada no Kafka só continua o trace se o contexto for junto nos headers da mensagem, e um trabalho entregue para outra thread só herda o contexto se o executor souber repassá-lo. Quem usa o [Outbox Pattern](/2026-10-08-outbox-pattern/) precisa lembrar de gravar o contexto junto com o evento, senão o trace termina na tabela de outbox.

## OpenTelemetry

Durante anos, cada ferramenta tinha seu próprio formato e suas próprias bibliotecas de instrumentação, e trocar de fornecedor significava reinstrumentar tudo. O OpenTelemetry resolveu boa parte disso: é um projeto da CNCF que padroniza a API, os SDKs e o protocolo de exportação (OTLP) para traces, métricas e logs. A aplicação é instrumentada uma vez e envia os dados para um OpenTelemetry Collector, que repassa para o backend que estiver em uso.

Há dois jeitos comuns de instrumentar uma aplicação Java. O primeiro é o agente Java do OpenTelemetry, um `-javaagent` que instrumenta automaticamente servidores HTTP, clientes, JDBC, Kafka e muitas outras bibliotecas sem mudar uma linha de código. O segundo, para quem está no Spring Boot 3, é o Micrometer Tracing, que se integra ao Actuator e usa o OpenTelemetry por baixo:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

```yaml
management:
  tracing:
    sampling:
      probability: 0.1
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
```

Com isso, as requisições recebidas e as chamadas feitas por `RestClient`, `WebClient` e `RestTemplate` (desde que criados a partir dos builders que o Spring injeta) já geram spans e propagam o `traceparent`. Para medir um trecho específico do próprio código, a API de Observation do Micrometer cria o span e, de quebra, o timer:

```java
public Recibo cobrar(Pagamento pagamento) {
    return Observation.createNotStarted("pagamentos.cobrar", observationRegistry)
        .lowCardinalityKeyValue("gateway", pagamento.gateway())
        .observe(() -> gateway.cobrar(pagamento));
}
```

Uma única instrumentação alimenta o trace e a métrica RED daquela operação, o que evita manter as duas coisas separadas.

## Ligando trace e log

O trace mostra onde o tempo foi gasto, mas raramente diz por quê. Para isso continuam sendo necessários os logs, e a ponte entre os dois é o id do trace. O Micrometer Tracing coloca `traceId` e `spanId` no MDC, e desde a versão 3.2 o Spring Boot já os inclui nas linhas de log por padrão. Assim, a partir do span lento no Jaeger, dá para buscar no agregador de logs todas as linhas daquele trace, em todos os serviços, e ver a mensagem de erro ou o parâmetro estranho que explica a demora.

Esse caminho de ida e volta é o que faz observabilidade valer o investimento. A métrica avisa que algo piorou, o trace aponta onde, e o log explica o motivo.

## Amostragem

Guardar o trace de cada requisição sai caro rápido, em armazenamento e em overhead de rede. Por isso quase todo mundo amostra. O jeito mais simples é a amostragem na origem (head-based): o primeiro serviço decide, com uma probabilidade fixa, se aquele trace será gravado, e a decisão viaja nas flags do `traceparent` para que todos os outros serviços sigam a mesma escolha. É o que a propriedade `management.tracing.sampling.probability` controla.

O problema é que a decisão é tomada antes de saber se a requisição vai ser interessante. Com 10% de amostragem, 90% dos erros e das requisições lentas somem justamente quando mais importam. A alternativa é a amostragem na cauda (tail-based), feita no Collector: ele segura os spans por um tempo (30 segundos, por padrão), espera o trace terminar e decide com base no resultado, guardando todos os traces com erro ou acima de certa latência e só uma fração dos normais. É mais trabalhoso de operar, porque todos os spans de um mesmo trace precisam chegar à mesma instância do Collector, o que pede uma camada de balanceamento na frente quando há mais de uma. Mesmo assim, costuma ser o que dá o melhor retorno por byte gravado.

## Cuidados

Atributos de span merecem a mesma disciplina das tags de métrica. Colocar o id do usuário ou a URL completa com parâmetros como atributo de baixa cardinalidade é pedir para estourar o custo da ferramenta, e dados pessoais ou tokens não deveriam aparecer em span nenhum, já que traces costumam ser acessíveis a muita gente.

Também vale lembrar que o trace mostra o que foi instrumentado. Um trecho sem span aparece como um buraco entre dois spans, e esse buraco já é uma pista: muitas vezes é ali que está um pool de conexões saturado ou um lock esperando, coisas que um bom [timeout](/2026-10-16-timeouts-e-propagacao-de-deadline/) teria cortado antes.

Para começar, não é preciso instrumentar tudo de uma vez. Ligar a instrumentação automática nos serviços do caminho mais crítico, garantir que o `traceparent` atravesse todos eles e colocar o `traceId` nos logs já transforma a próxima investigação de incidente. O resto pode ir sendo refinado conforme as perguntas aparecerem.
