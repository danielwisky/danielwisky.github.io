---
layout: post
title: Clean code - Nomes Significativos
subtitle: Os nomes estão por toda parte no software. Arquivos, diretórios, variáveis, funções, etc.
thumbnail-img: /assets/img/thumbs/post-thumb-clean-code.png
tags: [clean-code]
---

## Nomes significativos

Os nomes estão por toda parte no software. Arquivos, diretórios, variáveis, funções, etc. Porque fazemos muito disso. É melhor fazê-lo bem.

### Use nomes reveladores de intenções

É fácil dizer que nomes revelam intenções. Escolher bons nomes leva tempo, mas economiza mais do que leva. Portanto, tome cuidado com seus nomes e troque-os quando encontrar nomes melhores.

O nome de uma variável, função ou classe deve responder a todas as grandes questões. Deve dizer por que existe, o que faz e como é usado. **Se um nome requer um comentário, então o nome não revela sua intenção**.

| Não revela intenção              | Revela intenção          |
| -------------------------------- | ------------------------ |
| `int d; // elapsed time in days` | `int elapsedTimeInDays;` |

A escolha de nomes que revelem a intenção pode facilitar muito a compreensão e a alteração do código. Exemplo:

```java
public List<int[]> getThem() {
    List<int[]> list1 = new ArrayList<int[]> ();
    for (int[] x: theList)
        if (x[0] == 4)
            list1.add(x);
    return list1;
}
```

Este código é simples, mas gera muitas dúvidas:

1. Qual é o conteúdo de `theList`?
2. Qual é o significado do item `x[0]` na lista?
3. Por que comparamos `x[0]` vs `4`?
4. Como eu usaria a lista retornada?

As respostas a essas perguntas não estão presentes no exemplo de código, mas poderiam estar. Digamos que estamos trabalhando em um jogo de vassoura de minas. Podemos refatorar o código anterior da seguinte maneira:

```java
public List <int[]> getFlaggedCells() {
    List <int[]> flaggedCells = new ArrayList<int[]> ();
    for (int[] cell: gameBoard)
        if (cell[STATUS_VALUE] == FLAGGED)
            flaggedCells.add(cell);
    return flaggedCells;
}
```

Agora sabemos as próximas informações:

1. `theList` representa o `gameBoard`
2. `x[0]` representa uma célula no quadro e `4` representa uma célula sinalizada
3. A lista retornada representa as `flaggedCells`

Observe que a simplicidade do código não mudou. Ele ainda tem exatamente o mesmo número de operadores e constantes, com exatamente o mesmo número de níveis de aninhamento. Mas o código se tornou muito mais explícito.

Podemos melhorar o código escrevendo uma classe simples para células em vez de usar um array de `ints`. Ele pode incluir uma **função reveladora de intenções** (chamada de `isFlagged`) para ocultar os números mágicos. Isso resulta em uma nova função da função.

```java
public List<Cell> getFlaggedCells() {
    List<Cell> flaggedCells = new ArrayList<Cell>();
    for (Cell cell: gameBoard)
        if (cell.isFlagged())
            flaggedCells.add(cell);
    return flaggedCells;
}
```

### Evite Desinformação

Os programadores devem evitar deixar pistas falsas que obscureçam o significado do código. Devemos evitar palavras cujo significado arraigado varie de nosso significado pretendido.

Não se refira a um agrupamento de contas como `accountList`, a menos que seja realmente uma `List`. A palavra `List` significa algo específico para programadores. Se o contêiner que contém as contas não for realmente uma lista, isso pode levar a conclusões falsas. Então `accountGroup` ou `bunchOfAccounts` ou simplesmente `accounts` seria melhor.

Cuidado com o uso de nomes que variam em pequenas formas. Quanto tempo leva para identificar a diferença sutil entre um `XYZControllerForEfficientHandlingOfStrings` em um módulo e, em algum lugar um pouco mais distante, `XYZControllerForEfficientStorageOfStrings`? As palavras têm formas assustadoramente semelhantes

### Faça distinções significativas

Os programadores criam problemas para si mesmos quando escrevem código apenas para satisfazer um compilador ou interpretador. Por exemplo, porque você não pode usar o mesmo nome para referir duas coisas diferentes no mesmo escopo, você pode ser tentado a mudar um nome de forma arbitrária. Às vezes, isso é feito com erros de ortografia, levando a uma situação surpreendente em que corrigir erros de ortografia leva à incapacidade de compilar. Exemplo, você cria a variável `klass` porque o nome `class` foi usado para outra coisa.

Na próxima função, os argumentos não são informativos, `a1` e `a2` não fornecem pistas sobre a intenção do autor.

```java
public static void copyChars(char a1[], char a2[]) {
    for (int i = 0; i < a1.length; i++) {
        a2[i] = a1[i];
    }
}
```

Podemos melhorar o código selecionando nomes de argumentos mais explícitos:

```java
public static void copyChars(char source[], char destination[]) {
    for (int i = 0; i < source.length; i++) {
        destination[i] = source[i];
    }
}
```

As palavras barulhentas são outra distinção sem sentido. Imagine que você tenha uma classe Produto. Se você tiver outro chamado `ProductInfo` ou `ProductData`, você fez os nomes diferentes sem fazê-los significar algo diferente. Informações e dados são palavras de ruído indistintas como a, an e the.

Palavras de ruído são redundantes. A palavra variável nunca deve aparecer em um nome de variável. A palavra tabela nunca deve aparecer no nome de uma tabela.

### Use nomes pronunciáveis

Imagine que você tem a variável `genymdhms` (data de geração, ano, mês, dia, hora, minuto e segundo) e imagine uma conversa onde você precisa falar sobre essa variável chamando-a de "gen why emm dee aich emm ess". Você pode considerar converter uma classe como esta:

