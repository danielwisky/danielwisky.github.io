---
layout: post
title: "Comandos Docker"
subtitle: "Alguns comandos docker e suas utilidades"
tags: [Docker]
---

## Comandos Docker

Alguns comandos docker e suas utilidades:

- <code>docker attach</code> - acessar dentro do container e trabalhar a partir dele.
- <code>docker build</code> - cria uma imagem a partir das instruções de um arquivo Dockerfile.
- <code>docker commit</code> - cria uma imagem a partir de um container.
- <code>docker cp</code> - copia arquivos ou diretórios entre o container e o host (nos dois sentidos).
- <code>docker create</code> - cria um novo container.
- <code>docker diff</code> - exibe as alterações feitas no filesystem do container.
- <code>docker events</code> - exibe os eventos do servidor (containers, imagens, redes, volumes etc.) em tempo real.
- <code>docker exec</code> - executa uma instrução dentro do container que está rodando sem precisar atachar nele.
- <code>docker export</code> - exporta um container para um arquivo .tar.
- <code>docker history</code> - exibe o histórico de criação de uma imagem, com as camadas, tamanho e instrução do Dockerfile que gerou cada uma.
- <code>docker images</code> - lista as imagens disponíveis no host.
- <code>docker import</code> - importa o conteúdo de um arquivo .tar para criar uma imagem.
- <code>docker info</code> - exibe as informações sobre o host.
- <code>docker inspect</code> - exibe o json com todas as configurações do container (ou de outros objetos, como imagens, redes e volumes).
- <code>docker kill</code> - para o container imediatamente, enviando SIGKILL, sem a tentativa de parada graciosa que o <code>docker stop</code> faz.
- <code>docker load</code> - carrega a imagem de um arquivo .tar.
- <code>docker login</code> - faz o login em um servidor de registry.
- <code>docker logout</code> - faz o logout de um servidor de registry.
- <code>docker logs</code> - exibe os logs de um container.
- <code>docker network</code> - gerenciamento das redes do docker.
- <code>docker node</code> - gerenciamento dos nodes do docker swarm.
- <code>docker pause</code> - pausa o container.
- <code>docker port</code> - lista as portas mapeadas de um container.
- <code>docker ps</code> - lista os containers em execução (com <code>-a</code>, lista todos).
- <code>docker pull</code> - faz o pull de uma imagem a partir de um servidor de registry.
- <code>docker push</code> - faz o push de uma imagem para um servidor de registry.
- <code>docker rename</code> - renomeia um container existente.
- <code>docker restart</code> - restarta um container que está rodando ou parado.
- <code>docker rm</code> - remove um ou mais containers.
- <code>docker rmi</code> - remove uma ou mais imagens.
- <code>docker run</code> - executa um comando em um novo container.
- <code>docker save</code> - salva a imagem em um arquivo .tar.
- <code>docker search</code> - procura por uma imagem no docker hub.
- <code>docker service</code> - gerenciamento dos serviços do docker swarm.
- <code>docker start</code> - inicia um container que esteja parado.
- <code>docker stats</code> - exibe informações de uso de cpu, memória e rede.
- <code>docker stop</code> - para um container que esteja rodando.
- <code>docker swarm</code> - clusterização das aplicações em uma orquestração de vários containers, aplicações junto.
- <code>docker tag</code> - coloca tag em uma imagem para o repositório.
- <code>docker top</code> - exibe os processos rodando em um container.
- <code>docker unpause</code> - retoma um container que está pausado.
- <code>docker update</code> - atualiza a configuração de um ou mais containers.
- <code>docker version</code> - exibe as versões de api, client e server do host.
- <code>docker volume</code> - gerenciamento dos volumes no docker.
- <code>docker wait</code> - aguarda um ou mais containers pararem e retorna o código de saída (exit code) de cada um.

É possível ver todos os comandos que o Docker possui, tendo o docker instalado, basta digitar no terminal <code>docker --help</code>

Fonte:
<a href="https://gist.github.com/morvanabonin/862a973c330107540f28fab0f26181d8" target="_blank">Comandos Docker</a>.

Um grande abraço e até o próximo post!
