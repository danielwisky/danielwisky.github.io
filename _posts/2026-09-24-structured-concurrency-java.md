---
layout: post
title: "Structured Concurrency: Organizando Tarefas Concorrentes no Java"
subtitle: "Como tratar um grupo de tarefas assíncronas como uma unidade só, com cancelamento e erros sob controle"
tags: [Java, Structured Concurrency]
---

No post anterior sobre [Virtual Threads](/2026-09-23-virtual-threads-java/) eu mostrei como o Java passou a suportar centenas de milhares de threads baratas para código bloqueante. Isso resolve o custo de criar threads, mas não resolve um problema mais antigo: quando várias tarefas concorrentes trabalham juntas para produzir um resultado, quem garante que todas terminam, que erros não se perdem, e que cancelar uma cancela as outras? É esse o problema que a **Structured Concurrency** ataca.

## O problema da concorrência "solta"

O jeito clássico de disparar tarefas em paralelo em Java usa um `ExecutorService` e `Future`s soltos:

```java
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

Future<Usuario> usuarioFuture = pool.submit(() -> buscarUsuario(id));
Future<List<Pedido>> pedidosFuture = pool.submit(() -> buscarPedidos(id));

Usuario usuario = usuarioFuture.get();
List<Pedido> pedidos = pedidosFuture.get();
```

Esse código tem falhas sutis. Se `buscarPedidos` lançar uma exceção, `usuarioFuture.get()` já pode ter retornado com sucesso — e o programa segue com um resultado parcial, ou trata o erro tarde demais, depois de já ter gasto trabalho com a outra tarefa. Se quem chamou o método for cancelado (por timeout, por exemplo), nada avisa `buscarUsuario` e `buscarPedidos` para pararem: elas continuam rodando, consumindo recursos, órfãs.

O nome para esse padrão problemático é *concorrência não estruturada*: o ciclo de vida das tarefas filhas não está amarrado ao ciclo de vida da tarefa que as criou.

## O que a Structured Concurrency propõe

A ideia, presente na API `StructuredTaskScope` (finalizada no Java 25, depois de várias rodadas de preview), é simples: tarefas concorrentes disparadas dentro de um escopo **não podem escapar dele**. O escopo só termina quando todas as tarefas terminam — com sucesso, com erro, ou canceladas —, e um erro em qualquer uma delas pode propagar e cancelar as irmãs automaticamente.

```java
try (var scope = StructuredTaskScope.open(Joiner.<Usuario, List<Pedido>>awaitAll())) {
    var usuarioTask = scope.fork(() -> buscarUsuario(id));
    var pedidosTask = scope.fork(() -> buscarPedidos(id));

    scope.join();

    Usuario usuario = usuarioTask.get();
    List<Pedido> pedidos = pedidosTask.get();
}
```

A diferença não é só estética. Ao sair do bloco `try`, o `StructuredTaskScope` garante que:

- Nenhuma das duas tarefas continua rodando em segundo plano — ambas terminaram, uma forma ou de outra.
- Se `buscarPedidos` falhar, a exceção se propaga para fora do `scope.join()`, e a implementação de `Joiner` usada decide o que fazer com a tarefa irmã ainda em andamento (cancelar, por exemplo).
- A árvore de chamadas fica visível na stack trace como uma hierarquia real, não como duas tarefas soltas que só coincidem por estarem no mesmo método.

## "Primeiro que responder, ganha"

Um caso de uso comum é buscar o mesmo dado em duas fontes redundantes e usar a que responder primeiro, cancelando a outra:

```java
try (var scope = StructuredTaskScope.open(Joiner.<String>anySuccessfulResultOrThrow())) {
    scope.fork(() -> buscarNoCacheRegional());
    scope.fork(() -> buscarNoCacheGlobal());

    String resultado = scope.join();
}
```

Assim que uma das duas tarefas retorna com sucesso, a outra é cancelada automaticamente — sem precisar de nenhum código manual de coordenação com `CompletableFuture.anyOf` ou variáveis de controle compartilhadas.

## Por que isso importa combinado com Virtual Threads

Virtual threads tornaram barato disparar uma tarefa concorrente para cada sub-chamada de I/O. Sem structured concurrency, isso tende a produzir código com muitas tarefas soltas, cada uma com seu próprio tratamento de erro e cancelamento — exatamente o tipo de bug difícil de reproduzir que aparece só em produção, sob carga. A structured concurrency dá a essas tarefas baratas uma estrutura de ciclo de vida clara, do mesmo jeito que um bloco `try-with-resources` dá a recursos como conexões e arquivos.

## Conclusão

Virtual threads resolveram o custo de escalar concorrência; structured concurrency resolve o risco de perder o controle dela. Juntas, elas formam a resposta do Java moderno para código concorrente que continua parecendo código sequencial normal — sem sacrificar legibilidade, e sem os efeitos colaterais de tarefas órfãs que a programação assíncrona "manual" sempre carregou.
