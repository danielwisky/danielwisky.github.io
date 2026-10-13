---
layout: post
title: "Retry, backoff e jitter: tentando de novo sem piorar a situação"
subtitle: "Por que um retry ingênuo pode transformar uma falha passageira num incidente de verdade"
tags: [Arquitetura, APIs]
---

Um banco de dados fica indisponível por cinco segundos durante um failover. Os vinte serviços que dependem dele começam a receber erro, e cada um faz o que foi programado para fazer: tentar de novo. Imediatamente. Quando o banco volta, ele não recebe a carga normal, recebe a carga normal mais todas as tentativas acumuladas nos últimos segundos, todas chegando no mesmo instante. O banco, que acabou de se recuperar, cai de novo. E o ciclo se repete até alguém desligar alguma coisa na mão.

Retry é uma das ferramentas mais úteis para lidar com falhas passageiras, e também uma das mais fáceis de usar errado. A diferença entre as duas coisas está quase toda em três perguntas: o que retentar, quanto esperar entre as tentativas, e quando parar.

## Nem todo erro merece um retry

O primeiro filtro é saber se a falha tem chance de desaparecer sozinha. Um timeout de rede, um `503 Service Unavailable` ou uma conexão recusada durante um deploy são falhas transitórias: a mesma requisição, alguns instantes depois, tem boa chance de funcionar. Já um `400 Bad Request`, um `404` ou um `422` com erro de validação vão falhar exatamente igual na segunda, na terceira e na décima tentativa, porque o problema está na requisição, não no momento.

```java
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .retryExceptions(TimeoutException.class, ConnectException.class, ServicoIndisponivelException.class)
    .ignoreExceptions(RequisicaoInvalidaException.class, RecursoNaoEncontradoException.class)
    .build();
```

O segundo filtro, tão importante quanto o primeiro, é a idempotência. Retentar uma leitura é seguro. Retentar um `POST` que cria um pagamento só é seguro se o servidor souber reconhecer que aquela é a mesma operação de antes, normalmente via chave de idempotência. Sem isso, um timeout que aconteceu depois do servidor já ter processado a requisição vira uma cobrança duplicada na primeira nova tentativa, e o cliente não tem como saber qual dos dois cenários aconteceu.

## Backoff exponencial: dando tempo para a dependência respirar

Retentar imediatamente quase nunca ajuda. Se a dependência está sobrecarregada, mais requisições chegando sem intervalo só aumentam a sobrecarga. O backoff exponencial resolve isso fazendo cada tentativa esperar mais do que a anterior: 200ms, depois 400ms, depois 800ms, dobrando a cada vez até um teto.

A ideia é simples: se a falha foi um soluço de milissegundos, a primeira tentativa rápida resolve. Se o problema é mais sério, as esperas crescentes reduzem a pressão sobre a dependência justamente quando ela mais precisa de espaço para se recuperar. O teto existe porque, sem ele, a sexta ou sétima tentativa já estaria esperando dezenas de segundos, tempo em que o cliente original provavelmente já desistiu.

## O problema que o backoff sozinho não resolve

Backoff exponencial resolve a pressão de um cliente isolado, mas não resolve o cenário do início do post. Se vinte serviços falharam no mesmo instante e todos usam a mesma configuração de backoff, todos vão retentar em 200ms, depois todos juntos em 400ms, depois todos juntos em 800ms. As tentativas continuam sincronizadas, chegando em ondas, e cada onda tem chance de derrubar a dependência de novo. Esse efeito costuma ser chamado de thundering herd.

É aí que entra o jitter: adicionar uma aleatoriedade ao tempo de espera para que clientes diferentes se espalhem ao longo do intervalo em vez de baterem juntos.

```java
IntervalFunction backoffComJitter = IntervalFunction.ofExponentialRandomBackoff(
    Duration.ofMillis(200),
    2.0,
    0.5
);

RetryConfig config = RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(backoffComJitter)
    .build();
```

Nessa configuração, a espera base começa em 200ms e dobra a cada tentativa, mas o valor real é sorteado dentro de uma faixa de 50% para cima ou para baixo. Uma variante bastante usada, conhecida como full jitter, vai além e sorteia a espera entre zero e o valor calculado pelo backoff. Parece contraintuitivo deixar algumas tentativas acontecerem quase de imediato, mas no agregado isso espalha muito melhor a carga ao longo do tempo, que é exatamente o que uma dependência se recuperando precisa.

## Quando o servidor diz quanto esperar

Alguns servidores já respondem com a informação de que você precisa. Um `429 Too Many Requests` ou um `503` acompanhado do header `Retry-After` está dizendo explicitamente quando faz sentido tentar de novo. Ignorar esse header e aplicar o próprio backoff é desperdiçar a melhor informação disponível: o servidor sabe melhor do que o cliente quando vai ter capacidade de novo. Se o header vier, ele deveria ter prioridade sobre o intervalo calculado.

## Retry em camadas multiplica a carga

Um cuidado que costuma passar despercebido é o retry acontecendo em vários níveis ao mesmo tempo. O frontend faz até três tentativas de chamar o BFF. O BFF faz até três tentativas de chamar o serviço de pedidos. O serviço de pedidos faz até três tentativas de chamar o banco. Uma única ação do usuário, numa dependência quebrada lá no fundo, pode virar 27 tentativas contra o banco, e isso multiplicado por todos os usuários que estão clicando no botão ao mesmo tempo.

A regra prática é concentrar o retry numa camada só, geralmente a mais próxima da dependência que falha, e fazer as camadas de cima falharem rápido. Algumas bibliotecas e service meshes também oferecem a ideia de retry budget: em vez de um número fixo de tentativas por requisição, limitar os retries a uma fração do tráfego total, de forma que, quando muita coisa começa a falhar ao mesmo tempo, o sistema para de retentar em vez de amplificar o problema.

## Retry e circuit breaker trabalham juntos

Retry é a ferramenta certa para falhas curtas e esporádicas. Para falhas prolongadas, ele só prolonga o sofrimento: cada requisição gasta todas as suas tentativas e esperas antes de falhar, segurando threads e conexões nesse meio tempo. É por isso que retry quase sempre aparece acompanhado de um circuit breaker por fora, que percebe quando a dependência está caída de verdade e corta as chamadas antes mesmo do primeiro retry começar.

Também vale lembrar que o tempo total gasto com retries precisa caber no timeout de quem chamou. Quatro tentativas, somando o timeout de cada uma às esperas do backoff, podem facilmente passar de alguns segundos, e se o cliente do seu serviço desiste depois de dois, todo esse esforço é trabalho jogado fora que ainda por cima consumiu recursos dos dois lados.

## O retry que vale a pena ter

Um bom retry é seletivo, paciente e tem limite. Retenta só o que pode dar certo na próxima vez, só o que é seguro repetir, espera cada vez mais entre as tentativas, espalha essas tentativas com jitter para não sincronizar com os outros clientes, e desiste cedo o bastante para não piorar a situação de quem já está com problemas. Sem esses cuidados, o mecanismo que deveria tornar o sistema mais resiliente vira o principal responsável por transformar cinco segundos de failover em uma hora de incidente.
