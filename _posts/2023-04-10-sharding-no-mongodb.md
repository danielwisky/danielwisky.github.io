---
layout: post
title: "Sharding no MongoDB: uma forma eficiente de armazenar dados"
subtitle: "Entenda como o sharding pode ajudar a melhorar o desempenho do seu banco de dados"
tags: [MongoDB, noSQL, Sharding]
---

# Olá! Vamos falar sobre shards no MongoDB!

Imagine que você tem uma caixa cheia de brinquedos. Quando você quer brincar com um brinquedo específico, é fácil encontrá-lo, porque todos os brinquedos estão em uma única caixa. Mas, e se você tivesse muitos, muitos brinquedos e apenas uma caixa não fosse suficiente para guardá-los todos? Seria difícil encontrar um brinquedo específico naquela bagunça, não é mesmo?

Da mesma forma, quando você está trabalhando com muitos dados em um banco de dados MongoDB, pode ser difícil encontrar o que você precisa se tudo estiver armazenado em um só lugar. É aí que os shards entram em cena.

Shards são como caixas adicionais para armazenar seus dados. Cada shard é um conjunto separado de servidores (um replica set) que armazena um pedaço dos seus dados. Quando você adiciona um shard, você está basicamente dividindo seus dados em pedaços menores e armazenando-os em servidores diferentes.

Por exemplo, se você tem um banco de dados com informações sobre pessoas de todo o mundo, pode ser uma boa ideia dividir os dados por região geográfica. Você poderia ter um shard para dados da América do Norte, outro para dados da América do Sul, outro para dados da Europa e assim por diante.

Dessa forma, quando você precisar procurar por informações sobre pessoas na América do Sul, você só precisa olhar no shard correspondente, em vez de vasculhar todo o banco de dados. Isso torna as consultas mais rápidas e eficientes.

Mas como o MongoDB sabe qual shard contém os dados que você precisa? É aí que entra outro conceito importante: a shard key. A shard key é a chave que o MongoDB usa para determinar em qual shard um determinado pedaço de dados deve ser armazenado.

No nosso exemplo das informações sobre pessoas, a shard key poderia ser o país de origem. O MongoDB olharia para o país de origem de cada registro e usaria isso para determinar em qual shard o registro deve ser armazenado.

> **Atualização (2026):** na prática, um campo de baixa cardinalidade como o país não é uma boa shard key sozinho: cada valor da chave fica em no máximo um chunk, então a quantidade de valores distintos limita quantos shards são úteis. A documentação recomenda chaves de alta cardinalidade ou compostas (por exemplo, país + id do usuário), e a separação por região é feita com zones. Quem roteia as consultas é o `mongos`, usando os metadados guardados nos config servers. Desde o MongoDB 5.0 também é possível trocar a shard key de uma coleção (resharding).

Então, resumindo: shards são como caixas adicionais para armazenar seus dados e dividir suas informações em pedaços menores. A shard key é a chave usada pelo MongoDB para determinar em qual shard um determinado pedaço de dados deve ser armazenado. E isso torna as consultas mais rápidas e eficientes!

Um grande abraço e até o próximo post!
