---
layout: post
title: Minhas imagens preferidas de Docker
subtitle: Algumas de minhas imagens preferidas de Docker e alguns comandos que utilizo com frequência
cover-img: /assets/img/default-bg.jpg
tags: [docker]
---

### Imagens

Algumas das minhas imagens favoritas:

**RabbitMQ**

```
docker run -d --name rabbit -e RABBITMQ_DEFAULT_USER=developer -e RABBITMQ_DEFAULT_PASS=developer -e RABBITMQ_DEFAULT_VHOST=localhost -p 15672:15672 -p 15673:15673 -p 5672:5672 -p 5673:5673 rabbitmq:3.6.0-management
```

**Kafka**

```
docker run -d --name kafka -p 2181:2181 -p 9092:9092 --env ADVERTISED_HOST=localhost --env ADVERTISED_PORT=9092 spotify/kafka
```

**Redis**

```
docker run --name redis -d -p 6379:6379 redis
```

**SonarQube**

```
docker run -d -p 9000:9000 sonarqube:8.3.1-community
```

**MongoDB**

```
docker run -d --name mongodb -p 27017:27017 -d mongo:3.4.2
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
