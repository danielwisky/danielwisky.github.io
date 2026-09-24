---
layout: post
title: "A Linha do Tempo do Java: de Lambdas a Virtual Threads"
subtitle: "Um resumo direto das mudanças que realmente importaram desde o Java 8 até as versões LTS mais recentes"
tags: [Java, Versões do Java]
---

O Java virou uma linguagem de ciclo curto: desde 2017 sai uma versão nova a cada seis meses, e a cada dois ou três anos uma delas recebe suporte de longo prazo (LTS). Isso deixou muita gente perdida sobre o que mudou de fato entre o Java que aprenderam na faculdade e o que roda em produção hoje. Este post é um mapa rápido das mudanças que pesaram mais, versão por versão.

## Java 8 (2014): o divisor de águas

Antes do 8, escrever Java em estilo funcional era verboso e cheio de classes anônimas. O 8 trouxe lambdas, a Stream API e os métodos default em interface, e mudou como o dia a dia de quem programa em Java se parece até agora:

```java
List<String> nomes = pessoas.stream()
    .filter(p -> p.getIdade() >= 18)
    .map(Pessoa::getNome)
    .sorted()
    .toList();
```

Também chegaram `Optional`, o novo `java.time` (finalmente uma API de data decente) e o `CompletableFuture`. Boa parte do código Java "moderno" que se vê hoje só existe por causa dessa versão.

## Java 9 a 16: o intervalo dos módulos e do var

O Java 9 (2017) introduziu o sistema de módulos (JPMS), pensado pra reorganizar a própria JDK internamente. Fora de projetos grandes com necessidade real de encapsular pacotes entre módulos, o impacto no dia a dia foi pequeno.

Dessas versões, as mudanças que mais aparecem em código real são outras:

- **Java 10**: inferência de tipo local com `var`, tipo `var lista = new ArrayList<String>()` em vez de repetir o tipo dos dois lados.
- **Java 11 (LTS)**: `HttpClient` nativo, substituindo dependência de bibliotecas externas só pra fazer uma chamada HTTP; também virou a versão que a maioria dos projetos usou como base por vários anos.
- **Java 14**: preview de *records*, uma forma de declarar classes de dados sem escrever construtor, `equals`, `hashCode` e getters à mão.
- **Java 15**: *text blocks*, string multi-linha sem concatenar `+` linha por linha, ótimo pra JSON ou SQL embutido no código.
- **Java 16**: records e *pattern matching* para `instanceof` saem do preview e ficam estáveis.

## Java 17 (2021): o LTS que consolidou tudo isso

O 17 juntou boa parte do que vinha em preview nas versões anteriores e virou padrão de fato em muita empresa. Records, `instanceof` com pattern matching e text blocks já estáveis, mais *sealed classes*, que permitem restringir quais classes podem estender ou implementar uma outra:

```java
public sealed interface Forma permits Circulo, Quadrado, Triangulo {}
```

Isso deixa o compilador avisar quando um `switch` sobre essas classes não cobre todos os casos, algo que antes só um `default` genérico resolvia, escondendo bug.

## Java 21 (2023): a virada de concorrência

O 21 é outro LTS grande, com duas mudanças que merecem post próprio neste blog: [Virtual Threads](/2026-09-22-virtual-threads-java/), que tornou barato criar uma thread pra cada tarefa bloqueante, e o pattern matching pra `switch`, que deixou desestruturar um record direto no `case`:

```java
static String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "positivo";
        case Integer i -> "zero ou negativo";
        case String s -> "texto: " + s;
        default -> "outro tipo";
    };
}
```

Também chegaram as *sequenced collections*, que finalmente deram um jeito padrão de pegar o primeiro e o último elemento de uma lista (`getFirst()`, `getLast()`) sem depender do tipo concreto da coleção.

## Java 22 a 25: os passos seguintes

Nas versões mais recentes, o destaque é a Structured Concurrency, que eu detalhei [num post anterior](/2026-09-23-structured-concurrency-java/): já vai na quinta rodada de preview no Java 25, dando um jeito de tratar um grupo de tarefas concorrentes como uma unidade só, com cancelamento e propagação de erro previsíveis. Ainda exige a flag `--enable-preview`, mas a API já está estável o bastante pra valer a pena conhecer antes dela sair do preview de vez.

O Java 25 também é a versão LTS mais recente, o que significa que é candidata natural pra quem está decidindo pra qual versão migrar depois do 17 ou do 21.

## Como decidir pra qual versão migrar

Pra quem ainda está numa versão antiga, três perguntas ajudam a decidir o próximo passo. Precisa de suporte de longo prazo? Fica nas LTS: 17, 21 ou 25. O código já bate bastante em I/O bloqueante, tipo chamadas de rede ou banco? O salto pro 21 compensa só pelas virtual threads. O time trabalha com modelagem de domínio rica, muitos tipos de dados e validação de casos? Records e pattern matching, do 17 e do 21, tendem a simplificar bastante esse tipo de código.

Migrar de versão em versão LTS costuma ser mais simples do que parece: a maior parte das mudanças são aditivas, não removem API antiga. O trabalho real costuma estar em atualizar dependências que travam numa versão específica do bytecode, não na linguagem em si.
