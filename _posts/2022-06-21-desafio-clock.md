---
layout: post
title: "Desafio Clock"
subtitle: "Desafio de programação para construção de um jogo de adivinhação chamado clock"
cover-img: "/assets/img/default-bg.jpg"
thumbnail-img: "/assets/img/thumbs/post-thumb-clock.png"
categories: [Programação]
tags: [Desafio de Programação]
---

Em **CLOCK**, o computador pensa numa hora entre 0:01 e 12:00 e, você terá que adivinhar a hora seguindo as pistas dadas pelas palavras códigos:

| Mega  | O campo hora está correto                                                                  |
| ----- | ------------------------------------------------------------------------------------------ |
| Hecto | O campo hora está fora no máximo em +/- 2 horas                                            |
| Deca  | O campo hora está fora no máximo em +/- 5 horas                                            |
| Kilo  | O campo minutos está correto                                                               |
| Deci  | O campo minutos está fora em no máximo +/- 2 minutos                                       |
| Centi | O campo minutos está fora em no máximo +/- 5 minutos                                       |
| Mili  | O campo minutos está fora em no máximo +/- 10 minutos                                      |
| Micro | O campo minutos está fora em no máximo +/- 20 minutos                                      |
| Bla   | É usado ou quando o campo hora ou quando o campo minutos está fora dos limites anteriores. |

Por exemplo:

```
Ja pensei na hora antes do almoco(00:01 - 12:00).
Agora eh sua vez de adivinhar.
Os formatos aceitos sao HH.MM ou H.MM ou H.M
Sua hora: -> 6.30
Hecto Micro Sua hora: -> 8.10
Deca Bla Sua hora: -> 4.50
Hecto Centi Sua hora: -> 5.55
Mega Mili Sua hora: -> 5.45
Mega Deci Sua hora: -> 5.47
Vc acertou em 6 tentativas
```

**CLOCK** irá gerar dois valores aleatórios um para a hora e outro para o minuto. Atente ao detalhe que não existe 0:00, logo, se for gerado tal combinação transforme-o em 12:00. Outra coisa, não se preocupem com detalhes do tipo de 10:58 para 11:02 são 4 minutos, pois, a hora está errada e ponto final.

Um cuidado estético extra muito importante é o de não mostrar a combinação Mega Kilo. Apenas uma mensagem de parabéns e o número de tentativas.

Um grande abraço e até o próximo post!
