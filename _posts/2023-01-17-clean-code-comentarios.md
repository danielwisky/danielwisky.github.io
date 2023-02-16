---
layout: post
title: "Clean code: Comentários"
subtitle: "Nada pode ser tão útil quanto um comentário bem colocado."
cover-img: "/assets/img/default-bg.jpg"
categories: [Desenvolvimento de Software]
tags: [Clean Code]
---

## Comentários

Nada pode ser tão útil quanto um comentário bem colocado. Nada pode sobrecarregar um módulo mais do que comentários dogmáticos frívolos. Nada pode ser tão prejudicial quanto um comentário antigo que propaga mentiras e desinformação.

Se nossas linguagens de programação fossem expressivas o suficiente, ou se tivéssemos o talento para manejar sutilmente essas linguagens para expressar nossa intenção, não precisaríamos muito de comentários - talvez nem um pouco.

### Comentários não compensam códigos ruins

Um código claro e expressivo com poucos comentários é muito superior a um código confuso e complexo com muitos comentários. Em vez de gastar seu tempo escrevendo os comentários que explicam a bagunça que você fez, gaste-o limpando essa bagunça.

### Explique-se no código

```java
// Check to see if the employee is eligible for full benefits
if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))
```

vs

```java
if (employee.isEligibleForFullBenefits())
```

### Bons comentários

Alguns comentários são necessários ou benéficos. No entanto, o único comentário verdadeiramente bom é o comentário que você encontrou uma maneira de não escrever.

#### Comentários legais

Às vezes, nossos padrões de codificação corporativos nos obrigam a escrever certos comentários por motivos legais. Por exemplo, declarações de direitos autorais e autoria são coisas necessárias e razoáveis para colocar em um comentário no início de cada arquivo de origem.

#### Comentários informativos

Às vezes é útil fornecer informações básicas com um comentário. Por exemplo, considere este comentário que explica o valor de retorno de um método abstrato:

```java
// Returns an instance of the Responder being tested.
protected abstract Responder responderInstance();
```

Às vezes, um comentário como esse pode ser útil, mas é melhor usar o nome da função para transmitir as informações sempre que possível. Por exemplo, neste caso, o comentário pode se tornar redundante renomeando a função: `responderBeingTested`.

#### Explicação da intenção

Às vezes, um comentário vai além de apenas informações úteis sobre a implementação e fornece a intenção por trás de uma decisão. Exemplo:

```java
public int compareTo(Object o) {
    if (o instanceof WikiPagePath) {
        WikiPagePath p = (WikiPagePath) o;
        String compressedName = StringUtil.join(names, "");
        String compressedArgumentName = StringUtil.join(p.names, "");
        return compressedName.compareTo(compressedArgumentName);
    }
    return 1; // we are greater because we are the right type.
}
```

#### Esclarecimento

Às vezes, é útil traduzir o significado de algum argumento obscuro ou valor de retorno em algo legível. Em geral, é melhor encontrar uma maneira de tornar esse argumento ou valor de retorno claro por si só; mas quando faz parte da biblioteca padrão ou no código que você não pode alterar, um comentário esclarecedor útil pode ser útil.

#### Aviso de concequencias

Às vezes é útil avisar outros programadores sobre certas consequências.

```java
// Don't run unless you
// have some time to kill.
public void _testWithReallyBigFile() {
    writeLinesToFile(10000000);
    response.setBody(testFile);
    response.readyToSend(this);
    String responseString = output.toString();
    assertSubString("Content-Length: 1000000000", responseString);
    assertTrue(bytesSent > 1000000000);
}
```

#### TODO Comentários

Às vezes, é razoável deixar notas de “coisas a fazer” na forma de comentários //TODO. No
caso seguinte, o comentário TODO explica por que a função tem uma implementação degenerada e qual deve ser o futuro dessa função.

```java
//TODO-MdM these are not needed
// We expect this to go away when we do the checkout model
protected VersionInfo makeVersion() throws Exception {
    return null;
}
```

TODOs são trabalhos que o programador acha que devem ser feitos, mas por algum motivo não podem fazer no momento. Pode ser um lembrete para excluir um recurso obsoleto ou um apelo para que outra pessoa analise um problema. Pode ser um pedido para que outra pessoa pense em um nome melhor ou um lembrete para fazer uma alteração que depende de um evento planejado. O que quer que um TODO possa ser, não é uma desculpa para deixar um código ruim no sistema.

