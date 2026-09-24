---
layout: post
title: "Java: Testes Unitários"
subtitle: "Como escrever e executar testes unitários eficazes em Java com JUnit, TestNG, Spock e Mockito."
tags: [Java, Testes Unitários, Testes Automatizados]
---

## Testes Unitários: garantindo a qualidade e confiabilidade do seu código

Os testes unitários são uma técnica crucial na programação orientada a testes, onde cada componente ou unidade de código é testado isoladamente. Isso permite que os desenvolvedores detectem e corrijam erros de forma rápida e eficiente, garantindo a qualidade e a confiabilidade do código. No Java, existem várias bibliotecas e ferramentas disponíveis para ajudar a criar e executar testes unitários.

Uma das bibliotecas mais populares para testes unitários em Java é o JUnit. Ele fornece uma estrutura de testes fácil de usar, além de recursos para anotar e organizar os testes. Para usar o JUnit, é necessário adicioná-lo como uma dependência no projeto e criar uma classe de teste específica para cada componente ou unidade de código a ser testado.

Para escrever um teste unitário usando o JUnit, é necessário criar uma classe de teste e anotá-la com `@Test`. Em seguida, é preciso escrever um método de teste dentro dessa classe, onde o código a ser testado é chamado e suas saídas são comparadas com o resultado esperado. Por exemplo, se você deseja testar uma classe chamada `Calculator`, pode criar uma classe de teste chamada `CalculatorTest` e escrever um método de teste chamado `testAdd`, onde o método `add` da classe `Calculator` é chamado e o resultado é comparado com o valor esperado.

Exemplo com JUnit:

```java
import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class CalculatorTest {
  @Test
  public void testAdd() {
    Calculator calculator = new Calculator();
    int result = calculator.add(1, 2);
    assertEquals(3, result);
  }
}
```

Além do JUnit, outras bibliotecas e ferramentas populares para testes unitários em Java incluem o TestNG, o Spock e o Mockito. O TestNG e o Spock são frameworks de teste, alternativas ao JUnit, com recursos como testes paralelos e uma sintaxe mais expressiva (no caso do Spock, baseada em Groovy). Já o Mockito não substitui o JUnit: ele é usado em conjunto para criar mock objects, ou seja, simular as dependências da classe testada.

Exemplo com TestNG:

```java
import org.testng.annotations.Test;
import static org.testng.Assert.assertEquals;

public class CalculatorTest {

  @Test
  public void testAdd() {
    Calculator calculator = new Calculator();
    int result = calculator.add(1, 2);
    assertEquals(3, result);
  }
}
```

Exemplo com Spock:

```java
class CalculatorSpec extends Specification {
  def "test add method"() {
    setup:
    Calculator calculator = new Calculator()

    when:
    int result = calculator.add(1, 2)

    then:
    result == 3
  }
}
```

Exemplo com Mockito: aqui a classe testada é `CalculatorService`, que delega o cálculo para uma dependência externa (`RemoteCalculatorClient`). É essa dependência que mockamos — nunca a própria classe sob teste.

```java
import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CalculatorServiceTest {
  @Test
  public void testAdd() {
    RemoteCalculatorClient client = mock(RemoteCalculatorClient.class);
    when(client.add(1, 2)).thenReturn(3);

    CalculatorService service = new CalculatorService(client);
    int result = service.add(1, 2);

    assertEquals(3, result);
  }
}
```

Escrever testes unitários não é uma tarefa opcional, mas sim uma prática fundamental de desenvolvimento de software: eles garantem a qualidade e a confiabilidade do código e ajudam a detectar e corrigir erros de forma rápida e eficiente. Com o uso das bibliotecas e ferramentas disponíveis em Java, como JUnit, TestNG, Spock e Mockito, os desenvolvedores podem escrever e executar esses testes de forma fácil e eficaz.

Um grande abraço e até o próximo post!
