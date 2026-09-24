---
layout: post
title: "Virtual Threads: a Concorrência mais Simples do Java 21+"
subtitle: "Como threads virtuais mudam a forma de escrever código concorrente sem trocar o modelo de programação"
tags: [Java, Virtual Threads]
---

Desde sempre, escalar uma aplicação Java que faz muita chamada bloqueante (banco, HTTP, fila) significou uma escolha difícil: ou você aceita o custo de uma thread de sistema operacional por requisição, ou reescreve tudo em cima de programação reativa. As **Virtual Threads**, estáveis desde o Java 21 (JEP 444), resolvem esse dilema sem exigir a segunda opção.

## O problema das threads de plataforma

Cada `Thread` tradicional do Java (agora chamada de *platform thread*) é, por baixo dos panos, uma thread do sistema operacional. Isso tem um custo real: alguns megabytes de stack por thread, e um limite prático de alguns milhares de threads simultâneas antes do sistema começar a sofrer com troca de contexto.

Isso empurrou boa parte do ecossistema Java para programação reativa (WebFlux, RxJava): em vez de bloquear uma thread esperando I/O, o código é reescrito como uma cadeia de callbacks não bloqueantes. Funciona, mas o preço é a legibilidade — depurar uma stack trace de código reativo é notoriamente mais difícil que a de código sequencial.

## O que muda com Virtual Threads

Uma *virtual thread* também é uma `Thread` do ponto de vista da API — mesma classe, mesmos métodos —, mas não corresponde a uma thread de sistema operacional dedicada. A JVM mantém um pool pequeno de *carrier threads* (threads de plataforma) e vai "montando" as virtual threads sobre elas apenas enquanto há trabalho de CPU a fazer. Quando uma virtual thread bloqueia em I/O, a JVM desmonta ela da carrier thread, libera a carrier thread para outra virtual thread, e retoma a original quando o I/O termina.

Na prática, isso significa:

- Custo de criação e memória muito menor — dá para ter centenas de milhares de virtual threads ativas ao mesmo tempo.
- Código continua sequencial e bloqueante, como sempre foi escrito em Java. Sem callbacks, sem operadores encadeados.
- Bibliotecas de I/O bloqueante já existentes (JDBC, `HttpClient`, `java.io`) se beneficiam automaticamente, sem reescrita.

## Um exemplo prático

Antes, com um pool de threads de plataforma limitado:

```java
ExecutorService pool = Executors.newFixedThreadPool(200);

List<Future<String>> resultados = pedidos.stream()
    .map(pedido -> pool.submit(() -> consultarEstoque(pedido)))
    .toList();
```

Aqui, 200 é um número escolhido para não sobrecarregar o sistema — e é também o limite de chamadas simultâneas, mesmo que `consultarEstoque` passe a maior parte do tempo esperando a rede.

Com virtual threads, o executor muda, e o limite artificial desaparece:

```java
try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> resultados = pedidos.stream()
        .map(pedido -> pool.submit(() -> consultarEstoque(pedido)))
        .toList();
}
```

Cada tarefa ganha sua própria virtual thread, descartável, criada sob demanda. Não existe mais o conceito de "pool com N threads reutilizáveis" — a JVM cuida de intercalar o trabalho real nas carrier threads disponíveis.

## O que Virtual Threads não resolvem

Vale deixar claro: virtual threads atacam o problema de *escala em I/O bloqueante*, não de *paralelismo de CPU*. Um laço que só faz cálculo pesado não anda mais rápido rodando em virtual threads — para isso o gargalo continua sendo o número de núcleos disponíveis, e `ForkJoinPool`/streams paralelos continuam a ferramenta certa.

Outro ponto de atenção é o *pinning*: blocos `synchronized` ainda prendem a virtual thread na sua carrier thread durante a execução, anulando parte do ganho se o bloco sincronizado fizer I/O lento por dentro. A recomendação, quando isso for um problema real, é trocar `synchronized` por `java.util.concurrent.locks.ReentrantLock` nos pontos mais quentes.

## Conclusão

Virtual threads não introduzem um paradigma novo — o ganho é justamente esse: o mesmo estilo de código bloqueante e sequencial que qualquer desenvolvedor Java já escreve, agora escalando como se fosse assíncrono por baixo dos panos. Para aplicações dominadas por I/O (a maioria dos serviços web e de integração), é uma troca de duas linhas de configuração com potencial de ganho real de throughput.

No próximo post, sigo nesse mesmo assunto com **Structured Concurrency**, que resolve o outro lado do problema: gerenciar o ciclo de vida de várias tarefas concorrentes relacionadas sem perder o controle sobre cancelamento e erros.
