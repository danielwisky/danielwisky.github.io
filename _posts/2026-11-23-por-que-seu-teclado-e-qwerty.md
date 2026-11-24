---
layout: post
title: "Por que o seu teclado é QWERTY"
subtitle: "A história de um layout pensado para máquinas de escrever do século XIX, o mito de que ele foi feito para atrasar você, e se vale a pena trocar"
tags: [História, Produtividade]
---

Olhe para a fileira de cima do seu teclado, da esquerda para a direita: Q, W, E, R, T, Y. Você passa o dia inteiro em cima dessas teclas e provavelmente nunca parou para perguntar por que elas estão nessa ordem. Não é alfabética, não segue nenhuma frequência óbvia de letras, e mesmo assim é praticamente o mesmo arranjo em quase todo computador, notebook e celular do mundo ocidental.

A resposta curta é: porque uma máquina de escrever dos anos 1870 era assim. A resposta longa é mais interessante, e tem até um capítulo que explica por que você aperta `hjkl` no Vim.

## A máquina de Sholes

O layout QWERTY nasceu nas máquinas de escrever de Christopher Latham Sholes, um editor de jornal de Milwaukee que passou boa parte dos anos 1860 e 1870 tentando construir uma máquina de escrever que funcionasse de verdade, junto com alguns sócios. As primeiras versões tinham as teclas em ordem quase alfabética, em duas fileiras, parecidas com um teclado de piano.

Ao longo de vários protótipos, a ordem foi mudando. Não teve um dia em que alguém sentou e desenhou o QWERTY do zero: ele foi sendo ajustado, tecla por tecla, até chegar em algo muito próximo do que usamos hoje. A fabricação acabou nas mãos da E. Remington and Sons, a fabricante de armas e máquinas de costura, que começou a vender o modelo em 1874.

## O mito: "foi feito para você digitar mais devagar"

Você já deve ter ouvido que o QWERTY foi projetado para atrasar os datilógrafos. A história é boa, mas está meio torta.

As máquinas de escrever daquela época tinham as hastes das letras (as *typebars*) dispostas em círculo, todas batendo no mesmo ponto do papel. Se você apertasse duas teclas vizinhas em sequência rápida, as hastes podiam se enroscar e travar a máquina. A explicação mais repetida é que Sholes espalhou pares de letras comuns em inglês para lados diferentes do mecanismo, reduzindo esses travamentos.

Repare que o objetivo, nessa versão, não era deixar ninguém mais lento. Era evitar que a máquina travasse, o que na prática deixava a digitação *mais rápida*, porque cada travamento custava bem mais tempo do que qualquer distância extra entre as teclas.

E nem essa explicação é consenso. Há pesquisadores que, estudando as patentes e os protótipos da época, argumentam que a ordem das teclas foi muito influenciada por quem usava as primeiras máquinas: operadores de telégrafo, que transcreviam código Morse e tinham suas próprias necessidades. Como quase sempre acontece em história, a versão limpa e com uma causa só é a que pega, e a real é mais bagunçada.

Uma lenda que aparece junto: a de que a palavra "typewriter" foi deixada de propósito com todas as letras na fileira de cima, para o vendedor conseguir digitá-la rápido numa demonstração. É uma ótima história, e as letras realmente estão todas lá. Se foi de propósito, ninguém consegue provar.

## Como um layout vira padrão

Ter um layout na máquina da Remington não explica por que ele dominou o mundo. O que explica é o efeito de rede.

A máquina vendeu, escolas de datilografia começaram a ensinar QWERTY, empresas contratavam datilógrafos que sabiam QWERTY, e fabricantes faziam máquinas QWERTY porque era isso que os datilógrafos sabiam usar. No fim do século XIX, quando os grandes fabricantes americanos se juntaram, o QWERTY virou de vez o padrão da indústria. Daí em diante, cada pessoa treinada nele era mais um motivo para ninguém mudar.

Economistas usam o QWERTY como exemplo clássico de *path dependence*: uma escolha feita por motivos que nem existem mais continua valendo porque o custo de trocar ficou alto demais. Quando os computadores chegaram, as hastes de metal já tinham sumido havia tempo, mas o teclado veio junto, intacto. Depois veio o celular, com um teclado na tela que não tem mecanismo nenhum para travar, e o QWERTY veio de novo.

Para quem trabalha com software, essa história soa familiar. É a mesma razão pela qual aquele formato de arquivo esquisito, aquele nome de coluna errado ou aquela API mal desenhada continuam vivos: a decisão original pode ter sido razoável, ou nem isso, mas agora tem gente demais dependendo dela.

## Cada país com seu sotaque

O QWERTY não é exatamente igual em todo lugar. Ele foi adaptado para cada idioma:

- Na França e na Bélgica, o padrão é o **AZERTY**, com A e Z trocados de lugar com Q e W.
- Na Alemanha e em boa parte da Europa Central, é o **QWERTZ**, com Y e Z trocados, porque o Z é muito mais comum em alemão.
- No Brasil, o padrão é o **ABNT2**, que é um QWERTY com a tecla `Ç`, teclas mortas para acento e algumas teclas extras.

E aqui entra uma questão bem de dev. O ABNT2 é ótimo para escrever português, mas coloca colchetes, chaves, barra e crase em lugares que fazem qualquer programador sofrer um pouco. A crase, por exemplo, é tecla morta: você aperta e ela fica esperando a próxima letra para formar um `à`. Ótimo para texto, péssimo quando você só quer abrir um bloco de código em Markdown.

