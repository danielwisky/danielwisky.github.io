---
layout: post
title: "Minhas imagens preferidas do Docker"
subtitle: "Algumas de minhas imagens preferidas do Docker e alguns comandos que utilizo com frequência"
tags: [Docker]
---

### Imagens

Algumas das minhas imagens favoritas:

**RabbitMQ**

> **Atualização (2026):** A série 3.x do RabbitMQ não tem mais suporte da comunidade desde setembro de 2024. Para novos ambientes, prefira a tag `rabbitmq:4-management`.

```
docker run -d --name rabbit -e RABBITMQ_DEFAULT_USER=developer -e RABBITMQ_DEFAULT_PASS=developer -e RABBITMQ_DEFAULT_VHOST=localhost -p 15672:15672 -p 5672:5672 rabbitmq:3-management
```

**Kafka**

> **Atualização (2026):** A imagem `spotify/kafka` usada aqui originalmente está abandonada desde 2016 (repositório arquivado). O exemplo abaixo usa a imagem oficial do projeto Apache Kafka, que roda em modo KRaft (sem necessidade de Zookeeper).

```
docker run -d --name kafka -p 9092:9092 apache/kafka:latest
```

**Redis**

```
docker run --name redis -d -p 6379:6379 redis
```

**SonarQube**

```
docker run -d -p 9000:9000 sonarqube:community
```

**MongoDB**

```
docker run -d --name mongodb -p 27017:27017 mongo:7
```

### Comandos

Remover todos os containers do docker:

```
docker rm -f $(docker ps -a -q)
```

Iniciar todos os containers do docker:

```
docker start $(docker ps -a -q)
```

Parar todos os containers do docker:

```
docker stop $(docker ps -a -q)
```

Um grande abraço e até o próximo post!
