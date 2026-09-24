---
layout: post
title: "Minhas imagens preferidas do Docker"
subtitle: "Algumas de minhas imagens preferidas do Docker e alguns comandos que utilizo com frequência"
tags: [Docker]
---

### Imagens

Algumas das minhas imagens favoritas:

**RabbitMQ**

```
docker run -d --name rabbit -e RABBITMQ_DEFAULT_USER=developer -e RABBITMQ_DEFAULT_PASS=developer -e RABBITMQ_DEFAULT_VHOST=localhost -p 15672:15672 -p 5672:5672 rabbitmq:3-management
```

**Kafka**

> A imagem `spotify/kafka` usada aqui originalmente está abandonada desde 2015. O exemplo abaixo usa a imagem oficial do projeto Apache Kafka, que roda em modo KRaft (sem necessidade de Zookeeper).

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
docker run -d --name mongodb -p 27017:27017 -d mongo:7
```

### Comandos

Remover todas as imagens do docker:

```
docker rm -f $(docker ps -a -q)
```

Iniciar todas as imagens do docker:

```
docker start $(docker ps -a -q)
```

Parar todas as imagens do docker:

```
docker stop $(docker ps -a -q)
```

Um grande abraço e até o próximo post!
