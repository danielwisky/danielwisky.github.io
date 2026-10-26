---
layout: post
title: "Saga Pattern: transações distribuídas sem transação distribuída"
subtitle: "Como coordenar várias operações entre serviços quando não existe mais um commit único que cubra todas"
tags: [Arquitetura, Design Pattern]
---

Um pedido de e-commerce passa por três serviços: pagamento, estoque e envio. Em um monolito, isso seria uma única transação de banco: debita o cartão, reserva o produto, agenda a entrega, e se qualquer passo falhar, um `ROLLBACK` desfaz tudo como se nada tivesse acontecido. Com o fluxo quebrado em três serviços independentes, cada um com seu próprio banco, essa garantia desaparece. O pagamento pode ser confirmado, o estoque pode falhar por falta de produto, e agora existe um cliente que pagou por algo que não vai receber, sem nenhum `ROLLBACK` que resolva isso automaticamente.

## Por que não dá para usar uma transação distribuída de verdade

A solução óbvia seria estender a transação do banco para cobrir os três serviços, usando um protocolo como two-phase commit. Na prática, isso exige que todos os participantes fiquem bloqueados segurando locks até que o coordenador decida se confirma ou desfaz tudo, o que em sistemas distribuídos reais significa acoplar a disponibilidade de um serviço à disponibilidade de todos os outros envolvidos na transação. Se o serviço de envio ficar lento ou indisponível, o pagamento e o estoque ficam travados esperando, mesmo que ambos já tenham terminado sua parte. A maioria dos brokers de mensageria e boa parte dos bancos modernos nem oferecem suporte real a esse protocolo, e onde oferecem, o custo de coordenação tende a ser alto demais para compensar.

O Saga Pattern parte de uma premissa diferente: em vez de uma transação atômica cobrindo tudo, cada serviço executa sua própria transação local e publica um evento avisando o que aconteceu. Se algum passo falhar depois que outros já tiverem sido concluídos, a saga não desfaz o passado com um `ROLLBACK`, ela compensa, executando uma ação que reverte o efeito de negócio daquele passo já concluído.

## Saga coreografada: cada serviço reage ao evento anterior

Numa saga coreografada, não existe um componente central dando ordens. Cada serviço publica um evento ao terminar sua parte, e os serviços seguintes reagem a esse evento, publicando o próximo por sua vez.

```java
@KafkaListener(topics = "pagamento-confirmado")
public void aoConfirmarPagamento(PagamentoConfirmado evento) {
    try {
        estoqueService.reservar(evento.getPedidoId(), evento.getItens());
        kafkaTemplate.send("estoque-reservado", new EstoqueReservado(evento.getPedidoId()));
    } catch (EstoqueInsuficienteException e) {
        kafkaTemplate.send("estoque-falhou", new EstoqueFalhou(evento.getPedidoId()));
    }
}
```

```java
@KafkaListener(topics = "estoque-falhou")
public void aoFalharEstoque(EstoqueFalhou evento) {
    pagamentoService.estornar(evento.getPedidoId());
}
```

Essa abordagem funciona bem para sagas curtas, com poucos passos, porque cada serviço só precisa conhecer o evento que recebe e o que publica, sem depender de um orquestrador externo. O problema aparece quando a saga cresce: entender o fluxo completo de princípio a fim exige rastrear eventos espalhados por vários serviços, e não existe um lugar único que descreva a sequência inteira. Adicionar um passo no meio do fluxo significa alterar o serviço anterior (para publicar o evento certo) e o próximo (para escutar o evento novo), uma mudança distribuída para o que deveria ser um ajuste local.

## Saga orquestrada: um coordenador central decide os passos

Numa saga orquestrada, existe um orquestrador que conhece o fluxo inteiro e comanda cada serviço explicitamente, esperando a resposta antes de decidir o próximo passo.

```java
public class PedidoSagaOrchestrator {

    public void executar(NovoPedido pedido) {
        try {
            pagamentoService.cobrar(pedido);
            estoqueService.reservar(pedido);
            envioService.agendar(pedido);
        } catch (EstoqueInsuficienteException e) {
            pagamentoService.estornar(pedido);
        } catch (EnvioIndisponivelException e) {
            estoqueService.liberar(pedido);
            pagamentoService.estornar(pedido);
        }
    }
}
```

O fluxo inteiro fica visível num único lugar, o que facilita entender o que acontece, adicionar um passo novo ou mudar a ordem. O custo é introduzir um componente a mais no sistema, e esse orquestrador vira um ponto que concentra conhecimento (e responsabilidade) sobre o processo de negócio inteiro. Para sagas com muitos passos e muitas ramificações de compensação, essa centralização costuma valer a pena: ferramentas como Camunda ou o Temporal existem justamente para modelar esses fluxos como máquinas de estado explícitas, com persistência do progresso e retomada automática em caso de falha do próprio orquestrador.

## Compensação não é rollback

A diferença mais importante entre uma transação local e uma saga é que compensar uma ação já concluída nem sempre é possível de forma perfeita. Estornar um pagamento é uma compensação direta, mas liberar um produto reservado para outro cliente comprar enquanto isso pode gerar uma segunda falha, dessa vez na compensação. Agendar um envio e depois cancelar pode significar que a transportadora já retirou o pacote fisicamente, e "desfazer" isso é uma operação logística, não uma linha de código.

Por isso, toda ação de uma saga que tem efeito observável fora do seu próprio banco (enviar um e-mail de confirmação, debitar um saldo visível ao cliente, disparar uma notificação push) precisa ter sua compensação pensada com o mesmo cuidado que a ação original. Às vezes a compensação simplesmente não anula o efeito, só minimiza o dano: um e-mail de confirmação que já foi enviado não pode ser "desenviado", mas pode ser seguido de um e-mail de cancelamento explicando o que houve.

## Consistência eventual, não consistência imediata

Durante a execução de uma saga, o sistema passa por estados intermediários que não existiriam numa transação atômica: o pagamento já foi confirmado, mas o estoque ainda não foi reservado, por exemplo. Qualquer serviço que leia esse estado nesse intervalo vê uma versão do pedido que ainda vai mudar. Isso é consistência eventual, e aceitar esse modelo é parte do custo de abrir mão de uma transação distribuída de verdade.

Para o usuário final, isso geralmente aparece como um pedido em status "processando" por alguns segundos antes de virar "confirmado", em vez de uma resposta imediata e definitiva. Modelar esse estado intermediário de forma explícita, com um status visível, costuma ser melhor do que tentar esconder a assincronia do cliente.

## Quando vale a pena

Uma saga adiciona complexidade real: mais eventos, mais estados intermediários, e a necessidade de pensar em compensação para cada passo. Para operações que vivem inteiramente dentro de um único serviço e seu próprio banco, uma transação local simples já resolve, e nenhuma saga é necessária. O padrão compensa quando o fluxo de negócio atravessa fronteiras de serviço e precisa de alguma garantia de que, se um passo no meio falhar, o sistema não fica num estado inconsistente que exige intervenção manual para corrigir. Se a sua arquitetura já tem múltiplos serviços participando de um mesmo processo de negócio, e hoje a resposta para "e se o terceiro passo falhar depois que os dois primeiros já terminaram" é "corrige na mão", é sinal de que o processo merece ser modelado como uma saga.
