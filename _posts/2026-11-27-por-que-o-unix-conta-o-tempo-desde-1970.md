---
layout: post
title: "Por que o Unix conta o tempo a partir de 1970?"
subtitle: "O epoch nasceu em 1971, contando sessentas de segundo, e mudou mais de uma vez. E não é o único: Windows, Excel, GPS e o Mac têm cada um o seu marco zero"
tags: [História, Programação]
---

Abra qualquer banco de dados, log ou payload JSON e cedo ou tarde você vai topar com um número tipo `1795783200`. É um timestamp Unix: a quantidade de segundos desde a meia-noite de 1º de janeiro de 1970, em UTC. Esse instante tem nome, **Unix epoch**, e é provavelmente a data mais importante da computação que não marca nada de especial.

A pergunta óbvia é: por que 1970? O Unix não nasceu nesse dia. Nenhum evento histórico aconteceu nesse dia. E a resposta, como quase tudo nesta série de histórias, é menos épica e mais engraçada do que parece.

## O primeiro epoch era 1971

A primeira edição do manual do Unix, de novembro de 1971, definia o tempo do sistema como o tempo desde 00:00:00 de 1º de janeiro de **1971**, medido em **sessentas de segundo**.

Sessentas de segundo porque o PDP-11, a máquina onde o Unix rodava, tinha um relógio que gerava uma interrupção a cada ciclo da rede elétrica, que nos Estados Unidos é de 60 Hz. Era a forma mais simples de medir o tempo naquele hardware.

O problema é a conta. O valor era guardado em 32 bits, e 2³² sessentas de segundo dão pouco mais de dois anos. O próprio manual admitia isso, com um certo humor: o usuário "de mente cronológica" iria notar que isso dava "só uns 2,5 anos" (a conta real dá um pouco menos).

E não durou. Na terceira edição do manual, a página do `time` já trazia 1º de janeiro de 1972 como epoch, ainda em sessentas de segundo, com uma nota seca na seção de bugs: "isso garante uma crise a cada 2,26 anos". Na quarta edição, de novembro de 1973, a página já dizia outra coisa: **segundos** desde 00:00:00 GMT de **1º de janeiro de 1970**. Contar segundos em vez de sessentas de segundo estica os mesmos 32 bits de uns dois anos para cerca de 136 anos (uns 68 para cada lado do zero, já que o valor tem sinal), e o marco zero foi arredondado para o começo da década.

Quando exatamente o código mudou não se sabe com precisão, mas o motivo é claro. 1970 não foi escolhido por ser o aniversário de nada. Foi escolhido por ser um número redondo, recente o suficiente para ser útil, num momento em que a equipe precisava parar de mudar o epoch a cada dois anos.

## O preço dos 32 bits

Contando segundos num inteiro de 32 bits **com sinal**, o maior valor possível é 2.147.483.647. Somando isso a 1970, você chega em janeiro de 2038. É o famoso bug do ano 2038, que eu já destrinchei num [post só sobre ele](/2026-11-04-bug-do-ano-2038/).

O sinal tem um lado bom: números negativos representam datas antes de 1970. O timestamp `-86400` é 31 de dezembro de 1969. Isso funciona na maioria dos sistemas, mas não em todos, e de vez em quando alguém descobre isso tentando guardar a data de nascimento de um cliente mais velho.

## Unix time finge que segundos bissextos não existem

Uma particularidade importante: no Unix time, **todo dia tem exatamente 86.400 segundos**. Só que a Terra não concorda. Por causa de pequenas variações na rotação do planeta, de tempos em tempos foi inserido um **segundo bissexto** (*leap second*) no UTC, um minuto com 61 segundos.

O Unix time simplesmente ignora isso. Quando um segundo bissexto acontece, o relógio Unix repete um segundo ou dá um pequeno salto, dependendo da implementação. Isso já derrubou sistemas de verdade, porque código que assume que o tempo sempre anda para frente fica muito confuso quando o mesmo segundo acontece duas vezes.

Algumas empresas grandes passaram a "espalhar" o segundo extra ao longo de várias horas, deixando o relógio um tiquinho mais lento em vez de dar o salto. É o chamado *leap smear*. E a boa notícia é que, em outubro de 2026, a Conferência Geral de Pesos e Medidas (CGPM) aprovou o fim dos segundos bissextos: a partir de 20 de maio de 2027, o UTC passa a ser contínuo, e a diferença para a rotação da Terra pode chegar a uma hora antes de alguém precisar mexer nisso. O último segundo bissexto foi inserido em 31 de dezembro de 2016. Um problema a menos para a próxima geração.

