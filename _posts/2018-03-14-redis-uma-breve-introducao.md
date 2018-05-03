---
layout: post
section-type: post
title: Redis, uma breve introdução
subtitle: "Introdução ao Redis, o NoSQL chave-valor mais famoso"
author: "Daniel Wisky"
header-img: "img/default-bg.jpg"
---

Muito se tem falado sobre Redis nos últimos anos. Quase sempre seu nome está atrelado à ganho de performance por meio de cacheamento de dados, porém entender suas principais características, indicações e contra-indicações é fundamental para termos uma boa história com ele e alcançarmos nossos objetivos. Para tal tarefa, listarei aquelas que considero as principais características da ferramenta:

**1. Seus dados são armazenados in memory**

Essa é a principal característica para o vincularmos à ganho de performance. Armazenar dados em memória torna qualquer ferramenta muito mais rápida se comparado àquelas com persistência em disco.

**2. Todas as operações são atômicas**

O Redis é uma aplicação single-threaded e isso significa que enquanto uma operação é executada, nenhuma outra é executada paralelamente. Isso evita gigantescos problemas de concorrência e, na minha opinião, essa é uma das perfeições do Redis. :)

**3. O Redis só conhece chave-valor**

Sim, é isso mesmo que você leu! Todos os dados armazenados no Redis estão organizados numa estrutura de chave valor.

<img class="img-responsive center-block" src="https://cdn-images-1.medium.com/max/800/0*BtQKeVoZdwPTtdIF.jpg" />

Não, pera. Permita-me explicar melhor: Embora todos os dados estejam distribuídos no formato chave/valor, o valor pode ser qualquer coisa que você imaginar… desde uma String simples até conjuntos extremamente complexos. Confie em mim… você vai se surpreender com essa característica.

**4. Redis NÃO é um banco de dados tradicional**

Bem, isso acho que você já notou. Diferente de bancos com Oracle, Sql Server e qualquer outro banco relacional que vier à sua cabeça, o Redis é um banco de dados não relacional (NoSql).

**5. Ele também não é muito semelhante ao MongoDB**

Você deve estar pensando: “Ah, se ele é um banco NoSql já estou em casa… deve ser igual ao MongoDB”.

<img class="img-responsive center-block" src="https://cdn-images-1.medium.com/max/800/1*KSqpqaqxkZImuW3CiHyACQ.jpeg" />

Isso, calma! O Redis, como já disse, é baseado em “chave-valor”, diferente do MongoDB que é baseado em documentos. Isso já traz uma diferença de paradigma absurda. Embora ambos sejam bancos NoSql, eles possuem utilidades diferentes, cada um com seus pontos fortes e fracos.

**6. Ele NÃO possui suporte oficial para Windows**

Até há alguns projetos para utilização no ambiente do Tio Gates, mas nada oficial. Assim, utilize Redis em ambiente Windows apenas se seu foco for testes.

Diferente do Windows, toda a plataforma do Redis pode ser utilizada em ambiente Linux sem nenhuma dificuldade.

Esse foi um texto introdutório sobre a ferramenta, em breve postarei novos conteúdos e exemplos de aplicações utilizando Redis, no entanto, caso queira pesquisar mais sobre o assunto, comece com a documentação oficial, presente em http://redis.io/.

Fonte:
<a href="https://medium.com/@prog.tiago/redis-uma-breve-introdu%C3%A7%C3%A3o-9ea19e61b8d9" target="\_blank">Medium - Tiago Silva</a>.

Um grande abraço e até o próximo post!
