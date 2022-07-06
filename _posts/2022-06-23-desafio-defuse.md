---
layout: post
title: Desafio Defuse
subtitle: Desafio de programação para construção de um jogo de adivinhação chamado defuse
tags: [desafios, programação, jogos]
---

Neste jogo você acaba de receber um telefonema para desarmar uma bomba que foi colocada em um edifício com um milhão de quartos (100 quartos de largura, 100 quartos de comprimento e 100 quartos de altura).

Por sorte, você conta com um detector de bombas, cujo sinal aumenta, quanto mais próximo da bomba, você estiver. Além disso, estando no mesmo ambiente, este detector de bombas é capaz de enviar um sinal eletrônico que desativa o circuito eletrônico da bomba. Em resposta ao sinal do detector, você terá 10 segundos para fazer uma nova tentativa, num total de 200 segundos ou 20 tentativas para encontrá-la.

É muito fácil encontrar a bomba uma vez que você entenda como o detector funciona, mas, não vou estragar seu jogo te contando este detalhe.

```
Voce esta em um predio governamental com 1.000.000 de quartos. 
O predio tem 100 quartos de largura(0-99), 100 quartos
de comprimento (0-99) e 100 quartos de altura(0-99) e vc esta na porta(0,0,0)
Existe uma bomba num dos quartos, e vc tem um detector de bombas cujo sinal aumenta
a medida que voce se aproxima da bomba
Voce tem 200s (20 tentativas) para desarmar a bomba.
Sinal           Larg    comp    Alt
6532.59         0       0       0       ?: 41 67 34
Foi vc que colocou a bomba la dentro!!!
Confesse vamos.

Voce esta em um predio governamental com 1.000.000 de quartos. 
O predio tem 100 quartos de largura(0-99), 100 quartos
de comprimento (0-99) e 100 quartos de altura(0-99) e vc esta na porta(0,0,0)
Existe uma bomba num dos quartos, e vc tem um detector de bombas cujo sinal aumenta
a medida que voce se aproxima da bomba
Voce tem 200s (20 tentativas) para desarmar a bomba.
Sinal           Larg    comp    Alt
6771.23         0       0       0       ?: 70 50 30
9777.93         70      50      30      ?: 70 40 32
9987.93         70      40      32      ?: 77 28 32
Parabens!Voce eh um heroi!!!
```

Outro exemplo:

```
Voce esta em um predio governamental com 1.000.000 de quartos. 
O predio tem 100 quartos de largura(0-99), 100 quartos
de comprimento (0-99) e 100 quartos de altura(0-99) e vc esta na porta(0,0,0)
Existe uma bomba num dos quartos, e vc tem um detector de bombas cujo sinal aumenta
a medida que voce se aproxima da bomba
Voce tem 200s (20 tentativas) para desarmar a bomba.
Sinal           Larg    comp    Alt
1903.16         0       0       0       ?: 99 99 99
8096.85         99      99      99      ?: 90 90 90
8993.94         90      90      90      ?: 80 80 80
9983.96         80      80      80      ?: 70 70 70
8973.86         70      70      70      ?: 75 75 75
9478.91         75      75      75      ?: 81 81 81
9884.97         81      81      81      ?: 85 85 85
9488.99         85      85      85      ?: 83 83 83
9686.99         83      83      83      ?: 84 84 84
9588            84      84      84      ?: 84 85 85
9489            84      85      85      ?: 84 84 83
9688            84      84      83      ?: 84 84 81
9888            84      84      81      ?: 84 84 80
9988            84      84      80      ?: 84 70 80
9974            84      70      80      ?: 84 86 80
9990            84      86      80      ?: 84 87 80
9991            84      87      80      ?: 84 89 80
9993            84      89      80      ?: 84 91 80
9995            84      91      80      ?: 84 92 80
9996            84      92      80      ?: 84 94 80
\ | | | | | /
=BUUMM=
/ | | | | | \
Todo predio explodiu e vc estava dentro
Nao teras outra chance
A bomba estava em 84 96 80
```

**DEFUSE** é o único que tem uma equação para gerar o sinal do detector. Essa equação é dada por

> sinal=10000-(abs(a-d)/100.0+abs(b-e)+abs(c-f)*100);

onde as variáveis **(a, b, c)** representam a largura, o comprimento e a altura do quarto onde está a bomba, **(d, e, f)** representam a largura, o comprimento e a altura do quarto onde o jogador julga que está a bomba. A função abs() é a função que retorna o valor em módulo. Essa função pertence a biblioteca math.h e sinal é uma variável do tipo **float**. Notem que há três situações possíveis de saída:

* aquela que o jogador não desarma a bomba (não conseguiu em 20 tentativas);
* aquela que o jogador desarma a bomba, mas é suspeito de ser quem colocou a bomba (acertar de primeira);
* aquela na qual  o jogador é considerado um herói.

Um grande abraço e até o próximo post!
