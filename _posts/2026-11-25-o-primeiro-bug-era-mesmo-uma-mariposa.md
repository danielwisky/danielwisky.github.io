---
layout: post
title: "O primeiro bug era mesmo uma mariposa?"
subtitle: "A história do inseto colado num diário de bordo em 1947, o que a Grace Hopper teve a ver com isso, e por que a palavra bug é bem mais velha que o computador"
tags: [História, Programação]
---

Se você trabalha com software há algum tempo, já ouviu essa história: o primeiro bug de computador foi uma mariposa de verdade, presa dentro de uma máquina, e foi daí que veio o nome. É uma ótima história para contar no café. O problema é que ela está só meio certa.

A mariposa existiu, e o pedaço de papel com ela colada existe até hoje. Mas ela não foi o primeiro bug, a palavra não nasceu ali, e a pessoa que costuma levar o crédito provavelmente nem foi quem a encontrou.

## O que aconteceu em 1947

No dia 9 de setembro de 1947, a equipe que operava o **Harvard Mark II**, um computador eletromecânico construído na Universidade Harvard para a Marinha americana, estava investigando uma falha. O Mark II não era feito de transistores, que ainda nem tinham sido inventados, nem principalmente de válvulas. Ele funcionava com milhares de relés: pequenos interruptores mecânicos que abriam e fechavam com um clique.

Procurando o problema, os operadores encontraram uma mariposa presa entre os contatos de um dos relés. Eles tiraram o inseto, colaram no diário de bordo da máquina com fita adesiva e escreveram ao lado:

> First actual case of bug being found.

Algo como "primeiro caso real de bug sendo encontrado". O diário com a mariposa está hoje no acervo do Museu Nacional de História Americana, do Smithsonian, em Washington.

## Repare na palavra "actual"

Leia a frase de novo. Ela não diz "encontramos um inseto, vamos chamar isso de bug". Ela diz "primeiro caso **real** de bug". Isso só tem graça se todo mundo ali já chamasse falhas de "bug".

E chamavam. A anotação é uma piada de engenheiro: o tipo de defeito que eles passavam o dia caçando finalmente apareceu na forma literal, com asas e antenas. É por isso que o inseto foi parar no diário. Se "bug" fosse uma palavra nova, não teria piada nenhuma.

## A palavra é do século XIX

"Bug" como sinônimo de defeito técnico circulava entre engenheiros muito antes de existir computador. O exemplo mais citado é Thomas Edison, que numa carta de 1878 já falava em "bugs" para descrever as pequenas falhas e dificuldades de suas invenções. O Computer History Museum, por exemplo, atribui a origem do termo a Edison.

Não dá para cravar quem usou primeiro. Gírias de oficina raramente têm certidão de nascimento. Mas dá para dizer com segurança que, quando a mariposa entrou no relé do Mark II, a palavra já tinha umas sete décadas de estrada.

## E a Grace Hopper?

Na versão popular, foi a **Grace Hopper** quem encontrou a mariposa. Ela estava mesmo na equipe do Mark II e é uma das pessoas mais importantes da história da programação. Mas o próprio Smithsonian diz que o diário provavelmente não era dela, e a Britannica observa que a anotação nem está com a letra dela.

O que a Hopper fez foi tornar a história famosa. Ela contou o caso da mariposa em inúmeras palestras ao longo das décadas seguintes, e as pessoas foram juntando as duas coisas na memória: a cientista famosa e o inseto famoso. Com o tempo, "a Hopper estava na equipe e adorava contar a história" virou "a Hopper encontrou o bug".

Ela não precisa desse crédito emprestado. Grace Hopper trabalhou no Mark I e no Mark II, depois foi para a indústria e escreveu um dos primeiros compiladores, o A-0, no começo dos anos 1950. Ela defendia uma ideia que na época parecia estranha: que programas deveriam ser escritos em algo parecido com inglês, e não em código de máquina. Isso deu origem à linguagem FLOW-MATIC, que por sua vez influenciou muito o **COBOL**, que ainda roda em bancos e governos pelo mundo todo. Ela também chegou a contra-almirante da Marinha americana.

Uma das demonstrações mais famosas dela era distribuir pedaços de fio de uns 30 centímetros e explicar que aquilo era um **nanossegundo**: a distância que a luz, ou um sinal elétrico, percorre em um bilionésimo de segundo. Era a forma dela de explicar para generais por que um satélite demorava para responder, e por que computadores precisavam ser pequenos para serem rápidos.

## E "debugging"?

Às vezes a história vem com um bônus: a Hopper teria inventado a palavra "debugging". De novo, não há evidência boa de que ela tenha criado o termo. O que se pode dizer é que a equipe do Mark II, ela incluída, ajudou a popularizar tanto "bug" quanto "debug" no vocabulário da computação, que estava nascendo ali.

## Por que a história errada pegou

A versão "a mariposa foi o primeiro bug e a Hopper a encontrou" tem tudo que uma história precisa para se espalhar: um objeto concreto (o inseto colado no papel), uma personagem famosa, uma data exata e uma origem simples para uma palavra que todo mundo usa. A versão real é mais confusa: a palavra já existia, ninguém sabe exatamente quem a usou primeiro, e a pessoa famosa estava por perto, mas não foi a protagonista.

É o mesmo padrão de muita lenda da computação. A história limpa, com uma causa e um herói, vence a história bagunçada. Eu falei disso no post sobre o [teclado QWERTY](/2026-11-23-por-que-seu-teclado-e-qwerty/), e acontece de novo aqui.

## O que a mariposa ainda ensina

Tirando a lenda, sobra uma lição bem prática. O diário do Mark II mostra três hábitos que muito time de software hoje não tem:

- **Manteve um diário.** O Mark II tinha um registro de operação, com horários, testes executados e problemas encontrados ao longo do dia. É basicamente um log de incidente escrito à mão. Foi graças a ele que sabemos dessa história mais de 75 anos depois.
- **Apontou a causa, não só o sintoma.** A anotação diz o lugar exato do problema: o relé 70 do painel F. Não ficou registrado "deu erro, reiniciamos", ficou registrado o que causou a falha e onde.
- **Registrou a evidência.** Mesmo que meio de brincadeira, a mariposa foi colada no diário junto com a anotação do que aconteceu.

Troque "relé" por "serviço", "diário" por "postmortem" e "mariposa" por "stack trace", e você tem uma boa descrição de como investigar um problema em produção. Se quiser ir mais fundo nisso, escrevi sobre [debugar com o método científico](/2026-10-29-debugando-com-o-metodo-cientifico/), e sobre alguns [grandes bugs da história](/2026-11-03-grandes-bugs-da-historia/) que custaram bem mais caro que uma mariposa.

Da próxima vez que alguém contar a história do primeiro bug, você pode corrigir com carinho: não foi o primeiro, mas foi o primeiro de verdade. Com asas e tudo.
