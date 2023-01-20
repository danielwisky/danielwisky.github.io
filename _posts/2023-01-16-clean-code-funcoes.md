---
layout: post
title: Clean code - Funções
subtitle: As funções são a primeira linha de organização em qualquer tópico.
thumbnail-img: /assets/img/thumbs/post-thumb-funcoes.png
tags: [clean-code]
---

## Funções

As funções são a primeira linha de organização em qualquer tópico.

### Pequena!!

A primeira regra das funções é que elas devem ser pequenas. A segunda regra das funções é que elas devem ser menores que isso.

#### Blocos e recuo

Isso implica que os blocos dentro das instruções `if`, `else`, `while` e assim por diante devem ter uma linha de comprimento. Provavelmente essa linha deve ser uma chamada de função. Isso não apenas mantém a função envolvente pequena, mas também adiciona valor documental porque a função chamada dentro do bloco pode ter um nome bem descritivo.

Isso também implica que as funções não devem ser grandes o suficiente para conter estruturas aninhadas. Portanto, o nível de recuo de uma função não deve ser maior que um ou dois. Isso, é claro, torna as funções fáceis de ler e entender.

### Faça uma coisa

**AS FUNÇÕES DEVEM FAZER UMA COISA. ELES DEVEM FAZER BEM. SÓ DEVEM FAZÊ-LO.**

#### Seções dentro de funções

Se você tem uma função dividida em seções como _declarações_, _inicialização_ etc, é um sintoma claro de que a função está fazendo mais de uma coisa. Funções que fazem uma coisa não podem ser razoavelmente divididas em seções.

### Um nível de abstração por função

Para garantir que nossas funções estejam fazendo "uma coisa", precisamos garantir que as instruções dentro de nossa função estejam todas no mesmo nível de abstração.

#### Lendo o código de cima para baixo: _The Stepdown Rule_

Queremos que o código seja lido como uma narrativa de cima para baixo. Queremos que cada função seja seguida por aquelas no próximo nível de abstração para que possamos ler o programa, descendo um nível de abstração de cada vez enquanto lemos a lista de funções.

Para dizer isso de forma diferente, queremos ser capazes de ler o programa como se fosse um conjunto de parágrafos para, cada um dos quais descrevendo o nível atual de abstração e referenciando os parágrafos para subsequentes no próximo nível abaixo.

```
- Para incluir as configurações e desmontagens, incluímos as configurações, depois incluímos o conteúdo da página de teste e, em seguida, incluímos as desmontagens.
- Para incluir as configurações, incluímos a configuração da suíte, se for uma suíte, depois incluímos a configuração normal.
- Para incluir a configuração do conjunto, procuramos na hierarquia pai a página "SuiteSetUp" e adicionamos uma declaração de inclusão com o caminho dessa página.
- Para procurar o pai...
```

Acontece que é muito difícil para os programadores aprender a seguir essa regra e escrever funções que ficam em um único nível de abstração. Mas aprender esse truque também é muito importante. É a chave para manter as funções curtas e garantir que elas façam "uma coisa". Fazer o código ser lido como um conjunto de parágrafos TO de cima para baixo é uma técnica eficaz para manter o nível de abstração consistente.

### Instruções de troca

É difícil fazer uma pequena declaração switch. Mesmo uma instrução switch com apenas dois casos é maior do que eu gostaria que um único bloco ou função fosse. Também é difícil fazer uma instrução switch que faça uma coisa. Por sua natureza, as instruções switch sempre fazem N coisas. Infelizmente, nem sempre podemos evitar as instruções switch, mas podemos garantir que cada instrução switch seja ocultada em uma classe de baixo nível e nunca seja repetida. Fazemos isso, é claro, com polimorfismo.

### Use nomes descritivos

> Você sabe que está trabalhando em código limpo quando cada rotina acaba sendo exatamente o que você esperava

Metade da batalha para alcançar esse princípio é escolher bons nomes para pequenas funções que fazem uma coisa. Quanto menor e mais focada for uma função, mais fácil será escolher um nome descritivo.

Não tenha medo de fazer um nome longo. Um nome longo e descritivo é melhor do que um nome curto e enigmático. Um nome descritivo longo é melhor do que um comentário descritivo longo. Use uma convenção de nomenclatura que permita que várias palavras sejam facilmente lidas nos nomes das funções e, em seguida, use essas várias palavras para dar à função um nome que diga o que ela faz.

A escolha de nomes descritivos esclarecerá o design do módulo em sua mente e o ajudará a melhorá-lo. Não é incomum que a busca por um bom nome resulte em uma reestruturação favorável do código.

### Argumentos da função

O número ideal de argumentos para uma função é zero (niládico). Em seguida vem um (monádico), seguido de perto por dois (diádico). Três argumentos (triádicos) devem ser evitados sempre que possível. Mais de três (poliádico) requer justificativa muito especial – e então não deve ser usado de qualquer maneira.

Os argumentos são ainda mais difíceis do ponto de vista do teste. Imagine a dificuldade de escrever todos os casos de teste para garantir que todas as várias combinações de argumentos funcionem corretamente. Se não houver argumentos, isso é trivial. Se houver um argumento, não é muito difícil. Com dois argumentos, o problema fica um pouco mais desafiador. Com mais de dois argumentos, testar cada combinação de valores apropriados pode ser assustador.