```java
class DtaRcrd102 {
  private Date genymdhms;
  private Date modymdhms;
  private final String pszqint = "102";
  /* ... */
}
```

Para

```java
class Customer {
  private Date generationTimestamp;
  private Date modificationTimestamp;
  private final String recordId = "102";
  /* ... */
}
```

### Use nomes pesquisáveis

Nomes de uma única letra e constantes numéricas têm um problema específico, pois não são fáceis de localizar em um corpo de texto.

### Evite a Codificação

Temos codificações suficientes para lidar sem adicionar mais ao nosso fardo. Codificar informações de tipo ou escopo em nomes simplesmente adiciona uma carga extra de decifração. Nomes codificados raramente são pronunciáveis ​​e são fáceis de digitar incorretamente. Um exemplo disso é o uso da [Notação Húngara](https://en.wikipedia.org/wiki/Hungarian_notation) ou o uso de prefixos de membros.

#### Interfaces e Implementações

Às vezes, esses são um caso especial para codificações. Por exemplo, digamos que você esteja construindo uma FÁBRICA ABSTRATA para a criação de formas. Esta fábrica será uma interface e será implementada por uma classe concreta. O que você deve nomeá-los? `ISapeFactory` e `ShapeFactory`? É preferível deixar as interfaces sem adornos. Não quero que meus usuários saibam que estou entregando uma interface a eles. Eu só quero que eles saibam que é uma `ShapeFactory`. Portanto, se devo codificar a interface ou a implementação, escolho a implementação. Chamá-lo `ShapeFactoryImp`, ou mesmo o hediondo `CShapeFactory`, é preferível a codificar a interface.

### Evite o Mapeamento Mental

Os leitores não deveriam ter que traduzir mentalmente seus nomes para outros nomes que eles já conhecem.

Uma diferença entre um programador inteligente e um programador profissional é que o profissional entende que a clareza é fundamental. Os profissionais usam seus poderes para o bem e escrevem códigos que outros possam entender.

### Nomes de classe

Classes e objetos devem ter nomes de substantivos ou frases de substantivos como `Customer`, `WikiPage`, `Account` e `AddressParser`. Evite palavras como `Gerente`, `Processador`, `Dados` ou `Info` no nome de uma classe. Um nome de classe não deve ser um verbo.

### Nomes de métodos

Os métodos devem ter nomes de verbos ou frases verbais como `postPayment`, `deletePage` ou `save`. Acessadores, modificadores e predicados devem ser nomeados por seus valores e prefixados com get, set e is de acordo com o padrão javabean.

Quando os construtores estiverem sobrecarregados, use métodos de fábrica estáticos com nomes que descrevam os argumentos. Por exemplo:

```java
Complex fulcrumPoint = Complex.FromRealNumber(23.0);
```

geralmente é melhor do que

```java
Complex fulcrumPoint = new Complex(23.0);
```

Considere impor seu uso tornando privados os construtores correspondentes.

### Não seja fofo

| nome bonito       | Nome limpo    |
| ----------------- | ------------- |
| `holyHandGranade` | `deleteItems` |
| `bater`           | `matar`       |
| `eatMyShorts`     | `abortar`     |

### Escolha uma palavra por conceito

Escolha uma palavra para um conceito abstrato e fique com ela. Por exemplo, é confuso ter fetch, retrieve e get como métodos equivalentes de diferentes classes.

### Não faça trocadilhos

Evite usar a mesma palavra para dois propósitos. Usar o mesmo termo para duas ideias diferentes é essencialmente um trocadilho.

Exemplo: em uma classe use `add` para criar um novo valor adicionando ou concatenando dois valores existentes e em outra classe use `add` para colocar um parâmetro simples em uma coleção, é uma opção melhor usar um nome como `insert` ou `acrescentar` em vez disso.

### Use nomes de domínio de solução

Lembre-se de que as pessoas que lerão seu código serão programadores. Portanto, vá em frente e use termos de ciência da computação (CS), nomes de algoritmos, nomes de padrões, termos matemáticos e assim por diante.

### Use nomes de domínio problemáticos

Quando não houver "programmer-eese" para o que você está fazendo, use o nome do domínio do problema. Pelo menos o programador que mantém seu código pode perguntar a um especialista de domínio o que isso significa.

### Adicionar contexto significativo

Existem alguns nomes que são significativos por si mesmos - a maioria não é. Em vez disso, você precisa colocar os nomes no contexto para o seu leitor, colocando-os em classes, funções ou namespaces bem nomeados. Quando tudo mais falhar, prefixar o nome pode ser necessário como último recurso

Variáveis como: `firstName`, `lastName`, `street`, `city`, `state`. Juntos, é bastante claro que eles formam um endereço, mas, e se você visse a variável state sendo usada sozinha em um método?, você poderia adicionar contexto usando prefixos como: `addrState` pelo menos os leitores entenderão que a variável faz parte de uma grande estrutura. Claro, uma solução melhor é criar uma classe chamada `Endereço` assim até mesmo o compilador saberá que as variáveis ​​pertencem a um conceito maior

### Não adicione contexto gratuito

Em um aplicativo imaginário chamado "Gas Station Deluxe", é uma má ideia prefixar todas as classes com GSD. Exemplo: `GSDAccountAddress`

Nomes mais curtos geralmente são melhores do que nomes mais longos, desde que sejam claros. Não adicione mais contexto a um nome do que o necessário.

Fonte:
<a href="https://github.com/JuanCrg90/Clean-Code-Notes" target="\_blank">Clean Code Notes</a>.

Um grande abraço e até o próximo post!
