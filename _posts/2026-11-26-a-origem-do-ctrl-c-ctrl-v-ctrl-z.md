---
layout: post
title: "De onde vieram o Ctrl+C, o Ctrl+V e o Ctrl+Z"
subtitle: "Tesoura e cola de verdade, o Xerox PARC, o Apple Lisa, e por que no terminal o Ctrl+C mata o seu processo em vez de copiar"
tags: [História, Produtividade, Terminal]
---

Ctrl+C, Ctrl+V. Você provavelmente faz isso centenas de vezes por dia sem pensar, do mesmo jeito que respira. E o Ctrl+Z, o botão de "volta no tempo", é talvez o atalho mais reconfortante que existe. Mas por que essas letras? C de *copy* faz sentido. E o V? E o Z? E por que, quando você aperta Ctrl+C no terminal, em vez de copiar, ele mata o programa que estava rodando?

A resposta junta tesoura de verdade, um laboratório da Xerox, o Apple Lisa e os velhos teletipos. Bora por partes.

## Recortar e colar era literal

Antes de existir computador, "recortar e colar" (*cut and paste*) não era metáfora. Editores de texto, os humanos, pegavam um manuscrito datilografado, recortavam parágrafos com tesoura e colavam em outra ordem numa folha nova. Era assim que se reorganizava um texto quando reescrever tudo à máquina dava trabalho demais.

Quando os computadores começaram a editar texto, o nome veio junto. E quem mais ajudou a transformar isso no gesto que conhecemos foi **Larry Tesler**, que trabalhava no Xerox PARC nos anos 1970. Junto com Tim Mott, ele construiu o Gypsy, um editor de texto que usava mouse e deixava você selecionar um trecho e recortar, copiar e colar sem ficar trocando de "modo".

Isso era uma bandeira pessoal do Tesler. Muitos editores da época eram **modais**: você estava num modo de inserir texto ou num modo de dar comandos, e a mesma tecla fazia coisas diferentes em cada um. Quem usa Vim sabe bem como é. Tesler achava isso hostil para quem não era especialista, e foi tão longe na campanha que chegou a usar uma placa de carro com os dizeres "NO MODES".

## O Lisa escolheu as letras, o Mac popularizou

O Xerox PARC inventou muita coisa que outras empresas popularizaram, e a Apple foi uma delas. O próprio Tesler foi para a Apple em 1980, onde trabalhou no Lisa e depois em outros projetos, como o Macintosh e o Newton.

As letras apareceram primeiro no **Apple Lisa**, lançado em 1983, escolhidas pelo próprio Tesler e combinadas com a tecla Apple. O Macintosh, lançado em 1984, herdou o esquema na tecla Command e o popularizou: **Command+Z** para desfazer, **Command+X** para recortar, **Command+C** para copiar e **Command+V** para colar.

Olhe para o seu teclado e repare onde essas teclas estão: **Z, X, C e V** ficam lado a lado, na fileira de baixo, à esquerda. Na prática, isso deixa os quatro atalhos ao alcance da mão esquerda, enquanto a direita fica no mouse.

E cada letra tem uma justificativa. Quem contou foi o próprio Tesler, anos depois, num e-mail para um pesquisador da Carnegie Mellon:

- **X** para recortar: o X era um símbolo comum de apagar.
- **C** para copiar: de *copy*.
- **V** para colar: é um acento circunflexo (^) de cabeça para baixo, a marca de inserção dos revisores, e já significava "inserir" em pelo menos um editor anterior.
- **Z** para desfazer: além de estar ao lado das outras três, o próprio formato do Z lembra ir, voltar e ir de novo, ou seja, fazer, desfazer e refazer. No Lisa, o mesmo comando desfazia e refazia.

## O Windows tinha outro esquema

O mundo do PC seguiu outro caminho. As primeiras versões do Windows, e depois o padrão **CUA** (*Common User Access*), que a IBM publicou em 1987, usavam outros atalhos:

- **Shift+Del** para recortar
- **Ctrl+Insert** para copiar
- **Shift+Insert** para colar
- **Alt+Backspace** para desfazer

O Windows usou esse esquema até a versão 3.0. Foi no Windows 3.1, em 1992, que o Ctrl+Z/X/C/V entrou, e a PC Magazine chegou a chamar a mudança de uma das mais controversas da versão. Os dois esquemas conviveram por anos, e o Z/X/C/V acabou vencendo.

O curioso é que o antigo não morreu. Experimente **Shift+Insert** num terminal Linux ou no Windows: em muitos deles, ele cola. É uma ótima carta na manga quando o Ctrl+V não funciona.

## No terminal, Ctrl+C é outra história

