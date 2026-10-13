---
layout: post
title: "Adapter: fazendo duas interfaces incompatíveis conversarem"
subtitle: "Como integrar uma API que você não controla sem espalhar gambiarras pelo resto do sistema"
tags: [Design Pattern]
---

Um sistema de pagamentos foi escrito inteiro contra uma interface própria, `ProcessadorPagamento`, usada em todo o código de checkout. Chega a hora de integrar um novo gateway de pagamento de terceiros, e o SDK dele expõe uma classe `GatewayExternoClient` com uma assinatura completamente diferente da que o sistema espera:

```java
public interface ProcessadorPagamento {
    ResultadoPagamento processar(Pagamento pagamento);
}

public class GatewayExternoClient {
    public GatewayResponse cobrar(String cartaoToken, long valorEmCentavos, String moeda) {
        // chamada HTTP para o gateway externo
    }
}
```

A tentação mais rápida é alterar o código de checkout para chamar `GatewayExternoClient` diretamente nos pontos onde esse gateway específico for usado. O problema é que isso espalha os detalhes do SDK externo (valor em centavos, token de cartão, formato de moeda) por todo o código de negócio, que até então só conhecia `Pagamento` e `ResultadoPagamento`. Trocar de gateway no futuro, ou adicionar um segundo, significa caçar cada um desses pontos espalhados.

## Traduzir uma interface na outra

O Adapter resolve isso criando uma classe intermediária que implementa a interface que o sistema já espera, e por dentro traduz essa chamada para o formato que a API externa exige.

```java
public class GatewayExternoAdapter implements ProcessadorPagamento {

    private final GatewayExternoClient client;

    public GatewayExternoAdapter(GatewayExternoClient client) {
        this.client = client;
    }

    @Override
    public ResultadoPagamento processar(Pagamento pagamento) {
        long valorEmCentavos = pagamento.getValor()
            .multiply(new BigDecimal(100))
            .longValueExact();

        GatewayResponse response = client.cobrar(
            pagamento.getCartaoToken(),
            valorEmCentavos,
            pagamento.getMoeda().getCodigo()
        );

        return new ResultadoPagamento(
            response.isAprovado(),
            response.getIdTransacao()
        );
    }
}
```

O resto do sistema continua trabalhando só com `ProcessadorPagamento`, sem nenhuma referência direta ao SDK externo:

```java
public class CheckoutService {

    private final ProcessadorPagamento processador;

    public CheckoutService(ProcessadorPagamento processador) {
        this.processador = processador;
    }

    public ResultadoPagamento finalizar(Pagamento pagamento) {
        return processador.processar(pagamento);
    }
}
```

Toda a conversão de unidades, formatos e nomes de campos fica concentrada numa única classe. Se o gateway externo mudar sua API, ou se um segundo gateway precisar ser suportado, o ajuste acontece dentro do adapter correspondente, sem tocar em `CheckoutService` nem em nenhum outro ponto do checkout.

## A diferença entre Adapter e Decorator

É comum confundir Adapter com Decorator (tema de um post anterior aqui no blog), já que os dois envolvem um objeto dentro de outro. A diferença está no propósito: o Decorator mantém a mesma interface do objeto original e adiciona comportamento por cima; o Adapter muda a interface, traduzindo uma assinatura incompatível para outra. O Adapter normalmente aparece uma vez por integração externa, enquanto o Decorator é feito para ser empilhado em várias combinações.

## Quando vale a pena

Adapter é praticamente obrigatório sempre que o código precisa integrar uma biblioteca, SDK ou API externa que não foi desenhada pensando na interface interna do sistema, o que é o caso da maioria das integrações de terceiros. Sem esse isolamento, os detalhes da API externa vazam para dentro da lógica de negócio, e qualquer mudança no fornecedor (uma troca de gateway de pagamento, por exemplo) vira um problema espalhado em vez de uma mudança concentrada numa única classe.

Fonte:
<a href="https://refactoring.guru/pt-br/design-patterns/adapter" target="_blank">Refactoring Guru</a>.

Um grande abraço e até o próximo post!
