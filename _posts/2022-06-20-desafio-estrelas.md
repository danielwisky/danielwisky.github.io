---
layout: post
title: Desafio Estrelas
subtitle: Desafio de programação para construção de um jogo de adivinhação chamado estrelas
cover-img: /assets/img/post-bg-desafio.jpg
tags: [desafio, programação, jogos]
---

Em **ESTRELAS** o objetivo é adivinhar um número N (entre 32 e 128) gerado pelo computador. A cada entrada (G) o computador emitirá uma mensagem composta por “estrelas”, sendo que a diferença poderá ser tanto para cima quanto para baixo:

| Diferença | Mensagem             |
|-----------|----------------------|
| >=64      | *	 (1 estrela)        |
| >=32      | **	 (2 estrelas)      |
| >=16      | ***	 (3 estrelas)     |
| >=8       | ****	 (4 estrelas)    |
| >=4       | *****	 (5 estrelas)   |
| >=2       | ******	 (6 estrelas)  |
| =1        | *******	 (7 estrelas) |

Por exemplo:

```
Ja tenho o numero em mente.
Agora eh sua vez de adivinhar
Entre com um valor entre 32 e 128: -> 96
***
Entre com um valor entre 32 e 128: -> 112
**
Entre com um valor entre 32 e 128: -> 80
*****
Entre com um valor entre 32 e 128: -> 76
******
Entre com um valor entre 32 e 128: -> 72
*******
Entre com um valor entre 32 e 128: -> 71
******
Entre com um valor entre 32 e 128: -> 73
Vencedor apos 7 tentativas
```

**ESTRELAS** é bem parecido com **ARMADILHA**, mas poderá ser jogado até por uma pessoa com deficiência visual, pois, para cada estrela mostrada na tela um beep será produzido pelo alto-falante do computador. Esse efeito é dado mostrando o caractere especial '\a'. 

Por exemplo:

```
#include <iostream.h>

void main() {

    int i;
    
    for(i=1;i<=10;i++){
        cout<<i<<"\a ";
    }
    
    cout<<"\n";

}
```

Aproveite que você já sabe como acionar o beep no computador e faça um carnaval sonoro quando o jogo terminar.

Um grande abraço e até o próximo post!
