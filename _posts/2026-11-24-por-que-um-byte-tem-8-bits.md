---
layout: post
title: "Por que um byte tem 8 bits?"
subtitle: "Teve computador com caracteres de 6 bits, palavras de 36 e bytes de tamanho variável. A história de como o 8 venceu, e onde ele ainda morde quem programa em Java"
tags: [História, Programação]
---

Pergunte para qualquer dev quantos bits tem um byte e a resposta vem antes de você terminar a frase: oito. Parece uma daquelas verdades da natureza, tipo a água ferver a 100 graus. Mas não é. Durante boa parte da história da computação, um byte não tinha tamanho fixo, e quando tinha, muitas vezes não era oito.

O 8 venceu por uma combinação de decisão de engenharia, caracteres e uma máquina específica da IBM que dominou o mercado. Vale a pena conhecer o caminho, até porque ele ainda deixa marcas no código que você escreve hoje.

## Antes do byte, a palavra

Os primeiros computadores não pensavam em bytes. Pensavam em **palavras** (*words*): o bloco de bits que a máquina lia, somava e guardava de uma vez só. E o tamanho da palavra variava muito de máquina para máquina.

Os computadores científicos da IBM dos anos 1950, como o 704, usavam palavras de 36 bits. A DEC fez o PDP-10, também de 36 bits, e o pequeno PDP-8, de 12. A CDC tinha máquinas de 60 bits. Cada fabricante escolhia o tamanho que fazia sentido para os cálculos que seus clientes faziam. Uma explicação que aparece com frequência para os 36 bits é que eles davam precisão parecida com a das calculadoras mecânicas de 10 dígitos da época, mas trate isso como uma razão entre várias, não como a resposta definitiva.

Texto, nessa época, era cidadão de segunda classe. Quando a máquina precisava guardar caracteres, geralmente usava códigos de **6 bits**. Com 6 bits você tem 64 combinações, o que dá para as letras maiúsculas, os dígitos e alguns sinais de pontuação. Letra minúscula? Luxo. E 36 é múltiplo de 6, então uma palavra guardava exatamente seis caracteres. Bem arrumado.

## O nascimento da palavra "byte"

O termo "byte" surgiu em 1956, durante o projeto do IBM Stretch (o IBM 7030), e é atribuído a Werner Buchholz, um dos engenheiros do projeto. A ideia era ter um nome para um grupo de bits menor que a palavra, usado para representar um caractere.

A grafia com "y" foi proposital: "bite" ficaria parecido demais com "bit", e um erro de digitação poderia trocar um pelo outro. Repare que, no Stretch, o byte nem tinha tamanho fixo. A primeira descrição falava em grupos de 1 a 6 bits, e logo depois o projeto passou a aceitar de 1 a 8. O byte era um conceito, não um número.

## O System/360 e a vitória do 8

A virada veio em 1964, quando a IBM anunciou o **System/360**. Foi uma aposta gigantesca: em vez de ter linhas de computadores incompatíveis entre si, uma para ciência e outra para negócios, a IBM lançou uma família inteira de máquinas, da pequena à grande, que rodavam os mesmos programas.

E o System/360 fixou o byte em 8 bits. Alguns motivos ajudam a entender por quê:

- **Mais caracteres.** Com 8 bits você tem 256 combinações. Dá para maiúsculas, minúsculas, dígitos, pontuação e ainda sobra espaço. A IBM usou seu próprio código de 8 bits, o EBCDIC.
- **Números decimais compactados.** Computador de negócio vive de dinheiro, e dinheiro é decimal. Um dígito decimal cabe em 4 bits, então um byte de 8 guarda exatamente dois dígitos. É o chamado *packed decimal*. Com bytes de 6 bits, sobrariam bits desperdiçados.
- **Potência de 2.** Oito é 2³. Isso simplifica o hardware de endereçamento e torna mais natural agrupar bytes em palavras de 16, 32 e 64 bits. O próprio 360 tinha palavras de 32 bits, ou seja, quatro bytes.

O System/360 foi um sucesso enorme, e quando a máquina que domina o mercado faz uma escolha, o resto do mundo vai atrás. Software, periféricos, formatos de fita e profissionais passaram a assumir bytes de 8 bits.

O último empurrão veio com os microprocessadores. O Intel 8008, de 1972, e depois o 8080 e seus concorrentes eram processadores de 8 bits. Quando o computador pessoal chegou, o byte de 8 bits estava tão enraizado que nem era mais uma discussão.

## E o ASCII, que tem 7?

Se você está pensando "mas o ASCII tem 7 bits", está certo. O ASCII, padronizado em 1963, usa 7 bits, ou seja, 128 caracteres. Ele surgiu quase ao mesmo tempo que o System/360, e por um tempo os dois mundos conviveram: o mainframe da IBM falando EBCDIC, e o resto do mercado indo para o ASCII.

