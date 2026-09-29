---
layout: post
title: "Idempotência em APIs: por que reenviar a mesma requisição não pode dar errado"
subtitle: "O conceito que evita cobrança duplicada, pedido duplicado e dor de cabeça em produção"
tags: [APIs, Programação]
---

Todo sistema distribuído eventualmente perde uma resposta. O cliente manda uma requisição, o servidor processa, mas a rede cai antes da resposta voltar. O que o cliente faz nesse momento? Tenta de novo, porque não tem como saber se o pedido foi processado ou não. Se o servidor não estiver preparado pra isso, a segunda tentativa processa tudo de novo: cobra o cartão duas vezes, cria dois pedidos, envia dois e-mails. Idempotência é a propriedade que evita esse tipo de problema, e é surpreendente quantas APIs em produção não pensam nisso até o primeiro incidente.

## O que idempotência significa, formalmente

Uma operação é idempotente quando executá-la uma vez ou várias vezes, com os mesmos dados de entrada, produz o mesmo resultado no sistema. Isso não quer dizer que a resposta HTTP é sempre igual, quer dizer que o efeito colateral no servidor acontece só uma vez.

O próprio HTTP já embute essa ideia nos verbos:

- `GET`, `PUT` e `DELETE` são definidos como idempotentes pela especificação. Repetir um `PUT` com o mesmo corpo deve deixar o recurso no mesmo estado final, e repetir um `DELETE` deve manter o recurso apagado, mesmo que a segunda chamada responda 404 em vez de 204.
- `POST` não é idempotente por definição, e é exatamente aí que mora o problema. Criar um pedido, iniciar um pagamento, disparar um e-mail: todas essas operações costumam ser feitas via `POST`, e são justamente as que mais doem quando duplicadas.

Seguir a semântica correta dos verbos já resolve parte do problema, mas endpoints de criação continuam expostos ao risco de duplicação por retry, e é aí que entra a técnica mais usada na prática.

## Chave de idempotência

A solução consolidada é o cliente gerar um identificador único por operação de negócio, normalmente um UUID, e enviar esse valor num header a cada tentativa da mesma requisição:

```http
POST /pagamentos HTTP/1.1
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json

{"valor": 150.00, "destinatario": "12345"}
```

Do lado do servidor, a lógica é simples de descrever e um pouco mais delicada de implementar direito:

1. Antes de processar, verifica se já existe um registro com essa chave.
2. Se não existe, processa a operação normalmente e salva o resultado associado à chave, dentro da mesma transação que efetiva a operação de negócio.
3. Se já existe, não processa de novo: devolve a resposta salva da primeira execução.

```java
public ResponseEntity<Pagamento> criar(String idempotencyKey, PagamentoRequest req) {
    var existente = idempotencyStore.buscar(idempotencyKey);
    if (existente.isPresent()) {
        return ResponseEntity.ok(existente.get());
    }

    var pagamento = pagamentoService.processar(req);
    idempotencyStore.salvar(idempotencyKey, pagamento);
    return ResponseEntity.ok(pagamento);
}
```

O detalhe que costuma passar despercebido é o ponto 2: salvar o resultado precisa estar na mesma transação que a operação de negócio, ou o sistema fica vulnerável a uma janela de corrida. Duas requisições com a mesma chave, chegando quase ao mesmo tempo, podem passar pela checagem do passo 1 antes de qualquer uma delas ter salvo o registro, e as duas acabam processando. Resolver isso exige uma constraint de unicidade no banco sobre a chave de idempotência, fazendo a segunda escrita falhar por violação de índice único em vez de depender só da checagem lógica.

## Onde guardar a chave e por quanto tempo

Manter esse registro para sempre não escala, mas descartar cedo demais reabre a janela de duplicação em retries mais lentos. Na prática, um TTL de 24 horas costuma ser suficiente: cobre timeouts de rede, filas com reprocessamento e até um usuário que atualiza a página e reenvia o formulário sem perceber. Redis é uma escolha comum aqui, exatamente pela expiração automática nativa e pela latência baixa de leitura antes de decidir se processa ou não.

Vale reforçar que a chave de idempotência representa uma tentativa de operação, não o corpo da requisição em si. Se o cliente reenviar a mesma chave com um corpo diferente, o comportamento correto é rejeitar com 422, e não silenciosamente processar o novo corpo ou devolver o resultado antigo como se nada tivesse mudado. Isso evita um bug sutil: um cliente que reaproveita uma chave por engano nunca percebe que os dados que ele queria enviar foram ignorados.

## Idempotência não é só sobre APIs HTTP

O mesmo problema aparece em consumidores de fila. Kafka, SQS e RabbitMQ garantem entrega "at least once" na configuração mais comum, o que significa que a mesma mensagem pode chegar duas vezes ao consumidor, seja por reprocessamento após falha de commit do offset, seja por retry do próprio broker. Um consumidor que debita saldo, envia notificação ou insere um registro sem checar duplicidade tem exatamente o mesmo risco de um endpoint `POST` sem chave de idempotência, só que a causa muda: não é o cliente que reenvia, é a infraestrutura de mensageria.

A solução segue o mesmo princípio: usar um identificador da mensagem (o próprio `messageId`, ou um campo de negócio que identifique a operação de forma única) e checar antes de aplicar o efeito colateral, guardando o registro de processamento na mesma transação que grava o resultado.

## Quando vale o esforço

Nem toda operação precisa desse cuidado. Um `GET` que lista pedidos não tem efeito colateral, não corre risco nenhum. A régua prática é perguntar: essa operação move dinheiro, cria um recurso que custa caro desfazer, ou dispara algo irreversível como um e-mail ou uma notificação push? Se a resposta for sim, a chave de idempotência não é um exagero de engenharia, é o mínimo pra não acordar de madrugada por causa de um cliente pago duas vezes.
