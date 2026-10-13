---
layout: post
title: "Observer: quando um objeto precisa avisar vários outros sem conhecê-los"
subtitle: "A base por trás de listeners, eventos e boa parte dos frameworks que você já usa"
tags: [Design Pattern]
---

Um serviço de pedidos confirma um pagamento e, a partir daí, várias coisas precisam acontecer: enviar e-mail de confirmação, atualizar o estoque, disparar uma notificação push, registrar no histórico de auditoria. A forma mais direta de escrever isso é chamar tudo explicitamente, uma coisa atrás da outra:

```java
public void confirmarPagamento(Pedido pedido) {
    pedido.setStatus(Status.PAGO);
    emailService.enviarConfirmacao(pedido);
    estoqueService.atualizar(pedido);
    notificacaoService.enviarPush(pedido);
    auditoriaService.registrar(pedido);
}
```

O problema aparece quando uma quinta ação precisa ser adicionada: o método `confirmarPagamento` precisa ser editado de novo, mesmo que a lógica de confirmar o pagamento em si não tenha mudado em nada. Esse método também passa a conhecer e depender diretamente de quatro serviços diferentes, só para avisá-los que algo aconteceu.

## Inverter quem depende de quem

O Observer propõe o contrário: em vez do serviço de pagamento conhecer cada interessado, ele mantém uma lista de "observadores" genéricos e só avisa que um evento ocorreu, sem saber quem está ouvindo nem o que cada um vai fazer com essa informação.

```java
public interface PagamentoObserver {
    void aoConfirmarPagamento(Pedido pedido);
}

public class PagamentoService {

    private final List<PagamentoObserver> observadores = new ArrayList<>();

    public void registrar(PagamentoObserver observer) {
        observadores.add(observer);
    }

    public void confirmarPagamento(Pedido pedido) {
        pedido.setStatus(Status.PAGO);
        observadores.forEach(observer -> observer.aoConfirmarPagamento(pedido));
    }
}
```

Cada ação vira uma classe que implementa a interface comum, sem que `PagamentoService` saiba nada sobre elas além do contrato:

```java
public class EmailObserver implements PagamentoObserver {
    @Override
    public void aoConfirmarPagamento(Pedido pedido) {
        emailService.enviarConfirmacao(pedido);
    }
}

public class EstoqueObserver implements PagamentoObserver {
    @Override
    public void aoConfirmarPagamento(Pedido pedido) {
        estoqueService.atualizar(pedido);
    }
}
```

```java
PagamentoService service = new PagamentoService();
service.registrar(new EmailObserver());
service.registrar(new EstoqueObserver());
service.registrar(new AuditoriaObserver());
```

Adicionar uma quinta ação significa criar uma classe nova e registrá-la, sem tocar em `PagamentoService`. E se um observador específico falhar com uma exceção, isso não deveria derrubar os demais nem o fluxo de pagamento em si, algo que a versão com chamadas diretas já expunha como risco desde o início (um `emailService` fora do ar derrubando a confirmação do pagamento inteiro).

## A versão que já existe no Java

Antes de qualquer framework de eventos, o próprio `java.util` já tinha uma modelagem parecida com `Observable` (hoje obsoleta, mas didática), e o padrão aparece sob outros nomes em praticamente toda base de código: listeners de UI (`addActionListener`), callbacks de `CompletableFuture`, ou os `@EventListener` do Spring, que registram métodos como observadores de eventos publicados em qualquer lugar da aplicação.

```java
@EventListener
public void aoConfirmarPagamento(PagamentoConfirmadoEvent evento) {
    estoqueService.atualizar(evento.getPedido());
}
```

A ideia de fundo é a mesma do exemplo manual: quem publica o evento não conhece nem precisa conhecer quem está escutando.

## O cuidado com a ordem e com falhas

Como os observadores são notificados numa lista, a ordem de registro geralmente vira a ordem de execução, o que pode criar dependências implícitas se um observador assumir (erradamente) que outro já rodou antes dele. Também vale decidir de forma explícita se a notificação é síncrona, bloqueando o fluxo principal até todos os observadores terminarem, ou assíncrona, publicando os eventos numa fila e seguindo em frente; a segunda opção evita que um observador lento (como um envio de e-mail) atrase uma confirmação de pagamento que já deveria ter terminado.

## Quando vale a pena

Observer compensa quando várias partes do sistema precisam reagir ao mesmo acontecimento, e principalmente quando essa lista de interessados tende a crescer com o tempo. Para uma ou duas ações fixas que nunca mudam, chamar os métodos diretamente é mais simples de ler e de depurar, sem a indireção de descobrir quem está escutando o quê.

Fonte:
<a href="https://refactoring.guru/pt-br/design-patterns/observer" target="_blank">Refactoring Guru</a>.

Um grande abraço e até o próximo post!
