---
layout: post
title: "Comandos Docker"
subtitle: "Alguns comandos docker e suas utilizades"
cover-img: "/assets/img/default-bg.jpg"
thumbnail-img: "/assets/img/thumbs/post-thumb-docker.png"
categories: [DevOps]
tags: [Docker]
---

## Comandos Docker

Alguns comandos docker e suas utilizades:

- <code>docker attach</code> - acessar dentro do container e trabalhar a partir dele.
- <code>docker build</code> - a partir de instruções de um arquivo dockerfile eu possa criar uma imagem.
- <code>docker commit</code> - cria uma imagem a partir de um container.
- <code>docker cp</code> - copia arquivos ou diretórios do container para o host.
- <code>docker create</code> - cria um novo container.
- <code>docker diff</code> - exibe as alterações feitas no filesystem do container.
- <code>docker events</code> - exibe os eventos do container em tempo real.
- <code>docker exec</code> - executa uma instrução dentro do container que está rodando sem precisar atachar nele.
- <code>docker export</code> - exporta um container para um arquivo .tar.
- <code>docker history</code> - exibe o histórico de comandos que foram executados dentro do container.
- <code>docker images</code> - lista as imagens disponíveis no host.
- <code>docker import</code> - importa uma imagem .tar para o host.
- <code>docker info</code> - exibe as informações sobre o host.
- <code>docker inspect</code> - exibe r o json com todas as configurações do container.
- <code>docker kill</code> - da poweroff no container.
- <code>docker load</code> - carrega a imagem de um arquivo .tar.
- <code>docker login</code> - registra ou faz o login em um servidor de registry.
- <code>docker logout</code> - faz o logout de um servidor de registry.
- <code>docker logs</code> - exibe os logs de um container.
- <code>docker port</code> - abre uma porta do host e do container.
- <code>docker network</code> - gerenciamento das redes do docker.
- <code>docker node</code> - gerenciamento dos nodes do docker swarm.
- <code>docker pause</code> - pausa o container.
- <code>docker port</code> - lista as portas mapeadas de um container.
- <code>docker ps</code> - lista todos os containers.
- <code>docker pull</code> - faz o pull de uma imagem a partir de um servidor de registry.
- <code>docker push</code> - faz o push de uma imagem a partir de um servidor de registry.
- <code>docker rename</code> - renomeia um container existente.
- <code>docker restart</code> - restarta um container que está rodando ou parado.
- <code>docker rm</code> - remove um ou mais containeres.
- <code>docker rmi</code> - remove uma ou mais imagens.
- <code>docker run</code> - executa um comando em um novo container.
- <code>docker save</code> - salva a imagem em um arquivo .tar.
- <code>docker search</code> - procura por uma imagem no docker hub.
- <code>docker service</code> - gernciamento dos serviços do docker.
- <code>docker start</code> - inicia um container que esteja parado.
- <code>docker stats</code> - exibe informações de uso de cpu, memória e rede.
- <code>docker stop</code> - para um container que esteja rodando.
- <code>docker swarm</code> - clusterização das aplicações em uma orquestração de várias containers, aplicações junto.
- <code>docker tag</code> - coloca tag em uma imagem para o repositorio.
- <code>docker top</code> - exibe os processos rodando em um container.
- <code>docker unpause</code> - inicia um container que está em pause.
- <code>docker update</code> - atualiza a configuração de um ou mais containers.
- <code>docker version</code> - exibe as versões de api, client e server do host.
- <code>docker volume</code> - gerenciamento dos volumes no docker.
- <code>docker wait</code> - aguarda o retorno da execução de um container para iniciar esse container.

É possível ver todos os comandos que o Docker possui, tendo o docker instalado, basta digitar no terminal <code>docker –help</code>

Fonte:
<a href="https://gist.github.com/morvanabonin/862a973c330107540f28fab0f26181d8" target="\_blank">Comandos Docker</a>.

Um grande abraço e até o próximo post!
