---
layout: post
title: "Todo código é slop (menos o meu): como manter qualidade quando agentes escrevem quase tudo"
subtitle: "O que a palestra da Lauren Tan ensina sobre trocar regra em prosa por lint, API e verificação"
tags: [Clean Code, Inteligência Artificial]
---

"Slop" virou a palavra da moda para falar mal de código gerado por IA. E é fácil olhar para o código dos outros e chamar de slop. Apontar o dedo para o PR do agente não custa nada, mas o teste de verdade é outro: o seu milésimo PR feito com ajuda de agente continua bom?

Esse é o ponto de partida da palestra [All Code Is Slop (Except Mine)](https://www.youtube.com/watch?v=O_zcc6Xl12g), da Lauren Tan, publicada no canal do AI Engineer. Ela trabalha no time do Grok Bot, na SpaceXSI, e contou como o time passou a mergear um volume enorme de PRs escritos por agentes sem a qualidade desabar. Vale assistir inteira. Aqui vão as ideias que mais me marcaram.

## O gargalo mudou de lugar

Em algum momento, os agentes passaram a escrever mudanças mais rápido do que ela conseguia ler. A Lauren lembra que, em 2024, chegava para revisar uns três PRs escritos pelos colegas. Na época da palestra, o número equivalente estava mais perto de trezentos. Nesse ritmo, revisão humana linha por linha deixa de ser uma estratégia viável.

A resposta dela não é "revise mais rápido" nem "confie no agente". É investir no ambiente em que o agente trabalha, para que a maior parte dos erros nem chegue até a revisão.

## A pirâmide de confiança invertida

A ideia central da palestra é uma pirâmide com cinco camadas, ordenadas da mais barata para a mais cara. O esforço de engenharia deve ir principalmente para o topo:

1. **Código e design de API.** A melhor forma de evitar uma escolha ruim é torná-la impossível. Se a API não permite o erro, ninguém precisa lembrar de não cometê-lo.
2. **Checagens determinísticas.** Lint, type checker, compilador e testes pegam o que o código ainda permite, mas não deveria.
3. **Verificação.** Checagens em tempo de execução (e até formais) confirmam que o comportamento é o que foi pedido.
4. **Prosa.** Regras escritas, arquivos de instrução e skills. Ficam reservadas para decisões que ainda dependem de julgamento.
5. **Revisão humana.** A ponta da pirâmide, a camada mais cara e a que menos escala.

O que me chamou atenção foi a posição da prosa, quase no fim da fila. Muita gente, quando um agente erra, corre para adicionar mais uma linha no `AGENTS.md` ou no `CLAUDE.md`. Pela lógica da pirâmide, quando um erro se repete, a correção deve ir para um lugar que o agente não consegue contornar: o próprio código, a API ou uma checagem executável. Texto fica para o que realmente depende de julgamento.

## O código é o prompt

Um agente aprende com o repositório. Se existe um workaround esquisito em algum canto, o próximo agente pode muito bem tomá-lo como o padrão estabelecido. Ela compara esse trabalho com jardinagem: apagar código deprecado e limpar exemplos ruins muda o que o agente vai reproduzir.

O exemplo que ela trouxe vem do Cursor, outro app Electron. Lá, agentes tinham importado código do processo principal dentro do renderer, e as tarefas longas resultantes deixavam a interface engasgando. No framework que o time dela construiu para o Grok Bot, chamado Dune, a solução foi estrutural: código do renderer e código do processo principal vivem em dois diretórios de topo com nomes explícitos. O nome da pasta já dá contexto ao agente enquanto ele escreve. E, para quando ele não percebe a dica, um analisador de grafo de dependências e regras de lint bloqueiam o import cruzado.

Outro exemplo: o `useEffect` tem usos legítimos, mas os agentes erravam com frequência no julgamento de quando usá-lo. No Dune, ele só é permitido dentro de algumas APIs do próprio framework e é proibido no código de produto. Ninguém precisa decidir em revisão se aquele `useEffect` específico é uma exceção aceitável. A regra decide.

## Comentário não segura ninguém

Essa parte é provocativa. No Cursor, agentes usavam `setTimeout`, `requestAnimationFrame` e `requestIdleCallback` para contornar o choque entre o estilo imperativo do VS Code e o estilo declarativo do React. Em escala, criar e destruir tantos timers em sequência acabava disparando coletas de lixo pesadas, que o usuário sentia como lentidão.

No Grok Bot, o time tomou uma posição pouco comum: baniu o que ela descreve como 99% dos comentários. O argumento é que eles ficam desatualizados, humanos pulam a leitura e, principalmente, não impedem a próxima mudança errada. A orientação foi para as mensagens de lint: elas aparecem exatamente quando a regra é violada e podem explicar ao agente qual é o problema de fundo e como resolver do jeito certo.

Você não precisa concordar com banir comentários para aproveitar a ideia. A pergunta útil é: aquela explicação que está num comentário poderia estar numa mensagem de erro que dispara na hora certa?

Quando uma correção aparece repetidamente em code review, o time procura uma checagem que dê para automatizar ou uma mudança de API que elimine o erro de vez. À medida que essas decisões saíram da revisão manual, os agentes passaram a conseguir mergear a maior parte dos próprios PRs.

## Verificar custa mais do que gerar

A palestra cita a Cindy Sridharan, que atribui ao novo processo de verificação dela a solução do problema de qualidade e conta gastar cerca de 70% dos tokens do dia verificando patches, contra uns 20 a 30% criando. A Lauren também gasta a maior parte dos tokens dela com verificação.

Isso inverte a intuição comum de que o caro é escrever o código. Escrever ficou barato. Ter certeza de que está certo, não. Algumas das ferramentas que o time usa:

- **Acesso ao app rodando.** Skills que dão ao agente acesso a ferramentas de depuração como o Chrome DevTools Protocol. Um vídeo mostra a interação acontecendo e um screenshot captura o estado final.
- **Um mapa de funcionalidades.** Uma lista das features do ponto de vista do usuário, como um site map, para que quem pede a mudança e o agente falem a mesma língua sobre qual parte do app está em jogo.
- **Ferramentas de linha de comando reutilizáveis.** Elas vêm junto com as skills e deixam o agente usar o mesmo driver em todas as execuções, em vez de gastar tokens descobrindo toda vez como operar o app.
- **Técnicas mais pesadas quando vale a pena.** Model checking com TLA+, provas de algoritmo em Lean (usadas para raciocinar sobre comportamentos que podiam causar flicker ou jitter) e testes de UI baseados em propriedades com o Bombadil.

O detalhe interessante é que boa parte dessas técnicas sempre exigiu tempo de engenharia demais para entender e manter. Com agentes ajudando, elas passaram a ser viáveis.

## Não automatize um loop quebrado

O aviso final talvez seja o mais importante: se o seu loop básico de editar e verificar tem problema, rodar mais cópias dele só multiplica os tokens gastos com conserto. Escalar agentes em cima de uma base sem guarda-corpos aumenta o retrabalho, não a produtividade.

A ordem que ela recomenda é:

1. Adicionar uma regra de lint para impedir novas ocorrências do erro.
2. Limpar os exemplos antigos que o agente poderia copiar.
3. Dar ao agente um jeito de verificar o comportamento.
4. Só então escalar.

Depois que o loop funciona, aí sim dá para ir longe. No time dela, cortar uma release inicia automaticamente um projeto no Cursor que roda a build nova e a explora como um usuário faria. Para cada bug encontrado, ele abre um PR com a correção e faz o merge sozinho. O que deixou a Lauren disposta a usar isso foi o trabalho já feito no caminho que cada correção percorre: as mesmas restrições e a mesma verificação que valem para o resto do código.

## O que levar para o seu time

Mesmo que você não esteja nem perto de milhares de PRs por mês, a lógica vale. Da próxima vez que um agente (ou um colega) cometer o mesmo erro pela terceira vez, resista à vontade de escrever mais um parágrafo de instruções. Pergunte se dá para tornar o erro impossível pela API, se dá para pegá-lo com uma regra de lint ou se dá para verificá-lo automaticamente.

No fundo, nada disso é novo. Tipos fortes, lint, testes e boas fronteiras entre módulos sempre foram a forma de manter um código fácil de mudar. A diferença é que, com agentes escrevendo boa parte do código, quem não investe nisso sente o custo muito mais rápido.