Por isso muita gente que programa usa teclado com layout americano e configura o sistema como **US International**, que permite fazer acentos com teclas mortas (`'` seguido de `a` vira `á`, por exemplo) e deixa os símbolos de programação onde o resto do mundo espera que eles estejam. Tem quem ame e tem quem não suporte o `'` virando acento quando só queria fechar uma string. Eu já passei pelas duas fases.

## Os rivais: Dvorak e Colemak

Se o QWERTY é um acidente histórico, por que não usar algo projetado de verdade?

A tentativa mais famosa é o **Dvorak**, patenteado em 1936 por August Dvorak e William Dealey. A ideia é simples: as letras mais usadas em inglês ficam na fileira do meio, onde os dedos descansam, com todas as vogais do lado esquerdo e as consoantes mais comuns do lado direito. Assim as mãos alternam mais e os dedos andam menos.

Por décadas circulou a história de que o Dvorak era muito superior e só não pegou por inércia. Ela se apoiava muito num estudo da Marinha americana dos anos 1940, que mostrava ganhos enormes. Mais tarde, outros pesquisadores apontaram que o estudo tinha problemas sérios, inclusive indícios de que o próprio Dvorak teve influência na condução dele, e um estudo do governo americano em 1956 não encontrou vantagem que compensasse o retreinamento. A leitura mais comum hoje é algo como: o Dvorak exige menos movimento dos dedos, mas a diferença de velocidade para quem já é bom no QWERTY é pequena.

O **Colemak**, criado por Shai Coleman em 2006, tenta um meio-termo. Ele mexe em bem menos teclas que o Dvorak, mantém Q, W, Z, X, C e V no lugar (ou seja, os atalhos de desfazer, recortar, copiar e colar continuam onde sua mão espera) e ainda assim coloca as letras mais comuns na fileira do meio. Existem variações dele, como o Colemak-DH, que ajusta mais algumas teclas pensando em conforto.

Um detalhe importante para nós: tanto o Dvorak quanto o Colemak foram otimizados para **texto em inglês**. Para português, a frequência das letras muda bastante, e para código mais ainda, já que boa parte do que você digita é símbolo, nome de variável e atalho da IDE.

## Por que o Vim usa `hjkl`

Agora o capítulo prometido. Se você usa Vim, sabe que `h`, `j`, `k` e `l` movem o cursor para esquerda, baixo, cima e direita. Parece arbitrário, mas não é.

Bill Joy escreveu o `vi`, o antecessor do Vim, no fim dos anos 1970, usando um terminal ADM-3A. Nesse terminal, as setas do cursor estavam impressas exatamente nas teclas H, J, K e L. Não havia teclas de seta separadas. O `vi` só usou o que o teclado oferecia, e o hábito ficou.

O mesmo terminal ajuda a explicar outras coisas. A tecla `Esc`, que no Vim você aperta o tempo todo, ficava onde hoje fica o `Tab`, bem perto da mão. É por isso que tanta gente que usa Vim remapeia o `Caps Lock` para `Esc` ou para `Ctrl`: está tentando recuperar a ergonomia de um teclado de uns 50 anos atrás. Tem até quem diga que o `~` virou o atalho para o diretório home no Unix porque, no ADM-3A, o til dividia a tecla com o `Home`. É uma explicação plausível, mas ninguém achou registro da época que confirme, então trate como curiosidade, não como fato.

Ou seja, até as "esquisitices" do seu editor favorito são herança de um teclado específico, do mesmo jeito que o QWERTY é herança de uma máquina de escrever específica.

## Vale a pena trocar de layout?

Minha opinião, depois de já ter brincado com isso: para a maioria dos devs, provavelmente não.

O motivo não é que o QWERTY seja bom. É que a digitação raramente é o gargalo do nosso trabalho. Você passa muito mais tempo lendo código, pensando e esperando build do que digitando. Ganhar alguns por cento de velocidade não muda seu dia.

E o custo de trocar é real:

- Algumas semanas digitando devagar, o que é bem frustrante.
- Atalhos que dependem de posição (como `hjkl` no Vim ou `WASD` em jogos) ficam espalhados.
- Qualquer computador que não é o seu vira um desafio. Pair programming na máquina de outra pessoa, servidor sem configuração, notebook emprestado.

Onde eu acho que a troca faz sentido é no conforto. Se você sente dor nas mãos ou nos punhos, um layout que movimenta menos os dedos pode ajudar, junto com as coisas que costumam fazer mais diferença: um teclado mais confortável, postura, pausas, e remapear teclas que você usa muito para lugares melhores (o `Caps Lock` é a candidata número um, quase ninguém precisa dele onde ele está).

Também vale olhar para o layout que você já usa antes de pensar em outro. Se você programa num ABNT2 e vive torcendo a mão para alcançar colchetes e chaves, testar o US International pode render mais do que aprender Dvorak.

## O que fica

O QWERTY é um ótimo lembrete de que muita coisa que parece "o jeito certo" é só o jeito que ficou. Uma decisão tomada para resolver um problema de hastes de metal travando, ou de operadores de telégrafo transcrevendo Morse, sobreviveu ao fim das máquinas de escrever, à chegada dos computadores e à chegada das telas sensíveis ao toque.

Da próxima vez que alguém no time disser "sempre foi assim" sobre algum pedaço do sistema, lembre do seu teclado. Às vezes o motivo original ainda existe. Às vezes ele morreu há 150 anos e ninguém percebeu.