No fim, os dois se acomodaram dentro do byte de 8 bits. O ASCII cabe nos 7 bits de baixo e o oitavo bit ficou livre. Esse bit sobrando virou bit de paridade em alguns sistemas e, mais tarde, a porta de entrada para dezenas de "ASCII estendidos", cada um usando os 128 valores de cima de um jeito diferente. Foi exatamente essa bagunça que o Unicode veio arrumar, e eu já contei um pouco disso no post sobre [Unicode e strings](/2026-11-10-unicode-e-strings/).

## Por que a internet diz "octeto"

Se você já leu uma RFC, deve ter esbarrado na palavra **octeto** (*octet*). Ela existe justamente porque, quando os protocolos de rede foram escritos, "byte" ainda não significava necessariamente 8 bits. Tinha muita máquina de 36 bits ligada à ARPANET. Para não deixar margem para dúvida, as especificações falavam em octetos: grupos de exatamente 8 bits.

O hábito ficou. Até hoje, documentos de rede e alguns idiomas, como o francês, preferem "octeto". Quando você vê um endereço IPv4 descrito como "quatro octetos", é essa a história.

A linguagem C também carrega essa herança. O padrão não diz que um `char` tem 8 bits: diz que tem `CHAR_BIT` bits, e que `CHAR_BIT` é **pelo menos** 8. Em praticamente qualquer computador que você vai usar, é 8 mesmo (o POSIX, por exemplo, exige isso), mas existem processadores de sinal digital em que um `char` tem 16 ou 32 bits. É raro, mas é o tipo de detalhe que aparece quando alguém tenta portar código para um hardware embarcado.

## Onde o byte ainda morde: o Java

Agora a parte prática. Em Java, o tipo `byte` tem 8 bits e **sinal**. Ele vai de -128 a 127, e não de 0 a 255 como muita gente espera quando pensa em "um byte".

Isso causa bugs bem sutis quando você trabalha com dados binários, como arquivos, protocolos de rede ou hashes:

```java
byte b = (byte) 0xFF;
System.out.println(b);          // -1, não 255

int errado = b;                 // -1: o sinal foi estendido
int certo = b & 0xFF;           // 255
int tambem = Byte.toUnsignedInt(b); // 255, desde o Java 8
```

Quando um `byte` vira `int`, o Java faz extensão de sinal: se o bit mais alto estiver ligado, todos os bits novos também ficam ligados, e o seu `0xFF` vira `0xFFFFFFFF`, que é -1. O `& 0xFF` desliga tudo acima dos 8 bits de baixo e devolve o valor que você queria.

O clássico em que isso aparece é transformar um hash em hexadecimal:

```java
StringBuilder hex = new StringBuilder();
for (byte b : digest) {
    String h = Integer.toHexString(b & 0xFF);
    if (h.length() == 1) hex.append('0');
    hex.append(h);
}
```

Sem o `& 0xFF`, o `Integer.toHexString` recebe o byte já convertido para `int`, com o sinal estendido, e os bytes negativos viram strings como `ffffffa3`. O seu hash fica com o tamanho errado. Curiosamente, o `String.format("%02x", b)` já trata o `byte` como sem sinal, então o problema não aparece com ele, mas o `Integer.toHexString` não perdoa. Hoje dá para fugir disso com `HexFormat.of().formatHex(digest)`, que existe desde o Java 17, mas o bug continua aparecendo em código antigo e em qualquer lugar onde alguém faça a conversão na mão.

## Nibbles e outras sobras

Já que estamos aqui, uma curiosidade: meio byte, ou 4 bits, tem nome. É o **nibble** (às vezes escrito *nybble*), uma piadinha com "byte" e "bite", já que *nibble* é uma mordidinha. É exatamente um dígito hexadecimal, e é por isso que hexadecimal é tão confortável para olhar bytes: cada byte vira dois caracteres, sempre.

## O que fica

O byte de 8 bits parece inevitável hoje, mas foi uma escolha. Uma escolha boa, com motivos técnicos sólidos, mas que só virou padrão porque uma máquina muito bem-sucedida a adotou e todo o resto foi atrás. Antes disso, teve gente feliz com caracteres de 6 bits e palavras de 36.

É o mesmo padrão que apareceu no post sobre o [teclado QWERTY](/2026-11-23-por-que-seu-teclado-e-qwerty/): uma decisão tomada num contexto específico que se espalha, ganha efeito de rede e vira "o jeito como as coisas são". A diferença é que, no caso do byte, a decisão foi bem melhor.
