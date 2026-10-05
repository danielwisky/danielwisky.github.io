---
layout: post
title: "Code review que ensina, não só aponta defeito"
subtitle: "A diferença entre revisar código e formar o time que escreve esse código"
tags: [Carreira, Programação]
---

Tem um jeito de fazer code review que resolve o problema imediato e não deixa nada pra trás: aponta a linha errada, sugere a correção, aprova depois do ajuste. Funciona, o código sobe melhor do que entrou. Mas existe outro jeito de revisar que, além de melhorar aquele pull request específico, deixa quem escreveu o código um pouco mais capaz de não cometer o mesmo erro no próximo. A diferença entre os dois não está na quantidade de comentários, está na intenção por trás deles.

## O review que só aponta defeito

É fácil reconhecer esse padrão porque ele é o caminho de menor esforço. O revisor olha o diff, identifica o que está errado e escreve a correção direto: "troca esse `for` por um `stream`", "esse método devia ser `private`", "falta tratar o caso de lista vazia aqui". Cada comentário resolve um problema pontual, mas nenhum deles explica por que aquilo importa. Quem recebeu a revisão aplica a mudança, dá um "ok, obrigado" e segue pro próximo PR sem necessariamente entender o raciocínio por trás da sugestão.

O risco desse padrão não é a qualidade do código aprovado, que normalmente é boa. O risco é que ele não escala. Se o mesmo tipo de problema aparece de novo três PRs depois, alguma coisa não foi transferida na primeira correção, só foi resolvida.

## O que muda quando o comentário explica o porquê

Um comentário que ensina carrega duas coisas: a observação do que está errado e o raciocínio que levou até ali. A diferença é sutil na forma, mas grande no efeito:

```
# Aponta só o defeito
Esse método está buscando no banco dentro do loop, mexe nisso.

# Ensina o porquê
Esse método está fazendo uma query por item do loop, o que vira N+1
queries conforme a lista crescer. Vale trazer tudo numa query só antes
do loop e montar um mapa por id, assim o custo fica constante independente
do tamanho da lista.
```

O segundo comentário não é mais longo porque o revisor quer parecer didático, é mais longo porque contém a informação que realmente evita o próximo N+1: o nome do problema, a causa, e o padrão de solução. Quem lê consegue generalizar isso pra outras situações parecidas, enquanto o primeiro comentário só resolve aquele método específico.

## Perguntar em vez de corrigir, quando faz sentido

Nem todo comentário precisa vir com a resposta pronta. Quando o ponto é discutível, ou quando a pessoa provavelmente já tem o raciocínio certo e só não aplicou, uma pergunta aberta funciona melhor que uma instrução:

- "O que acontece aqui se a lista vier vazia?"
- "Esse cache tem alguma estratégia de invalidação, ou fica preso até o próximo deploy?"
- "Vi que esse endpoint não tem paginação, já pensou no volume que ele pode receber em produção?"

Perguntas assim fazem quem escreveu o código voltar e pensar de novo, em vez de simplesmente aceitar a sugestão do revisor sem processar o motivo. O efeito colateral bom é que, às vezes, a resposta mostra que o autor já tinha pensado naquilo e tem um motivo válido que o revisor não tinha visto, o que vira uma conversa real em vez de uma correção unilateral.

## Elogiar decisão boa, não só criticar decisão ruim

Review que só aparece pra marcar erro ensina uma lição indesejada: que o silêncio é o resultado esperado, e o comentário é sinal de problema. Quando uma decisão técnica boa aparece no diff (uma abstração bem resolvida, um teste que cobre um caso de borda não óbvio, um nome de variável que deixou a intenção clara), vale comentar isso também. Reforça o padrão que você quer ver de novo, e isso funciona tão bem quanto apontar o que não quer ver repetido.

## Calibrar o tamanho do comentário pelo tamanho do problema

Explicar o porquê de tudo tem um custo, e exagerar nisso tem o efeito oposto do pretendido: o autor para de ler os comentários com atenção porque virou volume demais pra processar num PR só. A régua prática é escalar o esforço do comentário pela importância do problema:

1. **Estilo e preferência pessoal** (ordem de imports, nome de variável trivial): comentário curto, ou nem comentar, deixando pra um linter resolver automaticamente.
2. **Problema de manutenção** (duplicação, método grande demais, acoplamento desnecessário): comentário com o porquê, mas direto, sem virar ensaio.
3. **Problema de correção ou de performance em produção** (race condition, N+1, falta de tratamento de erro crítico): aqui vale o comentário completo, com exemplo, porque o custo de não transferir esse entendimento é alto.

## O ganho que não aparece no PR aprovado

Um code review que ensina custa mais tempo do revisor na hora, e isso é real: escrever o porquê leva mais tempo do que escrever a correção pronta. O retorno desse investimento não aparece no PR que está sendo revisado agora, aparece nos PRs futuros que chegam com menos desses problemas porque quem escreveu já internalizou a lição. Times que tratam review como ferramenta de formação, não só de controle de qualidade, tendem a gastar menos tempo total em revisão ao longo do tempo, porque o nível médio do código que entra pra revisar sobe. É um investimento que só compensa pra quem está pensando no time em semanas e meses, não só no PR de hoje.
