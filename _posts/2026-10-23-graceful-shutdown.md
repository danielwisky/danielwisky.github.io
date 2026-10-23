---
layout: post
title: "Graceful shutdown: desligar também faz parte do serviço"
subtitle: "Todo deploy derruba pods, e se o seu serviço não sabe sair com calma, cada deploy vira uma rajada de erros"
tags: [Arquitetura, Kubernetes]
---

Um time percebe que, a cada deploy, o dashboard mostra um pequeno pico de erros 502 e 503. Dura uns poucos segundos, some sozinho e ninguém dá muita atenção, porque "deploy é assim mesmo". Até que o serviço passa a ter dez deploys por dia, o pico aparece no SLO, e alguém descobre que parte desses erros eram pagamentos que ficaram pela metade. O problema não estava no código novo. Estava na forma como o código antigo era desligado.

Num ambiente com Kubernetes, pods morrem o tempo todo: deploy, autoscaling reduzindo réplicas, nó sendo drenado para manutenção. Desligar é uma operação tão rotineira quanto subir, e merece o mesmo cuidado.

## O que acontece quando um pod é encerrado

Quando o Kubernetes decide encerrar um pod, várias coisas acontecem quase ao mesmo tempo:

1. O pod é marcado como `Terminating` e começa a ser removido dos endpoints do Service.
2. Se existir um `preStop` hook, ele é executado.
3. O container recebe um `SIGTERM`.
4. O Kubernetes espera até o `terminationGracePeriodSeconds` (30 segundos por padrão). Se o processo ainda estiver vivo, recebe um `SIGKILL`.

O detalhe que pega muita gente é que os passos 1 e 3 não são sequenciais. A remoção dos endpoints precisa se propagar para o kube-proxy, para o ingress e para os balanceadores, e isso leva um tempo. Enquanto isso, o SIGTERM pode já ter chegado. Se a aplicação para de aceitar conexões imediatamente, as requisições que ainda estão sendo roteadas para ela batem numa porta fechada.

## O SIGTERM precisa chegar na JVM

Antes de qualquer outra coisa, vale conferir se o sinal está chegando. Um Dockerfile com `CMD` em formato shell executa a aplicação através de `/bin/sh -c`, e o shell vira o processo principal do container. Muitos shells não repassam o SIGTERM para o processo filho, então a JVM nunca fica sabendo que deveria desligar e morre com SIGKILL depois de 30 segundos.

```dockerfile
# o shell recebe o SIGTERM, a JVM não
CMD java -jar app.jar

# a JVM é o processo principal e recebe o sinal
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Se o pod sempre leva exatamente o grace period inteiro para morrer, essa é a primeira suspeita.

## O sleep que parece gambiarra

A forma mais comum de resolver a corrida com os endpoints é um `preStop` que simplesmente espera alguns segundos antes do SIGTERM ser enviado:

```yaml
spec:
  terminationGracePeriodSeconds: 45
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["sleep", "10"]
```

Durante esses dez segundos, a aplicação continua atendendo normalmente enquanto o resto da infraestrutura para de mandar tráfego para ela. Parece gambiarra, mas é a solução recomendada na prática. Duas observações: o tempo do `preStop` conta dentro do `terminationGracePeriodSeconds`, então o total precisa caber ali, e o `exec` depende de existir um binário `sleep` na imagem, o que não é verdade em imagens distroless. Para esse caso existe a ação `sleep` nativa no `preStop`, habilitada por padrão desde o Kubernetes 1.30 e estável desde a 1.34, que é executada pelo próprio kubelet:

```yaml
lifecycle:
  preStop:
    sleep:
      seconds: 10
```

## O que a aplicação faz ao receber o sinal

Depois do SIGTERM, a aplicação deveria seguir uma ordem:

- Parar de aceitar requisições e conexões novas.
- Terminar as requisições que já estão em andamento, dentro de um prazo.
- Parar de consumir mensagens de filas e confirmar o que já foi processado.
- Fechar conexões com banco, cache e outros recursos.
- Sair.

No Spring Boot, a primeira parte vem quase pronta. Com o shutdown gracioso ligado, o servidor web para de aceitar requisições novas e espera as que estão em andamento terminarem, até um limite por fase. Nas versões mais recentes isso já é o padrão, mas vale deixar explícito:

```properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=20s
```

O Spring também muda o estado de readiness para `REFUSING_TRAFFIC` assim que o shutdown começa. Só que, como o servidor HTTP para de aceitar requisições novas nesse momento, as [probes de readiness](/2026-10-22-health-checks-liveness-readiness-startup/) também deixam de ser respondidas, e a plataforma não tem como ler esse estado a tempo. Por isso o `preStop` continua necessário: é ele que cobre a janela em que o tráfego ainda está chegando. A conta de tempo precisa fechar: `preStop` de 10 segundos mais até 20 segundos de shutdown da aplicação cabe com folga num grace period de 45.

## Consumidores de fila são o caso mais delicado

Requisições HTTP têm um fim claro. Um consumidor de Kafka ou de uma fila qualquer está sempre no meio de alguma coisa. Se o processo morre depois de processar uma mensagem e antes de confirmar o offset, a mensagem vai ser entregue de novo para outro consumidor.

No Kafka, a forma segura de interromper um loop de consumo é chamar `wakeup()` a partir de outra thread, tratar a `WakeupException` no loop e fechar o consumer no final:

```java
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    consumer.wakeup();
    try {
        consumerThread.join(15_000);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}));

try {
    while (true) {
        ConsumerRecords<String, Pedido> records = consumer.poll(Duration.ofMillis(500));
        records.forEach(this::processar);
        consumer.commitSync();
    }
} catch (WakeupException e) {
    // esperado no shutdown
} finally {
    consumer.close();
}
```

Na configuração padrão, o `close()` também avisa o grupo de consumidores que este membro está saindo, o que faz o rebalanceamento acontecer na hora em vez de esperar o timeout de sessão. Mesmo assim, nenhum shutdown é perfeito: um `SIGKILL`, uma falha de hardware ou um OOM pulam tudo isso. Por isso o processamento precisa ser [idempotente](/2026-09-29-idempotencia-em-apis/). O graceful shutdown reduz quantas mensagens são reprocessadas, mas não elimina o reprocessamento.

## Trabalho em background e shutdown hooks

Executores próprios, jobs agendados e tarefas assíncronas também precisam ser encerrados. Um `ExecutorService` criado à mão não para sozinho: chame `shutdown()`, espere com `awaitTermination` por um tempo limitado e, se não terminar, use `shutdownNow()`. Shutdown hooks da JVM rodam em paralelo e sem ordem garantida, então prefira deixar o framework coordenar a ordem de encerramento em vez de registrar vários hooks independentes.

## Testando de verdade

O jeito mais simples de saber se o shutdown funciona é provocar. Rode um teste de carga contra o serviço e, no meio dele, faça um `kubectl rollout restart` no deployment. Se aparecerem erros, alguma etapa está faltando. Também vale olhar quanto tempo os pods levam para terminar: se todos levam o grace period inteiro, o sinal não está chegando ou alguma coisa está travando a saída.

Graceful shutdown não tem nada de sofisticado. São alguns segundos de espera, uma propriedade de configuração, um loop de consumo bem escrito e um Dockerfile que repassa sinais. Mas é o que separa um deploy invisível de um deploy que todo mundo aprende a temer.
