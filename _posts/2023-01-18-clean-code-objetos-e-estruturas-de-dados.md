---
layout: post
title: "Clean code: Objetos e Estruturas de Dados"
tags: [clean-code]
---

## Objetos e Estruturas de Dados

### Abstração de dados

Ocultar a implementação não é apenas uma questão de colocar uma camada de funções entre as variáveis. Ocultar a implementação é sobre abstrações! Uma classe não simplesmente envia suas variáveis por meio de getters e setters. Em vez disso, expõe interfaces abstratas que permitem que seus usuários manipulem a essência dos dados, sem precisar conhecer sua implementação.

### Anti-simetria de dados/objetos

Esses dois exemplos mostram a diferença entre objetos e estruturas de dados. Os objetos escondem seus dados atrás de abstrações e expõem funções que operam nesses dados. A estrutura de dados expõe seus dados e não possui funções significativas.

**Forma Processual**

```java
public class Square {
  public Point topLeft;
  public double side;
}

public class Rectangle {
  public Point topLeft;
  public double height;
  public double width;
}

public class Circle {
  public Point center;
  public double radius;
}

public class Geometry {
  public final double PI = 3.141592653589793;

  public double area(Object shape) throws NoSuchShapeException {
    if (shape instanceof Square) {
      Square s = (Square)shape;
      return s.side * s.side;
    }
    else if (shape instanceof Rectangle) { Rectangle r = (Rectangle)shape; return r.height * r.width;
    }
    else if (shape instanceof Circle) {
      Circle c = (Circle)shape;
      return PI * c.radius * c.radius;
    }
    throw new NoSuchShapeException();
  }
}
```

**Forma Polimórfica**

```java
public class Square implements Shape {
  private Point topLeft;
  private double side;

  public double area() {
    return side*side;
  }
}

public class Rectangle implements Shape {
  private Point topLeft;
  private double height;
  private double width;

  public double area() {
    return height * width;
  }
}

public class Circle implements Shape {
  private Point center;
  private double radius;
  public final double PI = 3.141592653589793;

  public double area() {
    return PI * radius * radius;
  }
}
```

Novamente, vemos a natureza complementar dessas duas definições; eles são opostos virtuais! Isso expõe a dicotomia fundamental entre objetos e estruturas de dados:

> O código processual (código usando estruturas de dados) facilita a adição de novas funções sem alterar as estruturas de dados existentes. O código OO, por outro lado, facilita a adição de novas classes sem alterar as funções existentes.

O complemento também é verdadeiro:

> O código processual torna difícil adicionar novas estruturas de dados porque todas as funções devem mudar. O código OO torna difícil adicionar novas funções porque todas as classes devem mudar.

Programadores maduros sabem que a ideia de que tudo é um objeto é um mito. Às vezes, você realmente deseja estruturas de dados simples com procedimentos operando nelas.

### A Lei de [Demeter](https://en.wikipedia.org/wiki/Law_of_Demeter)

Existe uma heurística conhecida chamada Lei de Deméter que diz que um módulo não deve conhecer as entranhas dos objetos que manipula.

Mais precisamente, a Lei de Deméter diz que um método `f` de uma classe `C` só deve chamar os métodos destes:

- `C`
- Um objeto criado por `f`
- Um objeto passado como um argumento para `f`
- Um objeto mantido em uma variável de instância de `C`

O método não deve invocar métodos em objetos que são retornados por qualquer uma das funções permitidas. Em outras palavras, converse com amigos, não com estranhos.

### Objetos de transferência de dados

A forma quintessencial de uma estrutura de dados é uma classe com variáveis públicas e sem funções. Às vezes, isso é chamado de objeto de transferência de dados ou DTO. DTOs são estruturas muito úteis, especialmente ao se comunicar com bancos de dados ou analisar mensagens de soquetes e assim por diante. Eles geralmente se tornam os primeiros de uma série de estágios de conversão que convertem dados brutos em um banco de dados em objetos no código do aplicativo.

Fonte:
<a href="https://github.com/JuanCrg90/Clean-Code-Notes" target="\_blank">Clean Code Notes</a>.

Um grande abraço e até o próximo post!
