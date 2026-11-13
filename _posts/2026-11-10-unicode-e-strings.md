---
layout: post
title: "Unicode e strings: por que \"é\".length() pode dar 2"
subtitle: "Code points, UTF-16, normalização e emojis: o que existe por trás de uma String em Java"
tags: [Java, Programação]
---

Abra o `jshell` e cole isto:

```java
jshell> "é".length()
$1 ==> 2
```

Dependendo de onde você copiou esse "é", o resultado pode ser 1 ou 2. Na tela os dois são idênticos, mas para o Java são strings diferentes, com tamanhos diferentes, e `equals` entre elas devolve `false`.

Parece curiosidade inútil, até o dia em que o login de um usuário chamado "José" para de funcionar depois que ele troca de computador, ou um campo de 50 caracteres validado no backend estoura no banco, ou um nome cortado com `substring` aparece na tela com um losango de interrogação no final. Todos esses problemas têm a mesma raiz: a gente pensa em "caractere" como uma coisa só, e não é.

## Três coisas que chamamos de "caractere"

Quando alguém fala "caractere", pode estar falando de pelo menos três coisas diferentes:

- **Grafema**: o que uma pessoa enxerga como uma letra ou símbolo. "é" é um grafema. Uma bandeira do Brasil também.
- **Code point**: um número que o Unicode atribui a cada símbolo, escrito como `U+00E9`. Um grafema pode ser formado por um ou vários code points.
- **Unidade de codificação**: a forma como esse número é guardado na memória ou em disco. Em UTF-8 são bytes, em UTF-16 são blocos de 16 bits.

O método `length()` da `String` não conta nenhuma das duas primeiras. Ele conta a terceira: quantos `char` existem na string, e um `char` é uma unidade de 16 bits do UTF-16. Isso fazia sentido quando o Java nasceu, nos anos 90, porque o Unicode foi pensado originalmente para caber em 16 bits. O Unicode cresceu, o Java não podia mudar o significado de `char` sem quebrar todo mundo, e a diferença entre "o que eu vejo" e "o que o `length()` devolve" ficou como herança.

## O "é" que vale 2

O Unicode permite escrever o mesmo grafema de mais de um jeito. O "é" pode ser:

- Um único code point, `U+00E9` (LATIN SMALL LETTER E WITH ACUTE), chamado de forma composta.
- Dois code points: a letra `e` (`U+0065`) seguida de um acento agudo combinante (`U+0301`), que se "encaixa" na letra anterior. Essa é a forma decomposta.

```java
String composto = "\u00e9";       // "é" em um code point só
String decomposto = "e\u0301";   // "e" + acento agudo combinante

System.out.println(composto + " " + decomposto); // é é
System.out.println(composto.length());           // 1
System.out.println(decomposto.length());         // 2
System.out.println(composto.equals(decomposto)); // false
```

Na maior parte do tempo o texto chega na forma composta, porque é o que os teclados costumam produzir. Mas a forma decomposta é mais comum do que se imagina: em nomes de arquivo vindos do macOS (o antigo HFS+ gravava tudo em NFD, e alguns programas ainda produzem essa forma), em texto copiado de PDFs, em dados importados de sistemas antigos. E aí o "José" que veio de uma planilha importada e o "José" digitado no formulário não batem no `equals`, nem no índice único do banco, nem no `HashMap`.

### Normalização

A solução para isso tem nome: normalização. O Unicode define quatro formas de normalização, e as duas mais usadas são as canônicas:

- **NFC**: compõe tudo o que dá. `e` + acento vira `é`.
- **NFD**: decompõe tudo. `é` vira `e` + acento.

As outras duas, NFKC e NFKD, vão além e também juntam caracteres de "compatibilidade": a ligatura `ﬁ` vira `fi`, e os dígitos de largura total usados em textos asiáticos viram dígitos comuns. São úteis para busca e identificadores, mas perdem informação, então não servem para guardar o texto original.

O Java já traz isso pronto em `java.text.Normalizer`:

```java
import java.text.Normalizer;

String a = Normalizer.normalize(composto, Normalizer.Form.NFC);
String b = Normalizer.normalize(decomposto, Normalizer.Form.NFC);

System.out.println(a.equals(b)); // true
```

A regra prática é escolher uma forma (quase sempre NFC) e normalizar na borda do sistema: quando o dado entra por uma API, um formulário ou um arquivo importado. Assim tudo o que é comparado, indexado ou guardado já está no mesmo formato, e você não precisa lembrar de normalizar em cada `equals` espalhado pelo código.

A NFD tem um uso conhecido, aliás: remover acentos para busca. Decompõe, e depois joga fora as marcas combinantes:

