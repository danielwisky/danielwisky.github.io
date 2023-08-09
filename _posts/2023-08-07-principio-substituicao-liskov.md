---
layout: post
title: "SOLID: Princípio da Substituição de Liskov (LSP)"
subtitle: "Princípio da Substituição de Liskov (LSP) e exemplos de implementação em Java"
cover-img: "/assets/img/default-bg.jpg"
categories: [Desenvolvimento de Software]
tags: [Java, SOLID, LSP]
---

O Princípio da Substituição de Liskov é um dos princípios do SOLID, um conjunto de diretrizes para o desenvolvimento de software orientado a objetos. Este princípio estabelece que uma classe derivada deve poder substituir sua classe base, mantendo a consistência do sistema. Neste artigo, exploraremos o Princípio da Substituição de Liskov e apresentaremos exemplos de implementação em Java.

Princípio da Substituição de Liskov explicado: Segundo o Princípio da Substituição de Liskov, se uma classe A é um subtipo de uma classe B, então os objetos do tipo B podem ser substituídos pelos objetos do tipo A sem que isso afete o funcionamento correto do sistema. Isso significa que a classe derivada deve ser capaz de atender a todas as pré-condições, pós-condições e invariantes definidos pela classe base.

## Exemplos de implementação do Princípio da Substituição de Liskov em Java:

1. Exemplo de violação do Princípio de Substituição de Liskov:

    ```java
    class Retangulo {
        protected int largura;
        protected int altura;
    
        public void setLargura(int largura) {
            this.largura = largura;
        }
    
        public void setAltura(int altura) {
            this.altura = altura;
        }
    
        public int calcularArea() {
            return largura * altura;
        }
    }
    
    class Quadrado extends Retangulo {
        public void setLado(int lado) {
            this.largura = lado;
            this.altura = lado;
        }
    }
    ```
    
    Neste exemplo, a classe `Quadrado` viola o Princípio da Substituição de Liskov, pois impõe restrições adicionais à classe base `Retangulo`. Ao modificar apenas um lado do quadrado, o outro lado também é alterado, o que não é esperado em uma hierarquia de classes correta.<br><br>

2. Exemplo de aplicação correta do Princípio de Substituição de Liskov:

    ```java
    abstract class Forma {
        abstract int calcularArea();
    }
    
    class Retangulo extends Forma {
        protected int largura;
        protected int altura;
    
        public void setLargura(int largura) {
            this.largura = largura;
        }
    
        public void setAltura(int altura) {
            this.altura = altura;
        }
    
        @Override
        int calcularArea() {
            return largura * altura;
        }
    }
    
    class Quadrado extends Forma {
        protected int lado;
    
        public void setLado(int lado) {
            this.lado = lado;
        }
    
        @Override
        int calcularArea() {
            return lado * lado;
        }
    }
    ```

    Neste exemplo, corrigimos a violação do Princípio de Substituição de Liskov introduzindo uma classe abstrata `Forma`. As classes `Retangulo` e `Quadrado` agora herdam diretamente dessa classe abstrata, garantindo que todos os métodos estejam corretamente implementados e permitindo a substituição adequada. Cada classe derivada implementa seu próprio método `calcularArea()` de acordo com suas características específicas.<br><br>

## Conclusão

O Princípio da Substituição de Liskov é essencial para garantir a integridade e a consistência em hierarquias de classes. Ao seguir esse princípio, é possível criar classes derivadas que se comportam corretamente, substituindo sua classe base sem que isso afete o funcionamento do sistema. Os exemplos de implementação em Java mostram como evitar violações e aderir corretamente ao Princípio de Substituição de Liskov.

É importante lembrar que adotar esse princípio exige um entendimento adequado do problema e uma análise cuidadosa das relações entre as classes. Ao aplicar o Princípio da Substituição de Liskov em Java ou qualquer outro ambiente de desenvolvimento, é possível criar um código mais coeso, extensível e de fácil manutenção.

Um grande abraço e até o próximo post!
