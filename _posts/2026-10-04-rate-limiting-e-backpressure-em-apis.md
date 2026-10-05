---
layout: post
title: "Rate limiting e backpressure: como proteger uma API sem sacrificar o cliente"
subtitle: "A diferença entre limitar tráfego e simplesmente quebrar sob pressão"
tags: [APIs, Arquitetura]
---

Toda API que sobrevive o suficiente em produção acaba enfrentando o mesmo problema: um cliente mal comportado, um pico de tráfego inesperado ou um serviço downstream que ficou lento. Sem nenhum tipo de proteção, o resultado é sempre o mesmo, o serviço consome toda a memória disponível, as threads ficam presas esperando resposta de algo que não vai responder a tempo, e o que era um problema pontual vira uma indisponibilidade completa. Rate limiting e backpressure resolvem partes diferentes desse problema, e confundir os dois leva a soluções que protegem o sistema errado.

## Rate limiting: proteção na borda

Rate limiting é a técnica mais conhecida, e a mais simples de explicar: define um número máximo de requisições que um cliente pode fazer num intervalo de tempo, e rejeita o excedente antes que ele chegue perto da lógica de negócio. A resposta padrão é um `429 Too Many Requests`, normalmente acompanhado de um header `Retry-After` indicando quando o cliente pode tentar de novo.

O algoritmo mais usado na prática é o token bucket. A ideia é simples: cada cliente tem um balde com uma capacidade fixa de tokens, cada requisição consome um token, e o balde é reabastecido a uma taxa constante ao longo do tempo.

```java
public boolean permitir(String clienteId) {
    var bucket = buckets.computeIfAbsent(clienteId, id -> new TokenBucket(100, 10));
    return bucket.tentarConsumir(1);
}
```

Nesse exemplo, cada cliente tem capacidade para 100 requisições, com reposição de 10 tokens por segundo. Isso permite picos curtos de até 100 requisições de uma vez, mas limita a média sustentada a 10 por segundo, o que costuma ser mais justo com o cliente do que um limite fixo por janela de tempo, que pune duramente quem faz todas as chamadas no início do segundo.

Vale notar onde esse limite deveria viver: num API Gateway ou num proxy reverso, antes da requisição chegar na aplicação. Implementar rate limiting dentro do próprio serviço de negócio funciona, mas gasta recursos processando a requisição até o ponto de rejeitá-la, o que é exatamente o desperdício que a técnica deveria evitar.

## Backpressure: proteção interna

Rate limiting resolve o problema de "quem pode entrar", mas não resolve o que acontece depois que a requisição já passou pela porta e está dentro do sistema. Se o serviço estiver processando mensagens de uma fila, ou chamando um banco de dados que ficou lento, o rate limiting na borda não ajuda em nada, porque o gargalo está no meio do caminho, não na entrada.

É aqui que entra backpressure: a capacidade de um componente sinalizar para quem está produzindo trabalho que ele precisa desacelerar, em vez de simplesmente acumular uma fila infinita de tarefas pendentes até estourar a memória. Em sistemas reativos, isso é um conceito de primeira classe. O Project Reactor, por exemplo, deixa o consumidor controlar o ritmo:

```java
Flux.range(1, 1_000_000)
    .onBackpressureBuffer(1000, item -> log.warn("descartado: {}", item))
    .publishOn(Schedulers.boundedElastic())
    .subscribe(item -> processar(item));
```

Aqui o buffer tem um limite explícito de 1000 itens. Quando o consumidor não consegue acompanhar o ritmo do produtor e o buffer enche, a estratégia configurada decide o que fazer: descartar os itens mais antigos, descartar os mais novos, ou propagar um erro. A alternativa, um buffer sem limite, parece mais segura à primeira vista, mas só adia o problema: a fila cresce até a memória acabar, e o processo morre de qualquer forma, só que de um jeito mais difícil de diagnosticar.

Filas de mensageria como Kafka já embutem uma forma natural de backpressure: o consumidor só avança o offset quando processa a mensagem, e se ficar mais lento que o produtor, as mensagens simplesmente se acumulam no broker em vez de na memória da aplicação. Isso desloca o problema para um lugar mais seguro de acumular trabalho, mas não o resolve sozinho, porque um consumidor crônico lento ainda vai gerar lag crescente que precisa de alerta e ação.

## Circuit breaker: o terceiro elemento da equação

Rate limiting e backpressure cuidam do volume de trabalho, mas não resolvem o caso em que uma dependência downstream está simplesmente fora do ar ou respondendo devagar demais. Continuar tentando chamar um serviço que não vai responder só desperdiça threads e conexões que poderiam estar atendendo outras requisições saudáveis.

Um circuit breaker monitora a taxa de falha das chamadas a uma dependência e opera em três estados: fechado, deixando as chamadas passarem normalmente enquanto observa a taxa de falha; aberto, quando essa taxa ultrapassa um limiar e toda chamada seguinte falha na hora, sem nem tentar contatar a dependência; e semiaberto, um estado de teste que, depois de um intervalo de espera, deixa passar algumas chamadas para verificar se o serviço já voltou, antes de fechar totalmente de novo.

```java
CircuitBreaker breaker = CircuitBreaker.ofDefaults("pagamentos");
Supplier<Pagamento> decorado = CircuitBreaker
    .decorateSupplier(breaker, () -> pagamentoClient.processar(request));
```

Com o circuito aberto, chamadas falham rápido, o que dá tempo para a dependência se recuperar sem o peso adicional de um volume de tentativas que ela não tem capacidade de atender. Um detalhe que merece atenção é a ordem ao combinar com retry: o circuit breaker precisa envolver o retry, nunca o contrário, porque um retry por dentro do circuit breaker multiplica tentativas justamente sobre a dependência que já está sofrendo, em vez de aliviar a carga sobre ela. Um fallback, como um valor em cache ou uma resposta degradada, também costuma ser mais útil do que simplesmente devolver erro, desde que exista uma alternativa de verdade para a operação.

## Como as três técnicas se complementam

Na prática, um sistema robusto usa as três camadas juntas, cada uma protegendo uma parte diferente do caminho:

- Rate limiting na borda, limitando quanto cada cliente pode consumir do sistema como um todo.
- Backpressure internamente, garantindo que filas e buffers tenham limites explícitos em vez de crescer sem controle.
- Circuit breaker nas chamadas a dependências externas, evitando que uma falha downstream se propague como lentidão generalizada no serviço inteiro.

Nenhuma das três substitui as outras. Um serviço com rate limiting perfeito ainda pode cair se o banco de dados ficar lento e as threads ficarem presas esperando. Um serviço com circuit breaker em todas as dependências ainda pode ser derrubado por um cliente sem limite de requisições. A régua prática é simples: se o seu sistema já sofreu uma indisponibilidade por sobrecarga, vale revisar as três camadas, porque quase sempre o incidente expõe qual delas estava faltando.