```java
String semAcento = Normalizer.normalize("Coração de São João", Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "");

System.out.println(semAcento); // Coracao de Sao Joao
```

Só vale o cuidado de usar isso para chave de busca, não para alterar o dado. Em outras escritas, as marcas combinantes fazem parte da letra, e letras como `ø` e `ł` nem têm forma decomposta, então passam direto.

## Emojis e os pares substitutos

O segundo jeito de um "caractere" valer 2 é mais comum hoje em dia. Os code points que não cabem em 16 bits, acima de `U+FFFF`, são representados em UTF-16 por dois `char`: o chamado par substituto (surrogate pair). A maioria dos emojis mora nessa faixa.

```java
String emoji = "😀"; // U+1F600

System.out.println(emoji.length());                              // 2
System.out.println(emoji.codePointCount(0, emoji.length()));     // 1
```

Vários emojis, inclusive, são sequências de code points que o sistema desenha como um só símbolo:

```java
"👍🏽".length()      // 4: polegar + modificador de tom de pele
"🇧🇷".length()      // 4: dois "regional indicators", B e R
"👨‍👩‍👧".length()      // 8: homem + ZWJ + mulher + ZWJ + menina
```

A família do último exemplo é um grafema só na tela, com 5 code points e 8 `char`. O caractere de junção invisível (ZWJ, `U+200D`) pede ao sistema para desenhar as três pessoas juntas. Se a fonte não tiver esse desenho, aparecem três emojis lado a lado.

### Onde isso quebra

O caso clássico é cortar uma string para caber num limite:

```java
String nome = "Ana 😀";
String cortado = nome.substring(0, 5);
```

O índice 5 cai bem no meio do par substituto do emoji. O resultado é uma string com meio emoji, um `char` órfão que não representa nada válido. Dependendo de onde ele for parar, aparece como `?`, como o losango `�`, ou faz um encoder de UTF-8 reclamar.

Alguns cuidados resolvem a maior parte dos casos. Para contar code points, use `codePointCount` ou `codePoints().count()`. Para iterar, use `codePoints()` em vez de `charAt` num `for`:

```java
"Olá 😀".codePoints()
        .mapToObj(Character::toString)
        .forEach(System.out::println);
```

E para cortar respeitando code points, calcule o índice com `offsetByCodePoints`. Ele lança exceção se a string tiver menos code points do que o pedido, então o limite precisa considerar o tamanho real:

```java
static String truncar(String texto, int maxCodePoints) {
    int total = texto.codePointCount(0, texto.length());
    int fim = texto.offsetByCodePoints(0, Math.min(maxCodePoints, total));
    return texto.substring(0, fim);
}

truncar("Ana 😀 Silva", 5); // "Ana 😀"
truncar("Ana", 5);          // "Ana"
```

Isso evita quebrar um emoji ao meio, mas ainda pode separar o polegar do tom de pele ou desmontar a família. Para respeitar o que o usuário de fato enxerga, é preciso trabalhar com grafemas.

### Grafemas

Contar grafemas é a forma mais fiel de responder "quantas letras tem isso?". O regex do Java tem o `\X`, que casa com um cluster de grafema:

```java
import java.util.regex.Pattern;

long grafemas = Pattern.compile("\\X").matcher("👨‍👩‍👧 é 🇧🇷").results().count();
System.out.println(grafemas); // 5: família, espaço, é, espaço, bandeira
```

Há também o `BreakIterator.getCharacterInstance()`, que a partir do JDK 20 segue as regras de grafemas estendidos do Unicode, incluindo as sequências de emoji. Em versões mais antigas, tanto ele quanto o `\X` podem dar resultados diferentes para emojis compostos, então vale testar na versão que você usa.

Nem sempre você precisa disso. Para validar tamanho de campo antes de gravar no banco, o que importa é a regra do banco, não o que o usuário vê (já chego lá). Mas para limitar um apelido a 20 "letras" na interface, ou truncar um texto com reticências sem estragar o último símbolo, grafema é a unidade certa.

## Bytes: o terceiro tamanho

Se `length()` conta `char` e o usuário enxerga grafemas, o banco e a rede enxergam bytes. E em UTF-8, que é o padrão de praticamente tudo hoje, o tamanho em bytes é outro número:

```java
"a".getBytes(StandardCharsets.UTF_8).length        // 1
"\u00e9".getBytes(StandardCharsets.UTF_8).length   // 2 ("é" composto)
"😀".getBytes(StandardCharsets.UTF_8).length       // 4
```

Ou seja, até o "é" composto, que tem `length()` igual a 1, ocupa 2 bytes. Isso importa quando há um limite em bytes no caminho: um header HTTP, uma coluna definida em bytes, um campo de tamanho fixo num arquivo de integração, um tamanho máximo de mensagem num broker.