Os argumentos de saída são mais difíceis de entender do que os argumentos de entrada. Quando lemos uma função, estamos acostumados com a ideia de que as informações entram na função por meio de argumentos e saem pelo valor de retorno. Normalmente, não esperamos que as informações saiam por meio dos argumentos. Portanto, os argumentos de saída geralmente nos levam a pensar duas vezes.

#### Formas Monádicas Comuns

Existem duas razões muito comuns para passar um único argumento para uma função. Você pode estar fazendo uma pergunta sobre esse argumento, como em `boolean fileExists("MyFile")` . Ou você pode estar operando com base nesse argumento, transformando-o em outra coisa e devolvendo-o. Por exemplo, `InputStream fileOpen("MyFile")` transforma um nome de arquivo `String` em um valor de retorno `InputStream`. Esses dois usos são o que os leitores esperam quando veem uma função. Você deve escolher nomes que tornem clara a distinção e sempre usar as duas formas em um contexto consistente.

#### Argumentos de Sinalização

Argumentos sinalizadores são feios. Passar um booleano para uma função é uma prática realmente terrível. Isso complica imediatamente a assinatura do método, proclamando em voz alta que essa função faz mais de uma coisa. Ele faz uma coisa se a flag for `true` e outra se a flag for `false`!

#### Funções diádicas

Uma função com dois argumentos é mais difícil de entender do que uma função monádica. Por exemplo, `writeField(name)` é mais fácil de entender do que `writeField(output-Stream, name)`

Há momentos, é claro, em que dois argumentos são apropriados. Por exemplo, `Point p = new Point(0,0);` é perfeitamente razoável. Os pontos cartesianos naturalmente levam dois argumentos.

Mesmo funções diádicas óbvias como assertEquals(esperado, real) são problemáticas. Quantas vezes você colocou o real onde deveria estar o esperado? Os dois argumentos não têm ordem natural. A ordem esperada e real é uma convenção que requer prática para aprender.

Díades não são más, e você certamente terá que escrevê-las. No entanto, você deve estar ciente de que eles têm um custo e devem aproveitar os mecanismos disponíveis para convertê-los em mônadas. Por exemplo, você pode tornar o método writeField um membro de outputStream para poder dizer outputStream. escrevaCampo(nome) . Ou você pode tornar o outputStream uma variável de membro da classe atual para que não precise transmiti-lo. Ou você pode extrair uma nova classe como FieldWriter que usa o outputStream em seu construtor e tem um método de gravação.

#### Tríades

Funções que levam três argumentos são significativamente mais difíceis de entender do que díades. Os problemas de ordenar, pausar e ignorar são mais do que duplicados. Sugiro que pense bem antes de criar uma tríade.

#### Objetos de argumento

Comparar:

```java
Circle makeCircle(double x, double y, double radius);
```

vs

```java
Circle makeCircle(Point center, double radius);
```

#### Verbos e palavras-chave

Escolher bons nomes para uma função pode ajudar muito a explicar a intenção da função e a ordem e intenção dos argumentos. No caso de uma mônada, a função e o argumento devem formar um belo par verbo/substantivo. Por exemplo, `write(name)` é muito sugestivo. Qualquer que seja essa coisa de "nome", ela está sendo "escrita". Um nome ainda melhor pode ser `writeField(name)` , que nos diz que o "nome" é um "campo".

Este último é um exemplo da forma de palavra-chave de um nome de função. Usando esta forma, codificamos os nomes dos argumentos no nome da função. Por exemplo, `assertEquals` pode ser melhor escrito como `assertExpectedEqualsActual(expected, actual)`. Isso atenua fortemente o problema de ter que lembrar a ordem dos argumentos.

### Argumentos de saída

Em geral, argumentos de saída devem ser evitados. Se sua função precisar alterar o estado de algo, faça com que ela altere o estado de seu próprio objeto.

### Separação de consulta de comando

As funções devem fazer algo ou responder a algo, mas não ambos. Sua função deve alterar o estado de um objeto ou deve retornar algumas informações sobre esse objeto. Fazer as duas coisas geralmente leva à confusão.

### Prefira Exceções a Retornar Códigos de Erro

Retornar códigos de erro de funções de comando é uma violação sutil da separação de consulta de comando.

### Não se repita

A duplicação pode ser a raiz de todos os males do software. Muitos princípios e práticas foram criados com o objetivo de controlá-lo ou eliminá-lo.

### Programação Estruturada

Alguns programadores seguem as regras de programação estruturada de Edsger Dijkstra. Dijkstra disse que toda função, e todo bloco dentro de uma função, deveria ter uma entrada e uma saída. Seguir essas regras significa que deve haver apenas uma instrução return em uma função, nenhuma instrução `break` ou `continue` em um loop e nunca, _ever_, nenhuma instrução `goto`.

Embora simpatizemos com os objetivos e disciplinas da programação estruturada, essas regras trazem poucos benefícios quando as funções são muito pequenas. É apenas em funções maiores que tais regras fornecem benefícios significativos.

Portanto, se você mantiver suas funções pequenas, as declarações múltiplas ocasionais `return`, `break` ou `continue` não causam danos e às vezes podem até ser mais expressivas do que a regra de entrada única e saída única. Por outro lado, `goto` só faz sentido em funções grandes, por isso deve ser evitado

Fonte:
<a href="https://github.com/JuanCrg90/Clean-Code-Notes" target="\_blank">Clean Code Notes</a>.

Um grande abraço e até o próximo post!
