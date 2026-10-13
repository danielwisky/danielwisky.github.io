---
layout: post
title: "Strategy: trocando algoritmos sem reescrever quem os usa"
subtitle: "Como tirar um `if/else` gigante do caminho sem perder a flexibilidade que ele tentava oferecer"
tags: [Design Pattern]
---

Um sistema de pagamentos precisa calcular o valor de frete de formas diferentes dependendo da transportadora escolhida. A implementação mais natural costuma começar assim:

```java
public BigDecimal calcularFrete(Pedido pedido, String transportadora) {
    if (transportadora.equals("CORREIOS")) {
        return pedido.getPeso().multiply(new BigDecimal("2.50"));
    } else if (transportadora.equals("TRANSPORTADORA_X")) {
        return pedido.getDistancia().multiply(new BigDecimal("0.80"));
    } else if (transportadora.equals("RETIRADA")) {
        return BigDecimal.ZERO;
    }
    throw new IllegalArgumentException("Transportadora desconhecida");
}
```

Esse método cresce a cada transportadora nova, e misturar a regra de negócio de cada uma dentro do mesmo bloco condicional torna difícil testar uma regra isoladamente das outras. Qualquer mudança na fórmula de uma transportadora arrisca quebrar o `if/else` inteiro por engano.

## Separar o algoritmo de quem o usa

O Strategy propõe extrair cada variação do algoritmo para sua própria classe, todas implementando uma interface comum. Quem precisa calcular o frete não sabe qual fórmula está sendo usada, só invoca o método da interface.

```java
public interface CalculadoraFrete {
    BigDecimal calcular(Pedido pedido);
}

public class FreteCorreios implements CalculadoraFrete {
    @Override
    public BigDecimal calcular(Pedido pedido) {
        return pedido.getPeso().multiply(new BigDecimal("2.50"));
    }
}

public class FreteTransportadoraX implements CalculadoraFrete {
    @Override
    public BigDecimal calcular(Pedido pedido) {
        return pedido.getDistancia().multiply(new BigDecimal("0.80"));
    }
}

public class FreteRetirada implements CalculadoraFrete {
    @Override
    public BigDecimal calcular(Pedido pedido) {
        return BigDecimal.ZERO;
    }
}
```

A classe que precisa calcular o frete recebe a estratégia já escolhida, geralmente por injeção de dependência, e delega o cálculo:

```java
public class PedidoService {

    private final CalculadoraFrete calculadoraFrete;

    public PedidoService(CalculadoraFrete calculadoraFrete) {
        this.calculadoraFrete = calculadoraFrete;
    }

    public BigDecimal calcularFrete(Pedido pedido) {
        return calculadoraFrete.calcular(pedido);
    }
}
```

Testar a fórmula dos Correios isoladamente vira um teste unitário direto em `FreteCorreios`, sem precisar montar um cenário que passe pelo `if/else` inteiro. E adicionar uma transportadora nova significa criar uma classe nova, sem editar nenhuma das existentes.

## Decidir qual estratégia usar ainda é um problema à parte

O Strategy resolve a execução do algoritmo, mas alguém ainda precisa decidir qual implementação instanciar. É comum combinar Strategy com uma fábrica (o Factory Method de um post anterior por aqui resolve exatamente isso), ou simplesmente registrar as estratégias num mapa:

```java
Map<String, CalculadoraFrete> estrategias = Map.of(
    "CORREIOS", new FreteCorreios(),
    "TRANSPORTADORA_X", new FreteTransportadoraX(),
    "RETIRADA", new FreteRetirada()
);

CalculadoraFrete estrategia = estrategias.get(transportadora);
```

Isso não elimina a decisão, só a move para um único ponto central, em vez de espalhá-la pela lógica de negócio.

## Strategy e enum: uma combinação comum em Java

Quando as estratégias são poucas e fixas, uma alternativa mais enxuta em Java é usar um `enum` com um método abstrato, aproveitando que cada constante pode ter sua própria implementação:

```java
public enum TipoFrete {
    CORREIOS {
        @Override
        public BigDecimal calcular(Pedido pedido) {
            return pedido.getPeso().multiply(new BigDecimal("2.50"));
        }
    },
    RETIRADA {
        @Override
        public BigDecimal calcular(Pedido pedido) {
            return BigDecimal.ZERO;
        }
    };

    public abstract BigDecimal calcular(Pedido pedido);
}
```

Essa versão só compensa quando o conjunto de estratégias é conhecido e estável, já que adicionar uma nova constante exige recompilar o enum. Para cenários onde novas estratégias podem ser plugadas em tempo de execução (um sistema de plugins, por exemplo), interfaces e classes separadas continuam sendo a opção mais flexível.

## Quando vale a pena

Se existe apenas uma forma de fazer algo, Strategy não tem o que resolver. O padrão se justifica quando o mesmo comportamento tem variações reais de regra de negócio, e principalmente quando essas variações mudam em momentos diferentes ou são mantidas por pessoas diferentes. Um `if/else` com duas opções que nunca mudam pode continuar sendo um `if/else`; o custo da abstração só compensa quando a lista de variações tende a crescer.

Fonte:
<a href="https://refactoring.guru/pt-br/design-patterns/strategy" target="_blank">Refactoring Guru</a>.

Um grande abraço e até o próximo post!
