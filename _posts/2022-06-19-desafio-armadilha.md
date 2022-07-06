---
layout: post
title: Desafio Armadilha
subtitle: Desafio de programação para construção de um jogo de adivinhação chamado armadilha
tags: [desafios, programação, jogos]
---

Em **ARMADILHA** o computador gera um número entre 1 e 100 e o jogador tentará prender o número do oponente entre dois números. O computador irá mostrar uma das mensagens abaixo:

> "Meu numero esta entre os seus" ou "Meu numero NAO esta entre os seus"

dependendo se o número gerado estiver ou não entre os valores colocados pelo jogador. O jogo acabará quando o jogador aprisionar completamente o número gerado pelo computador. Por exemplo:

```
Ja pensei no numero. Agora eh sua vez de adivinhar um numero de 1 a 100

Digite o limite inferior: -> 1
Digite o limite superior: -> 50
Meu numero esta entre os seus
Digite o limite inferior: -> 36
Digite o limite superior: -> 12
Meu numero nao esta entre os seus
Digite o limite inferior: -> 37
Digite o limite superior: -> 50
Meu numero esta entre os seus
Digite o limite inferior: -> 40
Digite o limite superior: -> 47
Meu numero esta entre os seus
Digite o limite inferior: -> 44
Digite o limite superior: -> 42
Meu numero esta entre os seus
Digite o limite inferior: -> 43
Digite o limite superior: -> 43
Meu numero nao esta entre os seus
Digite o limite inferior: -> 42
Digite o limite superior: -> 42
Voce levou 7 tentativas para acertar
```

**ARMADILHA** é um jogo simples sem efeito especial e a única instrução a salientar é que o jogo não pára se o jogador trocar o limite superior pelo inferior. O próprio programa se encarregará de arrumá-los.

```
Digite o limite inferior: -> 36
Digite o limite superior: -> 12
```

Internamente deverá ser limite inferior 12 e limite superior 32. Não se esqueça de mostrar o número de tentativas ao final do jogo.

Um grande abraço e até o próximo post!