O banco de dados é onde isso mais aparece, e cada um tem sua interpretação. O PostgreSQL conta caracteres em `VARCHAR(n)`. No Oracle, depende de a coluna ter sido criada com semântica de `BYTE` ou `CHAR`, e o padrão é `BYTE`: um `VARCHAR2(50)` aceita 50 bytes, não 50 letras. Mesmo com `CHAR` existe um teto em bytes por coluna. E o MySQL tem uma armadilha famosa: o charset chamado `utf8` é, na verdade, um UTF-8 limitado a 3 bytes por caractere (hoje um apelido de `utf8mb3`), então nada fora da faixa de 16 bits cabe, emojis incluídos. Dependendo do modo do servidor, o insert falha com "Incorrect string value" ou o texto é gravado truncado. O UTF-8 completo lá se chama `utf8mb4`, que é o padrão desde o MySQL 8.0, mas tabelas e conexões antigas ainda carregam o `utf8` velho.

Se a validação do backend usa `length()` e o banco conta outra coisa, você vai descobrir a diferença em produção, com o primeiro usuário que colocar emoji no nome.

## Encoding na borda

Toda vez que bytes viram texto ou texto vira bytes, existe um charset envolvido, mesmo quando você não escreveu nenhum. E quando ele é diferente na leitura e na escrita, aparece o famoso mojibake:

```java
byte[] bytes = "é".getBytes(StandardCharsets.UTF_8);
String errado = new String(bytes, StandardCharsets.ISO_8859_1);

System.out.println(errado); // Ã©
```

Se você já viu "SÃ£o Paulo" numa tela, foi exatamente isso: UTF-8 lido como Latin-1.

Por muito tempo, o charset padrão do Java dependia do sistema operacional, então o mesmo código funcionava no Linux e embaralhava acentos no Windows. Desde o JDK 18, o charset padrão das APIs passou a ser UTF-8 em todas as plataformas, o que eliminou boa parte dessa classe de bug. A exceção é a saída de console: `System.out` e `System.err` continuam usando o encoding do terminal. Mesmo assim, vale ser explícito sempre que converter, principalmente nas APIs que historicamente usavam o padrão do sistema: `getBytes()` e `new String(bytes)` sem argumento, `new InputStreamReader(in)`, `new FileReader(file)`, `new Scanner(in)`. Todas têm uma versão que recebe o charset, e código que não depende do padrão não quebra quando alguém roda com uma JVM antiga ou com `-Dfile.encoding` diferente.

## Maiúsculas e minúsculas também têm pegadinha

Para fechar, um clássico que derruba sistemas com usuários na Turquia:

```java
"title".toUpperCase(Locale.forLanguageTag("tr")); // TİTLE
```

Em turco, o "i" minúsculo vira "İ" (com ponto) em maiúscula, e o "I" maiúsculo vira "ı" (sem ponto) em minúscula. Se o seu código faz `toUpperCase()` sem locale, ele usa o locale padrão da JVM, e uma comparação como `comando.toUpperCase().equals("TITLE")` passa a falhar só nos servidores configurados em turco.

E nem sempre o tamanho se mantém: `"ß".toUpperCase()` devolve `"SS"`, com um caractere a mais.

Para texto que é identificador, chave, comando ou qualquer coisa que não seja exibida para pessoas, use `Locale.ROOT`:

```java
comando.toUpperCase(Locale.ROOT)
```

E para comparar sem diferenciar maiúsculas, prefira `equalsIgnoreCase` a converter os dois lados e comparar. Ele compara caractere a caractere, então não considera "ß" igual a "SS", mas não depende do locale.

## Na prática

Um resumo do que evita a maioria dos problemas:

- Lembre que `length()` conta unidades UTF-16, não letras.
- Normalize texto para NFC na entrada do sistema, antes de comparar, indexar ou guardar.
- Itere com `codePoints()` e corte com `offsetByCodePoints` (ou por grafemas, quando o texto é exibido), nunca com índice cru no meio de um texto livre.
- Quando o que importa é o que o usuário vê, conte grafemas com `\X`.
- Saiba como o seu banco mede o tamanho das colunas, e use `utf8mb4` no MySQL.
- Seja explícito com charset sempre que converter entre bytes e texto.
- Use `Locale.ROOT` em `toUpperCase` e `toLowerCase` para texto que não é exibido.

O Java já traz quase tudo o que é preciso para tratar Unicode direito: `Normalizer`, `codePoints()`, `\X`, charsets explícitos. O que falta, na maioria das vezes, é parar de assumir que um caractere é sempre um `char`.
