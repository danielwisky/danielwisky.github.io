---
layout: post
title: "Redis, uma breve introdução"
subtitle: "Introdução ao Redis, o NoSQL chave-valor mais famoso"
tags: [noSQL, Redis]
---

Muito se tem falado sobre Redis nos últimos anos. Quase sempre seu nome está atrelado a ganho de performance por meio de cacheamento de dados, porém entender suas principais características, indicações e contraindicações é fundamental para termos uma boa história com ele e alcançarmos nossos objetivos. Para tal tarefa, listarei aquelas que considero as principais características da ferramenta:

**1. Seus dados são armazenados in memory**

Essa é a principal característica para o vincularmos a ganho de performance. Armazenar dados em memória torna qualquer ferramenta muito mais rápida se comparado àquelas com persistência em disco.

**2. Todas as operações são atômicas**

O Redis é uma aplicação single-threaded e isso significa que enquanto uma operação é executada, nenhuma outra é executada paralelamente. Isso evita gigantescos problemas de concorrência e, na minha opinião, essa é uma das perfeições do Redis. :)

> **Atualização (2026):** Desde o Redis 6.0 é possível usar threads de I/O (`io-threads`) para ler e escrever nos sockets dos clientes, mas a execução dos comandos continua em uma única thread. Por isso cada comando segue atômico. Já uma sequência de comandos só é executada de forma isolada dentro de uma transação (`MULTI`/`EXEC`) ou de um script Lua.

**3. O Redis só conhece chave-valor**

Sim, é isso mesmo que você leu! Todos os dados armazenados no Redis estão organizados numa estrutura de chave-valor.

![Meme de um gato triste com a legenda "Você me decepcionou, cara"](/assets/img/posts/redis-meme-gato-decepcionado.jpg)

Não, pera. Permita-me explicar melhor: embora todos os dados estejam distribuídos no formato chave/valor, o valor pode ser qualquer coisa que você imaginar… desde uma String simples até conjuntos extremamente complexos. Confie em mim… você vai se surpreender com essa característica.

**4. Redis NÃO é um banco de dados tradicional**

Bem, isso acho que você já notou. Diferente de bancos como Oracle, SQL Server e qualquer outro banco relacional que vier à sua cabeça, o Redis é um banco de dados não relacional (NoSQL).

**5. Ele também não é muito semelhante ao MongoDB**

Você deve estar pensando: "Ah, se ele é um banco NoSQL já estou em casa… deve ser igual ao MongoDB".

![Meme do Quico, do Chaves, com a legenda "Vai com calma, fera, você tá muito ousado!"](/assets/img/posts/redis-meme-chaves-calma.jpg)

Isso, calma! O Redis, como já disse, é baseado em "chave-valor", diferente do MongoDB que é baseado em documentos. Isso já traz uma diferença de paradigma absurda. Embora ambos sejam bancos NoSQL, eles possuem utilidades diferentes, cada um com seus pontos fortes e fracos.

**6. Ele NÃO possui suporte oficial para Windows**

A própria documentação oficial do Redis recomenda WSL2 para rodar o binário de verdade em ambiente Windows, ou o Memurai, um port comercial que é parceiro oficial do Redis para Windows. O antigo port mantido pela Microsoft foi abandonado ainda na versão 3.2 e está obsoleto.

Diferente do Windows, toda a plataforma do Redis pode ser utilizada em ambiente Linux sem nenhuma dificuldade.

> **Atualização (2026):** Desde o Redis 7.4 (março de 2024), o Redis deixou de usar a licença BSD e passou a ser distribuído sob RSALv2/SSPLv1, que não são licenças open source pela definição da OSI. A partir do Redis 8 (maio de 2025), a AGPLv3 foi adicionada como opção de licença.

Esse foi um texto introdutório sobre a ferramenta, em breve postarei novos conteúdos e exemplos de aplicações utilizando Redis, no entanto, caso queira pesquisar mais sobre o assunto, comece com a documentação oficial, presente em https://redis.io/.

Fonte:
<a href="https://medium.com/@prog.tiago/redis-uma-breve-introdu%C3%A7%C3%A3o-9ea19e61b8d9" target="_blank">Medium - Tiago Silva</a>.

Um grande abraço e até o próximo post!