#### Amplificação

Um comentário pode ser usado para ampliar a importância de algo que, de outra forma, pode parecer irrelevante.

```java
String listItemContent = match.group(3).trim();
// the trim is real important. It removes the starting
// spaces that could cause the item to be recognized
// as another list.
new ListItemWidget(this, listItemContent, this.level + 1);
return buildList(text.substring(match.end()));
```

#### Javadocs em APIs públicas

Não há nada tão útil e satisfatório quanto uma API pública bem descrita. Os javadocs para a biblioteca Java padrão são um exemplo. Seria difícil, na melhor das hipóteses, escrever programas Java sem eles.

### Comentários Ruins

A maioria dos comentários se enquadra nessa categoria. Geralmente são muletas ou desculpas para códigos ruins ou justificativas para decisões insuficientes, chegando a pouco mais do que o programador falando sozinho.

#### Resmungando

Colocar um comentário apenas porque você acha que deveria ou porque o processo exige isso é um truque. Se você decidir escrever um comentário, gaste o tempo necessário para garantir que seja o melhor comentário que você pode escrever. Exemplo:

```java
public void loadProperties() {

    try {
        String propertiesPath = propertiesLocation + "/" + PROPERTIES_FILE;
        FileInputStream propertiesStream = new FileInputStream(propertiesPath);
        loadedProperties.load(propertiesStream);
    } catch (IOException e) {
        // No properties files means all defaults are loaded
    }
}
```

O que esse comentário no bloco catch significa? Claramente significava algo para o autor, mas o significado não veio muito bem. Aparentemente, se obtivermos uma `IOException`, significa que não havia arquivo de propriedades; e nesse caso todos os padrões são carregados. Mas quem carrega todos os padrões?

#### Comentários redundantes

```java
// Utility method that returns when this.closed is true. Throws an exception
// if the timeout is reached.
public synchronized void waitForClose(final long timeoutMillis) throws Exception {
    if (!closed) {
        wait(timeoutMillis);
        if (!closed)
            throw new Exception("MockResponseSender could not be closed");
    }
}
```

A que propósito serve este comentário? Certamente não é mais informativo do que o código. Não justifica o código, nem fornece intenção ou justificativa. Não é mais fácil de ler do que o código. Na verdade, é menos preciso do que o código e induz o leitor a aceitar essa falta de precisão em vez de um verdadeiro entendimento.

#### Comentários enganosos

Às vezes, com as melhores intenções, um programador faz uma declaração em seus comentários que não é precisa o suficiente para ser exata. Considere por outro momento o exemplo da seção anterior. O método não retorna quando `this.closed` torna-se `true`. Ele retorna se `this.closed` for `true`; caso contrário, ele espera por um tempo limite cego e, em seguida, lança uma exceção se `this.closed` ainda não for verdadeiro.

#### Comentários obrigatórios

É simplesmente bobo ter uma regra que diga que toda função deve ter um javadoc ou toda variável deve ter um comentário. Comentários como esse apenas bagunçam o código, propagam mentiras e geram confusão e desorganização geral.

```java
/**
 *
 * @param title The title of the CD
 * @param author The author of the CD
 * @param tracks The number of tracks on the CD
 * @param durationInMinutes The duration of the CD in minutes
 */
public void addCD(String title, String author, int tracks, int durationInMinutes) {
    CD cd = new CD();
    cd.title = title;
    cd.author = author;
    cd.tracks = tracks;
    cd.duration = duration;
    cdList.add(cd);
}
```

#### Comentários do diário

Às vezes, as pessoas adicionam um comentário ao início de um módulo toda vez que o editam. Exemplo:

```java
* Changes (from 11-Oct-2001)
* --------------------------
* 11-Oct-2001 : Re-organised the class and moved it to new package com.jrefinery.date (DG);
* 05-Nov-2001 : Added a getDescription() method, and eliminated NotableDate class (DG);
* 12-Nov-2001 : IBD requires setDescription() method, now that NotableDate class is gone (DG); Changed getPreviousDayOfWeek(), getFollowingDayOfWeek() and getNearestDayOfWeek() to correct bugs (DG);
* 05-Dec-2001 : Fixed bug in SpreadsheetDate class (DG);
```

Hoje temos sistemas de controle de código fonte, não precisamos desse tipo de logs.

#### Comentários de Ruído