Agora a parte que confunde todo dev em algum momento. No terminal, Ctrl+C não copia: ele interrompe o programa que está rodando. E isso é mais antigo que qualquer interface gráfica.

Os terminais descendem dos **teletipos**, máquinas de escrever ligadas a computadores. Neles, segurar a tecla Control e apertar uma letra não fazia um "atalho". Gerava um **caractere de controle**, um dos 32 primeiros códigos do ASCII, que não são letras, mas instruções.

A regra é simples: o Ctrl zera os bits mais altos da letra. A letra C é o código 67 (`0x43`). Com Ctrl, vira 3 (`0x03`), que no ASCII se chama **ETX**, *End of Text*. Os sistemas operacionais passaram a tratar esse caractere como "pare o que está fazendo". No Unix, o terminal transforma o Ctrl+C no sinal `SIGINT`, que por padrão encerra o processo.

Uma vez que você conhece a regra, um monte de coisa que parecia arbitrária começa a fazer sentido:

| Atalho | Código | Nome ASCII | O que faz no terminal |
|---|---|---|---|
| Ctrl+C | 3 | ETX (End of Text) | Interrompe o processo (`SIGINT`) |
| Ctrl+D | 4 | EOT (End of Transmission) | Fim da entrada; fecha o shell se a linha estiver vazia |
| Ctrl+H | 8 | BS (Backspace) | Apaga um caractere |
| Ctrl+I | 9 | HT (Tab) | É literalmente um Tab |
| Ctrl+M | 13 | CR (Carriage Return) | Funciona como Enter |
| Ctrl+[ | 27 | ESC | É um Esc de verdade |
| Ctrl+Z | 26 | SUB (Substitute) | Suspende o processo (`SIGTSTP`); volte com `fg` |

Repare no **Ctrl+[**: ele gera um Esc de verdade. Se você usa Vim e acha o Esc longe demais, tem um atalho equivalente bem debaixo do dedo mínimo.

E repare no **Ctrl+Z**: no terminal Unix, ele não desfaz nada. Ele suspende o processo e te devolve o prompt. Muita gente aperta Ctrl+Z no meio de um editor achando que vai desfazer a última alteração, o editor "some", e a pessoa acha que perdeu tudo. Não perdeu: digite `fg` e ele volta. No DOS e no Windows, por outro lado, o Ctrl+Z tradicionalmente marcava fim de arquivo, o papel que o Ctrl+D tem no Unix.

## O travamento misterioso do Ctrl+S

Uma última herança dos teletipos, e talvez a mais traiçoeira: **Ctrl+S**. Em muitos terminais, ele não salva nada. Ele manda o caractere **XOFF**, que diz para o terminal parar de mostrar saída. Era um controle de fluxo, para quando o computador mandava texto mais rápido do que o teletipo conseguia imprimir.

O resultado moderno: você está num editor de terminal, aperta Ctrl+S por reflexo para salvar, e a tela congela. Nada responde. Parece que travou tudo. A saída é **Ctrl+Q**, o **XON**, que libera a tela de novo. Se isso te incomoda, `stty -ixon` no seu `.bashrc` ou `.zshrc` desliga esse comportamento.

## Por que copiar no terminal é Ctrl+Shift+C

Agora fica claro por que os emuladores de terminal no Linux usam **Ctrl+Shift+C** e **Ctrl+Shift+V** para copiar e colar. O Ctrl+C já tinha dono havia décadas, e roubar esse atalho quebraria o jeito de interromper programas. A solução foi acrescentar o Shift.

No Mac, esse conflito praticamente não existe, por causa da decisão tomada no Lisa e herdada pelo Mac: os atalhos de edição usam a tecla Command, e a Control ficou livre para o terminal. Command+C copia, Control+C interrompe. Duas teclas, dois mundos, nenhuma briga. Foi uma decisão pequena que ainda hoje facilita a vida de quem passa o dia no terminal.

## O que fica

Os atalhos que parecem universais são, na verdade, camadas de história empilhadas. Tem a tesoura dos editores de papel, a campanha do Larry Tesler contra os modos, as letras que o Tesler escolheu para o Lisa e o Mac popularizou, o padrão da IBM que ainda sobrevive no Shift+Insert e os caracteres de controle dos teletipos que dão sentido ao Ctrl+C, Ctrl+D e Ctrl+Z do terminal.

Se você gosta de deixar o terminal mais confortável, escrevi sobre algumas [ferramentas de terminal para produtividade](/2026-10-06-ferramentas-de-terminal-para-produtividade/). E se quer saber por que as letras estão nessa ordem no teclado, para começar, tem a história do [QWERTY](/2026-11-23-por-que-seu-teclado-e-qwerty/).
