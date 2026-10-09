---
layout: post
title: "Circuit Breaker: parando de bater numa dependência que já caiu"
subtitle: "Por que falhar rápido é melhor do que insistir num serviço fora do ar"
tags: [Arquitetura, APIs]
---

Um serviço de pagamentos fica fora do ar por dois minutos. Nesse intervalo, o serviço de pedidos continua tentando chamá-lo, requisição atrás de requisição, cada uma esperando o timeout de 30 segundos antes de desistir. As threads que atendem essas chamadas ficam presas esperando uma resposta que não vai vir, o pool de conexões esgota, e em pouco tempo o serviço de pedidos também para de responder, mesmo não tendo nenhum problema próprio. A causa raiz foi uma dependência externa, mas quem cai é todo mundo que depende dela, numa cadeia que se espalha mais rápido do que qualquer pessoa consegue reagir.

## O problema de insistir numa dependência quebrada

Esse padrão de falha tem um nome: falha em cascata. O serviço de pedidos, isoladamente, está saudável, mas insiste em gastar seus próprios recursos tentando falar com algo que não vai responder dentro do prazo. Cada chamada presa consome uma thread, uma conexão de banco potencialmente aberta durante a transação, e memória para a requisição que está sendo processada. Multiplicado por centenas de chamadas simultâneas, o sintoma vira indisponibilidade total, mesmo que o código do serviço de pedidos não tenha nenhum bug.

```java
public Pagamento processar(PedidoRequest request) {
    return pagamentoClient.processar(request);
}
```

Esse código parece inofensivo, mas não tem nenhuma noção de que a dependência pode estar degradada. Toda chamada aguarda o timeout completo antes de falhar, e a próxima chamada repete o mesmo processo, sem aprender nada com a anterior.

## Os três estados do circuit breaker

Um circuit breaker resolve isso agindo como o disjuntor elétrico do qual empresta o nome: monitora a taxa de falha das chamadas a uma dependência e, ao detectar que ela ultrapassou um limiar aceitável, interrompe o circuito, fazendo as chamadas seguintes falharem na hora, sem nem tentar contatar a dependência.

O padrão opera em três estados:

- **Fechado**: o estado normal. As chamadas passam livremente até a dependência, enquanto o circuit breaker observa a taxa de falha numa janela deslizante das últimas N chamadas.
- **Aberto**: quando a taxa de falha ultrapassa o limiar configurado, o circuito abre. Toda chamada seguinte falha imediatamente, geralmente lançando uma exceção específica, sem nenhuma tentativa real de rede.
- **Semiaberto**: depois de um intervalo de espera, o circuito deixa passar um número limitado de chamadas de teste. Se elas forem bem-sucedidas, o circuito fecha de novo; se falharem, ele volta a abrir e reinicia a espera.

```java
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)
    .slidingWindowSize(20)
    .waitDurationInOpenState(Duration.ofSeconds(30))
    .permittedNumberOfCallsInHalfOpenState(5)
    .build();

CircuitBreaker breaker = CircuitBreaker.of("pagamentos", config);

Supplier<Pagamento> decorado = CircuitBreaker
    .decorateSupplier(breaker, () -> pagamentoClient.processar(request));
```

Nessa configuração, o circuito abre quando 50% das últimas 20 chamadas falharem, espera 30 segundos antes de testar de novo, e nesse teste permite até 5 chamadas para decidir se fecha ou reabre. Esses três números são o ajuste fino do padrão, e errar neles tem efeitos bem diferentes: uma janela pequena demais abre o circuito por causa de uma falha pontual e isolada; um limiar baixo demais faz o mesmo; um tempo de espera curto demais testa a dependência antes dela ter chance real de se recuperar.

## O que fazer quando o circuito está aberto

Devolver erro direto para quem chamou já é uma melhoria enorme sobre deixar a thread presa num timeout, mas na maioria dos casos existe uma alternativa melhor: um fallback.

```java
Supplier<Pagamento> comFallback = CircuitBreaker.decorateSupplier(
    breaker,
    () -> pagamentoClient.processar(request)
);

Pagamento resultado = Try.ofSupplier(comFallback)
    .recover(CallNotPermittedException.class, ex -> pagamentoCache.ultimoConhecido(request))
    .get();
```

Um valor em cache, uma resposta degradada, ou até uma mensagem clara de "serviço temporariamente indisponível, tente novamente em instantes" são formas de o sistema continuar útil mesmo com uma dependência fora do ar. Nem toda operação tem um fallback razoável, mas quando existe, vale muito mais do que simplesmente propagar o erro.

## A ordem importa: circuit breaker por fora, retry por dentro

Um erro comum ao combinar circuit breaker com retry é inverter a ordem das camadas. Se o retry envolve o circuit breaker, cada tentativa de retry conta como uma nova chamada para a métrica de falha, e o comportamento fica previsível. Mas se o circuit breaker envolve o retry, uma única chamada de negócio pode gerar três ou quatro tentativas reais contra uma dependência que já está com taxa de falha alta, exatamente a carga adicional que o circuit breaker deveria evitar.

```java
Supplier<Pagamento> comRetry = Retry.decorateSupplier(
    retry,
    () -> pagamentoClient.processar(request)
);

Supplier<Pagamento> protegido = CircuitBreaker.decorateSupplier(
    breaker,
    comRetry
);
```

Aqui o circuit breaker fica por fora, decidindo se vale a pena tentar a chamada (incluindo seus retries) antes de sequer começar. Com o circuito aberto, nenhum retry chega a acontecer, porque a chamada inteira falha na primeira verificação.

## Circuit breaker não é rate limiting nem bulkhead

É fácil confundir os três, mas cada um protege uma coisa diferente. Rate limiting controla quanto um cliente pode consumir do seu sistema, geralmente na borda. Bulkhead isola recursos entre dependências diferentes, limitando quantas chamadas simultâneas cada uma pode ter, para que uma dependência lenta não consuma todas as threads disponíveis e deixe as outras dependências sem recurso nenhum. Circuit breaker, por sua vez, não limita volume nem isola recursos: ele decide, com base no histórico recente de falhas, se vale a pena sequer tentar chamar uma dependência específica.

Os três costumam aparecer juntos num serviço maduro, cada um resolvendo uma fatia do mesmo problema maior de resiliência, mas nenhum substitui os outros. Um circuit breaker perfeito não impede que uma dependência lenta (não necessariamente falhando, só lenta) esgote o bulkhead, por exemplo, porque chamadas lentas que eventualmente têm sucesso não contam como falha para o circuito.

## Quando vale a pena

Colocar um circuit breaker em toda chamada a qualquer dependência é exagero: para operações internas, rápidas e confiáveis, o overhead de monitorar estado some no ruído. O padrão compensa justamente nas chamadas que cruzam a fronteira do seu processo para um sistema externo (outro serviço, uma API de terceiro, um gateway de pagamento) onde a indisponibilidade é possível e previsível o bastante para merecer uma estratégia explícita. Se o seu sistema já sofreu uma indisponibilidade porque uma dependência externa ficou lenta ou caiu, e o sintoma se espalhou para serviços que não tinham nada a ver com o problema original, essa é a dependência que deveria estar atrás de um circuit breaker.
