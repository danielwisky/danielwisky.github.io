---
layout: post
title: "Builder: construindo objetos complexos sem um construtor de dez parâmetros"
subtitle: "Como montar um objeto passo a passo quando nem todo campo é obrigatório"
tags: [Design Pattern]
---

Uma classe `Pedido` começa com três campos: cliente, itens e endereço de entrega. Com o tempo, ganha cupom de desconto, observação, forma de pagamento, data de agendamento. O construtor acompanha esse crescimento:

```java
public Pedido(Cliente cliente, List<Item> itens, Endereco endereco,
              String cupom, String observacao, FormaPagamento pagamento,
              LocalDateTime agendamento) {
    // ...
}
```

Chamar esse construtor exige lembrar a ordem exata dos sete parâmetros, e boa parte deles é opcional na prática (nem todo pedido tem cupom ou agendamento). Isso empurra o código para uma de duas saídas ruins: construtores sobrecarregados para cada combinação de campos opcionais, ou passar `null` para tudo que não se aplica, torcendo para não inverter a ordem de dois parâmetros do mesmo tipo sem o compilador avisar.

## Montar o objeto em etapas

O Builder separa a construção em uma série de chamadas encadeadas, cada uma atribuindo um campo, com um método final que entrega o objeto pronto.

```java
public class Pedido {

    private final Cliente cliente;
    private final List<Item> itens;
    private final Endereco endereco;
    private final String cupom;
    private final String observacao;

    private Pedido(Builder builder) {
        this.cliente = builder.cliente;
        this.itens = builder.itens;
        this.endereco = builder.endereco;
        this.cupom = builder.cupom;
        this.observacao = builder.observacao;
    }

    public static class Builder {

        private Cliente cliente;
        private List<Item> itens = new ArrayList<>();
        private Endereco endereco;
        private String cupom;
        private String observacao;

        public Builder cliente(Cliente cliente) {
            this.cliente = cliente;
            return this;
        }

        public Builder itens(List<Item> itens) {
            this.itens = itens;
            return this;
        }

        public Builder endereco(Endereco endereco) {
            this.endereco = endereco;
            return this;
        }

        public Builder cupom(String cupom) {
            this.cupom = cupom;
            return this;
        }

        public Builder observacao(String observacao) {
            this.observacao = observacao;
            return this;
        }

        public Pedido build() {
            if (cliente == null || endereco == null) {
                throw new IllegalStateException("Cliente e endereço são obrigatórios");
            }
            return new Pedido(this);
        }
    }
}
```

O código que monta o pedido fica autoexplicativo, sem depender da posição dos argumentos:

```java
Pedido pedido = new Pedido.Builder()
    .cliente(cliente)
    .itens(itens)
    .endereco(endereco)
    .cupom("PRIMEIRACOMPRA10")
    .build();
```

Campos opcionais simplesmente não são chamados, sem precisar passar `null` explicitamente, e o método `build()` é o único lugar responsável por validar se os campos obrigatórios foram preenchidos antes de criar o objeto.

## A versão que já vem pronta em bibliotecas Java

Quem usa Lombok já usou Builder sem escrever essa classe interna na mão:

```java
@Builder
public class Pedido {
    private Cliente cliente;
    private List<Item> itens;
    private Endereco endereco;
    private String cupom;
    private String observacao;
}
```

A anotação gera em tempo de compilação exatamente a mesma estrutura do exemplo manual acima: uma classe `Builder` interna com um método por campo e um `build()` final. Vale usar quando o objeto é um DTO simples sem lógica de validação própria; quando existem invariantes reais a proteger (como cliente e endereço obrigatórios no exemplo), escrever o Builder à mão, com validação dentro de `build()`, continua sendo mais seguro.

## Quando vale a pena

Builder compensa quando um objeto tem vários campos, parte deles opcional, e a ordem ou a combinação desses campos não é óbvia de cabeça. Para uma classe com dois ou três campos todos obrigatórios, um construtor comum já resolve sem nenhuma indireção extra. O sinal mais claro de que vale a pena introduzir um Builder é um construtor que já precisa de comentário explicando o que cada parâmetro posicional significa.

Fonte:
<a href="https://refactoring.guru/pt-br/design-patterns/builder" target="_blank">Refactoring Guru</a>.

Um grande abraço e até o próximo post!
