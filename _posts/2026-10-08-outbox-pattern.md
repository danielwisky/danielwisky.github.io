---
layout: post
title: "Outbox Pattern: consistência entre banco de dados e mensageria"
subtitle: "Como evitar que um evento se perca justamente no momento em que mais importa"
tags: [Arquitetura, Apache Kafka]
---

Um cenário comum em sistemas que combinam banco de dados relacional com mensageria: um serviço grava um pedido no banco e, logo em seguida, publica um evento `PedidoCriado` no Kafka para que outros serviços reajam a essa mudança. Parece simples, mas entre essas duas operações existe uma janela perigosa. Se o banco confirma a escrita e o processo cai antes de publicar o evento, o pedido existe, mas ninguém mais no sistema fica sabendo. Se a ordem for invertida, publicando o evento antes do commit, o problema é o oposto: um consumidor pode reagir a um pedido que, por causa de um rollback, nunca chegou a existir de verdade.

## O problema de duas escritas que não são atômicas

O banco de dados e o broker de mensageria são dois sistemas diferentes, cada um com sua própria garantia de durabilidade, e não existe uma transação nativa que cubra os dois ao mesmo tempo. Transações distribuídas via two-phase commit existem na teoria, mas na prática quase nenhum broker moderno dá suporte real a isso, e mesmo quando dá, o custo de coordenação costuma ser alto demais para o ganho.

```java
@Transactional
public void criarPedido(NovoPedido novoPedido) {
    var pedido = pedidoRepository.save(Pedido.criar(novoPedido));
    kafkaTemplate.send("pedidos", new PedidoCriado(pedido.getId(), pedido.getValorTotal()));
}
```

Esse código parece correto à primeira vista, mas esconde o problema: o `@Transactional` cobre a escrita no banco, não o envio ao Kafka. Se o processo cair entre as duas linhas, ou se o Kafka estiver indisponível no momento do envio, o pedido fica salvo e o evento nunca sai. Pior ainda, se o envio ao Kafka for bem-sucedido mas a transação do banco falhar depois por qualquer motivo, o evento já foi publicado para um pedido que não existe.

## A ideia do Outbox Pattern

O Outbox Pattern resolve isso trocando duas escritas em sistemas diferentes por duas escritas no mesmo sistema. Em vez de publicar o evento diretamente no Kafka dentro da transação, a aplicação grava o evento numa tabela de outbox, no mesmo banco de dados e na mesma transação da escrita de negócio. As duas escritas acontecem atomicamente, porque são a mesma transação relacional.

```sql
CREATE TABLE outbox (
    id UUID PRIMARY KEY,
    aggregate_id VARCHAR NOT NULL,
    tipo_evento VARCHAR NOT NULL,
    payload JSONB NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    publicado BOOLEAN NOT NULL DEFAULT false
);
```

```java
@Transactional
public void criarPedido(NovoPedido novoPedido) {
    var pedido = pedidoRepository.save(Pedido.criar(novoPedido));
    outboxRepository.save(new OutboxEvent(
        pedido.getId(),
        "PedidoCriado",
        serializar(new PedidoCriado(pedido.getId(), pedido.getValorTotal()))
    ));
}
```

Se a transação falhar, nem o pedido nem o evento existem. Se a transação for confirmada, os dois existem, garantido pela mesma propriedade ACID que já protege qualquer outra escrita no banco. O que falta agora é tirar o evento da tabela de outbox e levá-lo de fato até o Kafka, e essa parte acontece fora da transação de negócio, de forma assíncrona.

## Levando o evento da tabela até o broker

Existem duas formas comuns de fazer essa segunda parte. A primeira é um processo separado, rodando em intervalos curtos, que consulta as linhas não publicadas, envia cada uma ao Kafka e marca como publicada depois da confirmação do broker:

```java
@Scheduled(fixedDelay = 500)
public void publicarEventosPendentes() {
    var eventos = outboxRepository.buscarNaoPublicados();
    for (var evento : eventos) {
        kafkaTemplate.send(evento.getTipoEvento(), evento.getPayload())
            .thenRun(() -> outboxRepository.marcarComoPublicado(evento.getId()));
    }
}
```

Essa abordagem é simples de implementar, mas tem um custo: faz polling constante numa tabela que, na maior parte do tempo, está vazia, e isso introduz uma latência mínima entre a escrita e a publicação, do tamanho do intervalo do agendamento.

A segunda forma, mais sofisticada, usa Change Data Capture para ler o write-ahead log do banco e reagir às inserções na tabela de outbox em tempo real, sem polling. O Debezium é a ferramenta mais usada para isso: ele monitora o log de replicação do Postgres ou do MySQL e publica cada linha inserida na outbox diretamente num tópico Kafka, tipicamente com latência de milissegundos e sem nenhuma consulta adicional ao banco.

## O que essa garantia não cobre

O Outbox Pattern garante que o evento será publicado pelo menos uma vez, não exatamente uma vez. Se o processo que publica cair depois de enviar ao Kafka mas antes de marcar a linha como publicada, o mesmo evento é reenviado na próxima execução. Isso significa que todo consumidor desses eventos precisa ser idempotente, processando o mesmo `PedidoCriado` duas vezes sem duplicar efeito, geralmente usando o identificador do evento para detectar reprocessamento.

Vale notar também que o pattern resolve a consistência entre escrever no banco e publicar um evento, não a ordem de entrega entre eventos diferentes, nem falhas do lado do consumidor. Um consumidor que falha ao processar o evento depois de recebido é um problema de retry e dead letter queue, uma camada diferente da que o outbox cobre.

## Quando vale a pena

Para sistemas em que publicar um evento é cosmético, como uma notificação de analytics que pode se perder sem maiores consequências, o custo de manter uma tabela de outbox e um processo de publicação raramente compensa. Mas em qualquer fluxo onde a ausência do evento significa um estado de negócio invisível, como pagamento confirmado, estoque reservado ou pedido criado, a régua é clara: se perder esse evento causaria um problema real de consistência entre serviços, o Outbox Pattern paga por si mesmo, trocando uma falha intermitente e difícil de reproduzir por uma garantia que a própria transação do banco já proporciona.
