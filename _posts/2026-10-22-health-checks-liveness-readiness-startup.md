---
layout: post
title: "Health checks: liveness, readiness e startup sem derrubar o cluster"
subtitle: "Cada probe responde a uma pergunta diferente, e misturar as perguntas é a forma mais rápida de transformar um banco lento num apagão"
tags: [Arquitetura, Kubernetes]
---

O banco de dados de um serviço começa a responder devagar. Nada grave, só um pico de carga que deixa as consultas em dois segundos. O health check do serviço, configurado como liveness probe no Kubernetes, faz um `SELECT 1` para garantir que "a aplicação está saudável". Com timeout de um segundo, o check começa a falhar. Depois de três falhas seguidas, o Kubernetes reinicia o container. Acontece o mesmo em todos os pods ao mesmo tempo, porque todos dependem do mesmo banco. Os pods sobem de novo, abrem conexões novas todos juntos, o banco fica ainda mais pressionado, e o ciclo se repete. Um banco lento virou um serviço completamente fora do ar, e quem fez isso foi o mecanismo que deveria proteger contra falhas.

## Três perguntas diferentes

O Kubernetes tem três tipos de probe, e cada um responde a uma pergunta específica:

- **Liveness**: "este processo está travado e só reiniciando resolve?" Se falhar, o kubelet mata o container e sobe outro.
- **Readiness**: "este pod consegue atender tráfego agora?" Se falhar, o pod sai da lista de endpoints do Service e para de receber requisições, mas continua rodando.
- **Startup**: "a aplicação já terminou de subir?" Enquanto ela não passa, as outras duas probes ficam desligadas.

A diferença entre liveness e readiness é o que importa aqui. Liveness tem uma consequência drástica, que é reiniciar. Readiness tem uma consequência leve e reversível, que é tirar o pod do balanceamento até ele melhorar. Usar a pergunta de uma com a consequência da outra é a origem da maioria dos problemas.

## Liveness deveria ser quase burra

A liveness probe só deveria falhar quando reiniciar o processo de fato resolve o problema. Isso acontece em situações como um deadlock, um event loop travado ou uma aplicação num estado interno corrompido do qual não sabe sair. Banco lento, fila fora do ar ou uma API de terceiros com erro não se encaixam aqui: reiniciar o seu serviço não conserta nada disso, e ainda tira capacidade justamente quando você mais precisa dela.

Na prática, uma boa liveness verifica só se o processo consegue responder a uma requisição HTTP simples. Se o servidor web responde, o processo não está travado. Não precisa consultar banco, cache nem nenhuma outra dependência.

## Readiness é onde mora a nuance

A readiness pode, sim, olhar para dependências, mas com cuidado. Faz sentido o pod se declarar indisponível enquanto aquece um cache local, enquanto ainda não conectou no banco depois de subir, ou quando está sobrecarregado e quer parar de receber tráfego novo por um tempo.

O cuidado é com dependências compartilhadas. Se todos os pods checam o mesmo banco na readiness e o banco cai, todos ficam não prontos ao mesmo tempo. O Service fica sem nenhum endpoint, e o cliente recebe um erro de conexão genérico em vez de uma resposta que o seu código poderia tratar, como um 503 com uma mensagem clara ou um [fallback](/2026-10-09-circuit-breaker/) com dados em cache. Readiness resolve bem o problema de "este pod específico está mal". Para "uma dependência de todo mundo está mal", quem tem que lidar com isso é o código, com timeout, circuit breaker e degradação controlada.

## Startup para aplicações que demoram

Aplicações Java com muita coisa para inicializar podem levar dezenas de segundos para subir. Antes da startup probe, a saída era colocar um `initialDelaySeconds` alto na liveness, o que atrasava também a detecção de travamentos depois que a aplicação já estava no ar. A startup probe separa as duas fases: ela dá uma janela generosa para a subida e, depois que passa uma vez, sai de cena e deixa a liveness trabalhar com limites curtos.

```yaml
startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 5
  failureThreshold: 24
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  failureThreshold: 2
```

Com essa configuração, a aplicação tem até dois minutos (24 tentativas de 5 segundos) para subir. Depois disso, a liveness só reinicia o container se ele ficar 30 segundos sem responder.

## No Spring Boot

O Actuator já separa os dois estados e expõe `/actuator/health/liveness` e `/actuator/health/readiness` como grupos de health. Por padrão, cada grupo só olha o estado interno da aplicação, e a própria documentação do Spring Boot avisa que a liveness não deve depender de sistemas externos, justamente pelo risco de reinício em cascata. O que cada grupo verifica é configurável:

```properties
management.endpoint.health.group.liveness.include=livenessState
management.endpoint.health.group.readiness.include=readinessState,redis
```

Aqui a liveness olha apenas o estado interno da aplicação, e a readiness inclui uma dependência sem a qual este pod realmente não consegue fazer nada útil. A aplicação também pode mudar o próprio estado de readiness em tempo de execução, publicando um `AvailabilityChangeEvent` com `ReadinessState.REFUSING_TRAFFIC`, o que é útil para tirar o pod do balanceamento durante uma tarefa pesada.

## Os detalhes que derrubam

Mesmo com as perguntas certas, algumas configurações causam problemas:

- **Timeout padrão de um segundo**: o `timeoutSeconds` padrão das probes é 1. Uma pausa longa do garbage collector pode estourar isso. Ajuste com base na latência real do endpoint.
- **Endpoint de health caro**: se o check faz consultas pesadas e roda a cada poucos segundos em cada pod, ele vira carga relevante. O check precisa ser barato.
- **Health check atrás de autenticação**: o kubelet chama sem credenciais, recebe 401 e conclui que o pod está morto.
- **Mesmo endpoint para tudo**: usar `/health` igual para liveness e readiness quase sempre significa que a liveness está checando dependências.

## Probes são parte do desenho de resiliência

É fácil tratar health check como um detalhe do YAML que alguém copia de outro serviço. Mas ele decide quando o seu serviço é reiniciado e quando para de receber tráfego, e essas são duas das decisões mais impactantes que a infraestrutura toma sobre a aplicação. Mantenha a liveness simples e restrita ao processo, use a readiness para problemas daquele pod específico, dê à startup o tempo que a aplicação realmente precisa e deixe as falhas de dependências compartilhadas para o código tratar, junto com [timeouts](/2026-10-16-timeouts-e-propagacao-de-deadline/) e circuit breakers.
