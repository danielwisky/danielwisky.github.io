---
layout: post
title: "Factory Method: quando o construtor não basta"
subtitle: "Como delegar a criação de objetos sem espalhar `new` e `if` por todo o código"
tags: [Design Pattern]
---

Um sistema de notificações precisa enviar mensagens por e-mail, SMS ou push, dependendo da preferência do usuário. A forma mais direta de escrever isso é um método com um `switch` que decide qual classe instanciar:

```java
public Notificador criar(String tipo) {
    switch (tipo) {
        case "email": return new NotificadorEmail();
        case "sms": return new NotificadorSms();
        case "push": return new NotificadorPush();
        default: throw new IllegalArgumentException("Tipo desconhecido: " + tipo);
    }
}
```

Funciona, mas esse `switch` tende a se espalhar. Toda vez que alguém precisa criar um notificador, o código some com esse mesmo bloco de decisão, repetido em métodos diferentes. E quando aparece um quarto canal, cada uma dessas cópias precisa ser lembrada e atualizada junto.

## O que o Factory Method propõe

A ideia central é simples: em vez de instanciar a classe concreta diretamente, delega-se a criação para um método específico, que pode ser sobrescrito por subclasses. Quem usa o objeto não sabe (nem precisa saber) qual classe concreta foi instanciada, só conhece a interface comum.

```java
public interface Notificador {
    void enviar(String mensagem, String destinatario);
}

public abstract class NotificacaoService {

    public void notificar(String mensagem, String destinatario) {
        Notificador notificador = criarNotificador();
        notificador.enviar(mensagem, destinatario);
    }

    protected abstract Notificador criarNotificador();
}
```

Cada canal vira uma subclasse que só precisa saber criar seu próprio notificador:

```java
public class NotificacaoEmailService extends NotificacaoService {
    @Override
    protected Notificador criarNotificador() {
        return new NotificadorEmail();
    }
}

public class NotificacaoSmsService extends NotificacaoService {
    @Override
    protected Notificador criarNotificador() {
        return new NotificadorSms();
    }
}
```

O método `notificar` nunca muda, independente de quantos canais existam. Adicionar um canal novo significa criar uma subclasse nova, sem tocar no código que já funciona, o que é exatamente o princípio aberto/fechado na prática.

## A versão mais comum no dia a dia: fábrica estática

Em bases de código reais, o Factory Method raramente aparece com herança explícita como no exemplo acima. A variante mais comum é uma classe fábrica com um método estático que centraliza a decisão, mantendo o mesmo objetivo de esconder a escolha da classe concreta:

```java
public class NotificadorFactory {

    public static Notificador criar(CanalNotificacao canal) {
        return switch (canal) {
            case EMAIL -> new NotificadorEmail();
            case SMS -> new NotificadorSms();
            case PUSH -> new NotificadorPush();
        };
    }
}
```

A diferença para o primeiro exemplo do post pode parecer pequena, mas é importante: aqui existe um único lugar no sistema inteiro responsável por essa decisão. Enquanto o `switch` espalhado forçava cada chamador a conhecer todas as implementações concretas, a fábrica concentra esse conhecimento, e o restante do código trabalha só com a interface `Notificador`.

## Quando vale a pena

Se a criação de um objeto é trivial (um `new` direto, sem lógica por trás), introduzir uma fábrica só adiciona indireção sem benefício. O padrão compensa quando existe uma lógica real de decisão sobre qual implementação usar, principalmente se essa lógica aparece em mais de um lugar do código ou se novas implementações são esperadas com alguma frequência. Testes também se beneficiam: como o código cliente depende só da interface, é fácil substituir a fábrica por uma versão de teste que devolve um mock, sem precisar simular o canal real.

Fonte:
<a href="https://refactoring.guru/pt-br/design-patterns/factory-method" target="_blank">Refactoring Guru</a>.

Um grande abraço e até o próximo post!
