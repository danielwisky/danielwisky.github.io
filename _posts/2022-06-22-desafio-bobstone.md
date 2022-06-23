---
layout: post
title: Desafio Bobstone
subtitle: Desafio de programação para construção de um jogo de adivinhação chamado armadilha
cover-img: /assets/img/post-bg-desafio.jpg
tags: [desafio, programação, jogos]
---

Apesar de estranho o nome **BOBSTONE**, este é um jogo muito fácil. A idéia aqui é adivinhar a paridade, a soma e o valor de dois dados rolados pelo adversário.

| Adivinhando      | receberá |
|------------------|----------|
| Faces            | 3 pontos |
| Valor da soma    | 2 pontos |
| Paridade da soma | 1 ponto  |

Sendo que a pontuação não é cumulativa. Vence quem conseguir primeiro 11 pontos ou mais.

Neste jogo seu oponente será o computador e abaixo está uma simulação. (Não se preocupe, programando direitinho o computador não verá suas faces antes de rolar os dados).

```
De quem eh a vez? (1) Eu (0) Voce 1
Digite as faces dos dados rolados por vc ->6 5
Meus chutes sao 6 6
Eu 0 Voce 0
Digite as faces dos dados que rolei > 4 6
Minhas faces sao 5 5
Eu 0 Voce 2
Digite as faces dos dados rolados por vc ->4 5
Meus chutes sao 6 5
Eu 1 Voce 2
Digite as faces dos dados que rolei > 1 1
Minhas faces sao 1 1
Eu 1 Voce 5
Digite as faces dos dados rolados por vc ->2 4
Meus chutes sao 5 3
Eu 2 Voce 5
Digite as faces dos dados que rolei > 1 1
Minhas faces sao 6 6
Eu 2 Voce 6
Digite as faces dos dados rolados por vc ->1 3
Meus chutes sao 2 4
Eu 3 Voce 6
Digite as faces dos dados que rolei > 6 2
Minhas faces sao 2 6
Eu 3 Voce 9
Digite as faces dos dados rolados por vc ->4 1
Meus chutes sao 2 3
Eu 5 Voce 9
Digite as faces dos dados que rolei > 2 3
Minhas faces sao 4 1
Eu 5 Voce 11
Vc venceu! Me deve uma revanche!!
```

Revanche:

```
De quem eh a vez? (1) Eu (0) Voce 0
Digite as faces dos dados que rolei > 1 2
Minhas faces sao 4 3
Eu 0 Voce 1
Digite as faces dos dados rolados por vc ->6 1
Meus chutes sao 1 6
Eu 3 Voce 1
Digite as faces dos dados que rolei > 2 2
Minhas faces sao 1 1
Eu 3 Voce 2
Digite as faces dos dados rolados por vc ->3 4
Meus chutes sao 5 2
Eu 5 Voce 2
Digite as faces dos dados que rolei > 1 4
Minhas faces sao 2 5
Eu 5 Voce 3
Digite as faces dos dados rolados por vc ->1 3
Meus chutes sao 2 2
Eu 7 Voce 3
Digite as faces dos dados que rolei > 1 5
Minhas faces sao 5 1
Eu 7 Voce 6
Digite as faces dos dados rolados por vc ->6 4
Meus chutes sao 6 4
Eu 10 Voce 6
Digite as faces dos dados que rolei > 2 4
Minhas faces sao 6 2
Eu 10 Voce 7
Digite as faces dos dados rolados por vc ->5 6
Meus chutes sao 5 6
Eu 13 Voce 7
Eu venci! Yupiiii
```

Em **BOBSTONE** o computador deverá gerar os valores dos dados antes da jogada do humano, independente de quem é a vez de fazer a jogada. Acertar a paridade da soma, significa que a soma dos dados do computador e a soma do jogador são ímpares ou pares na mesma jogada.

Um grande abraço e até o próximo post!
