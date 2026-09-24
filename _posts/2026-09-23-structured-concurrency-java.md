---
layout: post
title: "Structured Concurrency: Organizando Tarefas Concorrentes no Java"
subtitle: "Como tratar um grupo de tarefas assíncronas como uma unidade só, com cancelamento e erros sob controle"
tags: [Java, Structured Concurrency]
---

No post anterior sobre [Virtual Threads](/2026-09-22-virtual-threads-java/) eu mostrei como o Java passou a suportar centenas de milhares de threads baratas pra código bloqueante. Isso resolve o custo de criar threads, mas não resolve um problema mais antigo: quando várias tarefas concorrentes trabalham juntas pra produzir um resultado, quem garante que todas terminam, que erro não se perde no meio do caminho, e que cancelar uma cancela as outras? É esse o problema que a Structured Concurrency ataca.

## O problema da concorrência solta

O jeito clássico de disparar tarefas em paralelo em Java usa um `ExecutorService` e `Future`s soltos:

```java
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

Future<Usuario> usuarioFuture = pool.submit(() -> buscarUsuario(id));
Future<List<Pedido>> pedidosFuture = pool.submit(() -> buscarPedidos(id));

Usuario usuario = usuarioFuture.get();
List<Pedido> pedidos = pedidosFuture.get();
```

Esse código tem falhas sutis. Se `buscarPedidos` lançar uma exceção, `usuarioFuture.get()` já pode ter retornado com sucesso, e o programa segue com um resultado parcial, ou só trata o erro tarde demais, depois de já ter gasto trabalho com a outra tarefa. Se quem chamou o método for cancelado, por timeout por exemplo, nada avisa `buscarUsuario` e `buscarPedidos` pra pararem. Elas continuam rodando, órfãs, consumindo recursos de graça.

Esse padrão tem nome: concorrência não estruturada. O ciclo de vida das tarefas filhas não está amarrado ao ciclo de vida da tarefa que as criou.

## O que muda com escopos estruturados

A ideia da API `StructuredTaskScope`, em preview desde o Java 21 e já na quinta rodada de preview no Java 25 (ainda exige a flag `--enable-preview` pra compilar e rodar), é simples de enunciar: tarefas disparadas dentro de um escopo não podem escapar dele. O escopo só termina quando todas as tarefas terminam, com sucesso, com erro ou canceladas. E um erro em qualquer uma delas pode propagar e cancelar as irmãs de forma automática.

```java
try (var scope = StructuredTaskScope.open(Joiner.<Usuario, List<Pedido>>awaitAllSuccessfulOrThrow())) {
    var usuarioTask = scope.fork(() -> buscarUsuario(id));
    var pedidosTask = scope.fork(() -> buscarPedidos(id));

    scope.join();

    Usuario usuario = usuarioTask.get();
    List<Pedido> pedidos = pedidosTask.get();
}
```

Ao sair do bloco `try`, o escopo garante três coisas. Nenhuma das duas tarefas continua rodando em segundo plano, ambas já terminaram de um jeito ou de outro. Se `buscarPedidos` falhar, a exceção se propaga pra fora do `scope.join()`, e o `Joiner` usado decide o que fazer com a tarefa irmã que ainda estava em andamento. E a árvore de chamadas aparece na stack trace como uma hierarquia real, não como duas tarefas soltas que só coincidem por estarem no mesmo método.

## Primeiro que responder, ganha

Um caso de uso comum é buscar o mesmo dado em duas fontes redundantes e usar a que responder primeiro, cancelando a outra:

```java
try (var scope = StructuredTaskScope.open(Joiner.<String>anySuccessfulResultOrThrow())) {
    scope.fork(() -> buscarNoCacheRegional());
    scope.fork(() -> buscarNoCacheGlobal());

    String resultado = scope.join();
}
```

Assim que uma das duas retorna com sucesso, a outra é cancelada na hora, sem precisar de `CompletableFuture.anyOf` nem de variável de controle compartilhada pra coordenar isso manualmente.

## Por que isso importa junto com Virtual Threads

Virtual threads tornaram barato disparar uma tarefa concorrente pra cada sub-chamada de I/O. Sem structured concurrency, isso tende a produzir código cheio de tarefas soltas, cada uma com seu próprio tratamento de erro e cancelamento. É exatamente o tipo de bug que só aparece em produção, sob carga, difícil de reproduzir num ambiente controlado. A structured concurrency dá a essas tarefas baratas uma estrutura de ciclo de vida clara, do mesmo jeito que `try-with-resources` já faz com conexões e arquivos.

## Conclusão

Virtual threads resolveram o custo de escalar concorrência. Structured concurrency resolve o risco de perder o controle dela. As duas juntas são a resposta do Java atual pra escrever código concorrente que continua parecendo código sequencial normal, sem abrir mão de legibilidade e sem os efeitos colaterais de tarefa órfã que a concorrência manual sempre carregou.