## Todo mundo tem o seu 1970

O Unix não é o único sistema com um marco zero arbitrário. Cada plataforma escolheu o seu, e conhecer os principais ajuda muito quando você está olhando um número estranho num log:

| Sistema | Marco zero | Unidade |
|---|---|---|
| Unix, Linux, macOS | 1º/01/1970 | segundos |
| Java (`currentTimeMillis`, `Instant`) e JavaScript (`Date`) | 1º/01/1970 | milissegundos (`Instant` vai até nanossegundos) |
| Windows (`FILETIME`) | 1º/01/1601 | intervalos de 100 nanossegundos |
| .NET (`DateTime.Ticks`) | 1º/01/0001 | intervalos de 100 nanossegundos |
| Excel (Windows) | 1900 | dias |
| Mac clássico e Excel antigo no Mac | 1º/01/1904 | segundos / dias |
| GPS | 06/01/1980 | semanas + segundos |
| NTP | 1º/01/1900 | segundos |
| Apple Cocoa (`NSDate`) | 1º/01/2001 | segundos |

Algumas dessas escolhas têm histórias boas.

O **Windows** usa 1601 porque é o início de um ciclo de 400 anos do calendário gregoriano, o período depois do qual o padrão de anos bissextos se repete. Começar ali deixa a matemática de datas mais simples.

O **Excel** é o mais divertido. No Windows, ele conta dias a partir de 1900 e acredita que **29 de fevereiro de 1900 existiu**. Não existiu: 1900 não foi bissexto. Esse bug veio do Lotus 1-2-3, a planilha dominante antes do Excel, e a Microsoft o manteve de propósito para que as planilhas do Lotus abrissem com as datas certas. Ele está lá até hoje, por compatibilidade. Já o Excel do Mac usava por padrão o sistema de 1904, porque o Mac clássico contava a partir dali, e essa diferença rendeu muita planilha com datas deslocadas em quatro anos e um dia quando passava de um computador para outro.

O **GPS** conta semanas desde 6 de janeiro de 1980, e o número da semana era guardado em apenas 10 bits. Isso dá 1024 semanas, uns 19,6 anos. O contador voltou a zero em 1999 e de novo em 2019, e em ambas as vezes alguns receptores mais antigos passaram a mostrar datas erradas. É o primo do bug de 2038, só que aconteceu de verdade, duas vezes.

## O bug clássico: segundos ou milissegundos?

Agora a parte que mais causa problema no dia a dia. O Unix conta em **segundos**. Java e JavaScript contam em **milissegundos**. E os dois são "timestamps desde 1970", então ninguém desconfia até o bug aparecer.

```java
long agoraMillis = System.currentTimeMillis(); // ~1.795.783.200.000
long agoraSegundos = Instant.now().getEpochSecond(); // ~1.795.783.200

// Valor em segundos, vindo de uma API externa, tratado como millis:
Instant errado = Instant.ofEpochMilli(1795783200L);
System.out.println(errado); // 1970-01-21T18:49:43.200Z

// Valor em millis tratado como segundos:
Instant pior = Instant.ofEpochSecond(1795783200000L);
System.out.println(pior); // lá pelo ano 58.000 e pouco
```

Os dois sintomas são inconfundíveis quando você conhece o padrão:

- **Datas em janeiro de 1970**: alguém interpretou segundos como milissegundos.
- **Datas no ano 50 mil e tantos**: alguém interpretou milissegundos como segundos.

Um truque rápido para conferir é contar os dígitos. Um timestamp atual em segundos tem 10 dígitos; em milissegundos, 13. Se o contrato da API não diz a unidade, vale a pena deixar isso explícito no nome do campo, como `created_at_epoch_ms`, ou usar um formato que não deixa margem para dúvida, como uma string ISO 8601 com fuso: `2026-11-27T12:40:00Z`. Falei mais sobre esse tipo de armadilha no post sobre [fusos horários](/2026-11-05-fusos-horarios-sao-uma-armadilha/).

## O que fica

O epoch Unix não marca o nascimento do Unix, nem de ninguém. Ele é o resultado de uma equipe pequena que, depois de mudar o marco zero algumas vezes porque o contador estourava rápido demais, decidiu contar segundos e arredondar para o começo da década.

Uma decisão pragmática que, meio século depois, continua em cada log, cada banco de dados e cada token JWT que você já decodificou. Se alguém disser que uma escolha técnica "é só temporária", lembre que 1º de janeiro de 1970 também era.