Os comentários nos exemplos a seguir não fornecem novas informações.

```java
/**
 * Default constructor.
 */
protected AnnualDateRule() {}
```


```java
/** The day of the month. */
private int dayOfMonth;
```

Comentários Javadocs podem entrar nesta categoria. Muitas vezes, são apenas comentários ruidosos redundantes, escritos a partir de algum desejo equivocado de fornecer documentação.

#### Não use um comentário quando puder usar uma função ou uma variável

Exemplo:

```java
// does the module from the global list <mod> depend on the
// subsystem we are part of?
if (smodule.getDependSubsystems().contains(subSysMod.getSubSystem()))
```

vs

```java
ArrayList moduleDependees = smodule.getDependSubsystems();
String ourSubSystem = subSysMod.getSubSystem();
if (moduleDependees.contains(ourSubSystem))
```

#### Marcadores de posição

Esse tipo de comentário é barulhento

```java
// Actions //////////////////////////////////
```

#### Comentários de chaves de fechamento

Exemplo:

```java
public class wc {
    public static void main(String[] args) {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        int lineCount = 0;
        int charCount = 0;
        int wordCount = 0;
        try {
            while ((line = in .readLine()) != null) {
                lineCount++;
                charCount += line.length();
                String words[] = line.split("\\W");
                wordCount += words.length;

            } //while
            System.out.println("wordCount = " + wordCount);
            System.out.println("lineCount = " + lineCount);
            System.out.println("charCount = " + charCount);

        } // try
        catch (IOException e) {
            System.err.println("Error:" + e.getMessage());

        } //catch

    } //main
}
```

Você pode quebrar o código em pequenas funções para usar esse tipo de comentário.

#### Atribuições e assinaturas

Exemplo:

`/* Added by Rick */`

Em vez disso, o VCS pode gerenciar essas informações.

#### Código Comentado

```java
InputStreamResponse response = new InputStreamResponse();
response.setBody(formatter.getResultStream(), formatter.getByteCount());
// InputStream resultsStream = formatter.getResultStream();
// StreamReader reader = new StreamReader(resultsStream);
// response.setContent(reader.read(formatter.getByteCount()));
```

Se você não precisar mais, exclua-o, você pode voltar mais tarde com seu VCS se precisar novamente.

#### Comentários HTML

O HTML nos comentários do código-fonte é uma abominação, como você pode perceber lendo o código abaixo.

```java
/**
 * Task to run fit tests.
 * This task runs fitnesse tests and publishes the results.
 * <p/>
 * <pre>
 * Usage:
 * &lt;taskdef name=&quot;execute-fitnesse-tests&quot;
 * classname=&quot;fitnesse.ant.ExecuteFitnesseTestsTask&quot;
 * classpathref=&quot;classpath&quot; /&gt;
 * OR
 * &lt;taskdef classpathref=&quot;classpath&quot;
 * resource=&quot;tasks.properties&quot; /&gt;
 * <p/>
 * &lt;execute-fitnesse-tests
 * suitepage=&quot;FitNesse.SuiteAcceptanceTests&quot;
 * fitnesseport=&quot;8082&quot;
 * resultsdir=&quot;${results.dir}&quot;
 * resultshtmlpage=&quot;fit-results.html&quot;
 * classpathref=&quot;classpath&quot; /&gt;
 * </pre>
 */
```

#### Informações não locais

Se você precisar escrever um comentário, certifique-se de que ele descreva o código próximo ao qual aparece. Não ofereça informações de todo o sistema no contexto de um comentário local.

#### Muita informação

Não coloque discussões históricas interessantes ou descrições irrelevantes de detalhes em seus comentários.

#### Conexão Inóbvia

A conexão entre um comentário e o código que ele descreve deve ser óbvia. Se você está se dando ao trabalho de escrever um comentário, pelo menos gostaria que o leitor pudesse ver o comentário e o código e entender do que o comentário está falando

#### Cabeçalhos de função

Funções curtas não precisam de muita descrição. Um nome bem escolhido para uma pequena função que faz uma coisa geralmente é melhor do que um cabeçalho de comentário.

#### Javadocs em código não público

Javadocs são para APIs públicas, em código não público pode ser mais uma distração do que uma ajuda.

Fonte:
<a href="https://github.com/JuanCrg90/Clean-Code-Notes" target="\_blank">Clean Code Notes</a>.

Um grande abraço e até o próximo post!
