---
layout: post
title: "Virtual Threads: a Concorrência mais Simples do Java 21+"
subtitle: "Como threads virtuais mudam a forma de escrever código concorrente sem trocar o modelo de programação"
tags: [Java, Virtual Threads]
---

Toda aplicação Java que faz muita chamada bloqueante (banco, HTTP, fila) esbarra cedo ou tarde no mesmo dilema: aceitar o custo de uma thread de sistema operacional por requisição, ou reescrever tudo em cima de programação reativa. As Virtual Threads, estáveis desde o Java 21 (JEP 444), resolvem isso sem obrigar ninguém a escolher a segunda opção.

## Por que threads de plataforma não escalam

Cada `Thread` tradicional (hoje chamada de *platform thread*) é, por baixo dos panos, uma thread do sistema operacional. Isso custa memória: alguns megabytes de stack por thread. E custa desempenho quando o número de threads simultâneas passa de alguns milhares, porque o sistema operacional gasta cada vez mais tempo só trocando contexto entre elas.

Foi esse limite que empurrou parte do ecossistema Java para programação reativa. WebFlux e RxJava evitam bloquear threads reescrevendo o fluxo como uma cadeia de callbacks. Funciona, só que o código fica bem mais difícil de ler e de depurar. Uma stack trace de código reativo raramente aponta pra onde o problema realmente está.

## O que muda na prática

Uma virtual thread ainda é uma `Thread` do ponto de vista da API, mesma classe, mesmos métodos. A diferença é que ela não ocupa uma thread de sistema operacional o tempo todo. A JVM mantém um número pequeno de *carrier threads* reais e vai montando virtual threads sobre elas só enquanto existe trabalho de CPU pra fazer. Quando uma virtual thread bloqueia esperando I/O, a JVM a desmonta da carrier thread, libera essa carrier thread pra outra tarefa, e retoma a original quando a resposta chega.

O resultado é que dá pra ter centenas de milhares de virtual threads vivas ao mesmo tempo, gastando muito menos memória que o mesmo número de threads de plataforma. E o código continua sequencial e bloqueante, do jeito que sempre se escreveu Java. Sem callback, sem operador encadeado. Bibliotecas de I/O já existentes, como JDBC ou `HttpClient`, se beneficiam automaticamente, sem precisar reescrever nada.

## Comparando os dois modelos

Um jeito comum de disparar chamadas em paralelo usa um pool de tamanho fixo:

```java
ExecutorService pool = Executors.newFixedThreadPool(200);

List<Future<String>> resultados = pedidos.stream()
    .map(pedido -> pool.submit(() -> consultarEstoque(pedido)))
    .toList();
```

O número 200 ali não é arbitrário: é o limite máximo de chamadas simultâneas que o sistema aguenta, mesmo que `consultarEstoque` passe a maior parte do tempo apenas esperando a rede responder.

Com virtual threads o executor muda e esse limite artificial some:

```java
try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> resultados = pedidos.stream()
        .map(pedido -> pool.submit(() -> consultarEstoque(pedido)))
        .toList();
}
```

Cada tarefa ganha a própria virtual thread, criada sob demanda e descartada no fim. Não existe mais "pool com N threads reutilizáveis". É a JVM que cuida de intercalar o trabalho real nas carrier threads que estão livres.

## Onde isso não ajuda

Virtual threads resolvem escala em I/O bloqueante, não paralelismo de CPU. Um laço que só faz conta pesada não fica mais rápido rodando em virtual threads, porque ali o gargalo é o número de núcleos disponíveis, e não a quantidade de threads. Pra isso, `ForkJoinPool` e streams paralelos continuam sendo a ferramenta certa.

Tem também o problema do *pinning*: um bloco `synchronized` prende a virtual thread na carrier thread durante toda a execução. Se esse bloco fizer I/O lento por dentro, parte do ganho desaparece. Quando isso vira gargalo de verdade, a saída costuma ser trocar `synchronized` por `ReentrantLock` nos pontos mais quentes do código.

## Vale a pena migrar

Não é preciso reescrever nada pra começar a usar. O ganho aparece já na troca do executor, em código que já existe. Pra aplicações dominadas por I/O, que é a maioria dos serviços web e de integração que a gente escreve no dia a dia, essa é uma daquelas mudanças que custam pouco e entregam throughput real.

No próximo post eu sigo nesse mesmo assunto com Structured Concurrency, que resolve o outro lado do problema: como gerenciar o ciclo de vida de várias tarefas concorrentes relacionadas sem perder o controle sobre cancelamento e erro.
