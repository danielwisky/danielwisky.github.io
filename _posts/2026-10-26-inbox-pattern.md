---
layout: post
title: "Inbox Pattern: consumidores idempotentes de verdade"
subtitle: "O outro lado do Outbox, para quando a mesma mensagem chega duas vezes"
tags: [Arquitetura, Apache Kafka]
---

No post sobre o [Outbox Pattern](/2026-10-08-outbox-pattern/) ficou uma conta em aberto: o outbox garante que o evento será publicado pelo menos uma vez, não exatamente uma vez. E isso não é exclusividade dele. A configuração mais comum de produtor, broker e consumidor entrega mensagens com semântica de "pelo menos uma vez". O Kafka até oferece transações com exactly-once, mas essa garantia vale para fluxos que leem e escrevem no próprio Kafka; quando o efeito do consumidor é gravar num banco de dados, ela não chega lá. Um rebalance no Kafka, um timeout no commit do offset ou um deploy no meio do processamento e pronto: a mesma mensagem chega de novo. O Inbox Pattern é a forma mais direta de lidar com isso do lado de quem consome.

## Por que a mensagem chega duplicada

Pense num consumidor que recebe `PagamentoConfirmado`, atualiza o pedido para "pago" e commita o offset no Kafka. São duas operações em sistemas diferentes, exatamente o mesmo problema que o outbox resolve do lado do produtor. Se o consumidor grava no banco e cai antes de commitar o offset, quando ele voltar (ou quando outra instância assumir a partição) vai ler a mesma mensagem e processar tudo outra vez.

Commitar o offset antes de processar inverte o problema: se o processamento falhar depois do commit, a mensagem se perde. Entre perder e duplicar, quase sempre a escolha é duplicar, e aí a responsabilidade de não repetir o efeito fica com o consumidor.

Para alguns efeitos isso é inofensivo. Marcar um pedido como "pago" duas vezes dá no mesmo. Mas creditar pontos de fidelidade, enviar um e-mail ou baixar estoque duas vezes é um bug visível.

## A ideia do Inbox Pattern

O Inbox espelha o Outbox. Em vez de confiar que cada mensagem chega uma vez só, o consumidor grava o identificador de toda mensagem processada numa tabela de inbox, na mesma transação do efeito de negócio. Antes de processar, ele confere se aquele identificador já está lá.

```sql
CREATE TABLE inbox (
    mensagem_id UUID PRIMARY KEY,
    tipo_evento VARCHAR NOT NULL,
    processado_em TIMESTAMP NOT NULL DEFAULT now()
);
```

A chave primária é o que faz o trabalho pesado. Se duas instâncias tentarem processar a mesma mensagem ao mesmo tempo, o que pode acontecer durante um rebalance, só uma consegue inserir a linha. A outra fica esperando a primeira transação terminar e, se ela for confirmada, descobre que a mensagem já foi registrada.

```java
@Transactional
public void aoReceber(PagamentoConfirmado evento) {
    boolean novo = inboxRepository.registrarSeNovo(evento.id(), "PagamentoConfirmado");
    if (!novo) {
        log.info("Mensagem {} já processada, ignorando", evento.id());
        return;
    }
    fidelidadeService.creditarPontos(evento.clienteId(), evento.valor());
}
```

```sql
-- registrarSeNovo
INSERT INTO inbox (mensagem_id, tipo_evento)
VALUES (:id, :tipo)
ON CONFLICT (mensagem_id) DO NOTHING;
```

O exemplo usa a sintaxe do PostgreSQL; no MySQL o equivalente é o `INSERT IGNORE`. O `registrarSeNovo` olha o número de linhas afetadas pelo insert e devolve `true` se a linha foi inserida e `false` se já existia. Como o registro na inbox e o crédito dos pontos estão na mesma transação, ou os dois acontecem, ou nenhum. Se o processo cair depois do commit no banco e antes do commit do offset, a mensagem volta, a inserção não acontece e o consumidor simplesmente segue em frente.

## De onde vem o identificador

O pattern depende de um identificador estável por mensagem, e esse é o ponto que mais dá problema na prática. Gerar um UUID novo no momento do envio não serve se o envio puder ser repetido com um UUID diferente, porque aí o duplicado parece outra mensagem.

O ideal é que o id nasça junto com o evento, antes de qualquer tentativa de publicação. Se o produtor usa outbox, o próprio `id` da linha da tabela de outbox é um ótimo candidato: ele é criado uma vez, na transação de negócio, e reenviado igual em toda nova tentativa. Mandar esse valor num header da mensagem deixa o contrato explícito para quem consome.

Usar a combinação de tópico, partição e offset também funciona para detectar reentrega do mesmo registro, mas não protege contra o produtor publicar duas vezes o mesmo evento como registros diferentes. Por isso o id de negócio do evento costuma ser a escolha mais segura.

## Inbox para processar depois

Existe uma variação em que a inbox guarda a mensagem inteira, não só o id. O consumidor apenas grava o payload na tabela e commita o offset, e um processo separado lê as mensagens pendentes e executa a lógica de negócio. É exatamente o inverso do publicador do outbox.

Essa versão desacopla o ritmo do consumo do ritmo do processamento, facilita reprocessar mensagens com falha sem depender do broker e deixa um histórico consultável do que chegou. O custo é mais uma peça para operar e um pouco mais de latência. Para a maioria dos casos, a versão simples, só com o id, já resolve.

## Os cuidados que ficam

A tabela de inbox cresce para sempre se ninguém fizer nada. Uma rotina que apaga registros mais antigos que a janela em que uma reentrega é plausível (dias, não anos) mantém o tamanho sob controle. Vale lembrar que essa janela precisa ser maior que a retenção do tópico se houver chance de alguém reprocessar desde o começo.

Também é bom ter claro o que o Inbox não cobre. Ele garante que o efeito no seu banco acontece uma vez só. Se o processamento chama uma API externa, como um gateway de pagamento ou um serviço de e-mail, essa chamada fica fora da transação e pode acontecer duas vezes. Nesses casos, a saída é propagar uma chave de idempotência para o serviço externo, assunto do post sobre [idempotência em APIs](/2026-09-29-idempotencia-em-apis/).

## Quando vale a pena

Se o efeito do consumidor já é naturalmente idempotente, como sobrescrever um status ou fazer upsert de um registro pelo id, uma tabela de inbox é peso extra. Mas quando o processamento soma, subtrai, envia ou cria alguma coisa, o Inbox é a forma mais simples de transformar a entrega "pelo menos uma vez" em efeito "exatamente uma vez", usando a mesma transação de banco que você já tem. Junto com o Outbox, ele fecha o ciclo: nada se perde na saída e nada se repete na chegada.
