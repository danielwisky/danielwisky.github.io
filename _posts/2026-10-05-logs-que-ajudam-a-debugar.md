---
layout: post
title: "Logs que ajudam a debugar, não só que existem"
subtitle: "A diferença entre ter observabilidade e só ter um monte de linha no console"
tags: [Programação, APIs]
---

Toda aplicação em produção tem logs. Poucas têm logs que realmente ajudam a resolver um incidente às três da manhã. A diferença não está na quantidade de linhas escritas, está em três perguntas que o time raramente para pra responder antes de adicionar mais um `log.info`: esse log vai me dizer o que eu preciso saber quando algo quebrar? Eu consigo achar essa linha específica no meio de milhões de outras? E consigo seguir o rastro de uma requisição por todos os serviços que ela passou?

## O log que não diz nada

É fácil reconhecer esse padrão porque ele está em quase todo projeto:

```java
log.info("Processando pedido");
log.info("Pedido processado com sucesso");
```

Esses logs existem, ocupam espaço em disco, custam dinheiro de ingestão na ferramenta de observabilidade, e não ajudam em nada quando o pedido 48213 falha em produção. Qual pedido? Processado por quem? Com qual valor? Quanto tempo levou? Nenhuma dessas perguntas tem resposta, porque o log foi escrito pensando em "deixar rastro de que o código passou por aqui", não em "o que eu vou precisar saber quando isso der errado".

A versão que ajuda carrega contexto estruturado:

```java
log.info("pedido.processado",
    kv("pedidoId", pedido.id()),
    kv("clienteId", pedido.clienteId()),
    kv("valorTotal", pedido.valorTotal()),
    kv("duracaoMs", duracao.toMillis()));
```

A diferença não é só de conteúdo, é de formato. O segundo exemplo produz campos que uma ferramenta de busca consegue filtrar e agregar (todos os pedidos acima de determinado valor, a duração média de processamento por hora), enquanto o primeiro produz só texto livre que só serve pra ler um por um.

## Log estruturado não é luxo, é o mínimo pra buscar depois

Escrever `log.info("Pedido " + id + " processado em " + duracao + "ms")` parece equivalente ao exemplo estruturado, mas não é. Esse log vira uma string única no agregador, e encontrar "todos os pedidos que levaram mais de 2 segundos" exige uma regex frágil em cima de texto, quando podia ser um filtro direto no campo `duracaoMs`. Ferramentas como Logback com encoder JSON, ou bibliotecas como structlog em Python, resolvem isso sem custo extra de performance relevante: cada campo vira uma chave pesquisável, e o texto livre vira só a mensagem, não o dado.

O ganho fica mais claro quando o volume de logs cresce. Com cem requisições por dia, dá pra abrir o arquivo e ler na mão. Com cem mil, só sobrevive quem consegue filtrar por campo.

## Correlação: seguir uma requisição por vários serviços

Numa arquitetura com mais de um serviço, o pedido de um cliente passa pelo gateway, pelo serviço de pedidos, pelo serviço de pagamento e pelo serviço de notificação. Quando algo falha no meio do caminho, a pergunta não é "o que esse serviço logou", é "o que aconteceu com essa requisição específica, do início ao fim, em todos os serviços que ela tocou". Sem um identificador comum passando por essa cadeia, essa pergunta fica impossível de responder: cada serviço loga sua própria visão isolada, sem ligação entre elas.

A solução é gerar um `traceId` (ou reaproveitar um correlation ID que já venha do cliente) no primeiro ponto de entrada e propagá-lo em todo header de chamada subsequente, incluindo o header em toda mensagem publicada numa fila:

```http
X-Trace-Id: 9f1c2e3a-7b4d-4a8e-9c1f-5d6e7a8b9c0d
```

Esse valor precisa entrar em todo log emitido durante o processamento daquela requisição, idealmente de forma automática via MDC (Mapped Diagnostic Context, no ecossistema Java) ou mecanismo equivalente, em vez de depender de cada desenvolvedor lembrar de passar o ID manualmente em cada chamada de log. Com isso, uma busca por `traceId:9f1c2e3a...` numa ferramenta como Elasticsearch, Loki ou Datadog retorna a história completa da requisição, ordenada no tempo, atravessando todos os serviços.

## Tracing distribuído: quando logs não bastam

Correlação por ID resolve "o que aconteceu", mas não resolve bem "onde o tempo foi gasto". Se uma requisição levou 800ms, quanto desse tempo foi gasto em cada serviço, em cada chamada de banco, em cada chamada HTTP pra um serviço externo? Logs isolados conseguem responder isso só com muito trabalho manual de juntar timestamps.

É pra esse problema que existe tracing distribuído, com ferramentas como OpenTelemetry virando o padrão de facto do mercado. A ideia central é a mesma da correlação por log, mas estruturada: cada operação vira um "span" com início, fim e um `spanId` próprio, e spans se aninham dentro de um `traceId` comum, formando uma árvore que mostra exatamente onde cada milissegundo foi gasto.

```java
Span span = tracer.spanBuilder("buscar-pagamento").startSpan();
try (Scope scope = span.makeCurrent()) {
    return pagamentoClient.buscar(pedidoId);
} finally {
    span.end();
}
```

Visualizado numa ferramenta como Jaeger ou Grafana Tempo, isso vira um gráfico de cascata: dá pra ver de olho que 600 dos 800ms totais foram gastos numa chamada a um serviço externo de pagamento, e não no seu próprio código. Essa visibilidade é o que separa "o sistema está lento" de "esse endpoint específico, dessa dependência específica, é o gargalo".

## Métricas: o que acontece em agregado, não caso a caso

Logs e traces respondem bem perguntas sobre uma requisição específica. Pra perguntas sobre comportamento agregado (quantos erros 500 por minuto, qual o percentil 99 de latência da última hora, quantas mensagens estão acumulando numa fila), a ferramenta certa é métrica, não log. Tentar responder essas perguntas rodando agregação em cima de logs funciona em escala pequena e fica caro e lento conforme o volume cresce, porque logs não foram desenhados pra esse tipo de consulta.

Prometheus, com sua API de counters, gauges e histograms, é o padrão mais comum pra isso no ecossistema Java e em boa parte do resto do mercado:

```java
Counter.builder("pedidos.processados")
    .tag("status", status)
    .register(registry)
    .increment();
```

Um dashboard em cima dessas métricas, no Grafana por exemplo, dá visão de tendência em tempo real sem precisar escrever uma query de agregação em cima de terabytes de log toda vez que alguém quer saber como está a saúde do sistema agora.

## As três pernas trabalham juntas

Logs, traces e métricas não competem entre si, resolvem perguntas diferentes:

- **Métrica** responde "algo está errado?" (taxa de erro subiu, latência p99 piorou).
- **Trace** responde "onde, dentro da requisição, está o problema?" (qual serviço, qual chamada específica).
- **Log** responde "o que exatamente aconteceu ali?" (qual exceção, com quais dados de entrada).

O fluxo real de debug costuma seguir essa ordem: o alerta de métrica dispara, o time abre o trace da requisição lenta pra achar o span problemático, e só depois vai no log daquele serviço específico, filtrado pelo `traceId` daquela requisição, pra entender a causa exata. Sem as três pernas, cada etapa desse fluxo vira um trabalho manual de juntar pistas soltas, e é exatamente esse trabalho manual que faz um incidente de 10 minutos virar um de duas horas.
