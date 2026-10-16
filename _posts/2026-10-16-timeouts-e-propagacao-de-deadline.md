---
layout: post
title: "Timeouts e propagação de deadline: o padrão que todo mundo esquece"
subtitle: "Retry e circuit breaker não servem de nada se a chamada pode esperar para sempre"
tags: [Arquitetura, APIs]
---

Um serviço de pagamentos começa a responder devagar. Não cai, não devolve erro, só demora. Uma chamada que levava 80ms passa a levar 40 segundos. O serviço de pedidos, que chama o de pagamentos, não tem timeout configurado, então cada requisição fica parada esperando. Em poucos minutos todas as threads do pool estão presas nessas chamadas, o serviço de pedidos para de atender qualquer coisa, inclusive o que não tem nada a ver com pagamento, e o problema sobe a cadeia até o usuário ver uma tela girando.

Ninguém errou nada de muito sofisticado aqui. Faltou só um número na configuração. E é justamente por parecer detalhe que o timeout costuma ser o padrão de resiliência mais negligenciado, mesmo sendo a base de quase todos os outros.

## Uma dependência lenta é pior que uma dependência fora do ar

Quando uma dependência cai de vez, a conexão é recusada na hora, o erro aparece rápido e o sistema reage: o circuit breaker abre, o fallback entra, o alerta dispara. Quando ela fica lenta, nada disso acontece. Do ponto de vista de quem chama, a requisição ainda está "em andamento", e enquanto isso ela segura uma thread, uma conexão do pool e memória.

O timeout é o que transforma lentidão em falha. Sem ele, o circuit breaker não tem erros para contar, o retry nunca dispara porque a primeira tentativa não terminou, e o bulkhead só limita quantas threads vão ficar presas, sem soltar nenhuma.

## Os timeouts não são um só

Quando se fala em "timeout de uma chamada HTTP", existem pelo menos três coisas diferentes:

- **Timeout de conexão**: quanto tempo esperar para estabelecer a conexão TCP (e o handshake TLS). Deve ser curto, porque se o host nem aceita conexão, esperar mais raramente ajuda.
- **Timeout de leitura**: quanto tempo esperar entre pacotes de dados depois de conectado. Uma resposta que chega aos pouquinhos pode nunca estourar esse limite e ainda assim demorar minutos.
- **Timeout total da requisição**: o teto para a operação inteira, do início ao fim. É o que realmente protege quem chama.

No `HttpClient` do Java, o timeout de conexão fica no client e o timeout da resposta fica em cada requisição:

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofMillis(500))
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://pagamentos.internal/cobrancas/123"))
    .timeout(Duration.ofSeconds(2))
    .build();
```

Muita biblioteca vem com timeout infinito ou muito alto por padrão. Vale conferir explicitamente o cliente HTTP, o driver do banco, o pool de conexões e o client da fila, em vez de assumir que alguém já pensou nisso.

## Como escolher o número

O erro mais comum é colocar 30 segundos porque "parece seguro". Um timeout bom vem da latência real da dependência. Se o p99 de uma chamada fica em 150ms, um timeout de 500ms ou 1 segundo já dá folga de sobra para variações normais e corta rápido quando algo está claramente errado. Trinta segundos, nesse caso, é só uma forma lenta de não ter timeout.

O outro lado da conta é o orçamento de quem chama. Se o seu serviço precisa responder em 2 segundos, não faz sentido esperar 5 segundos por uma dependência. E se você tem retry, a soma de todas as tentativas mais as esperas do backoff precisa caber nesse mesmo orçamento.

## O problema dos timeouts independentes

Imagine uma cadeia: o gateway chama o BFF com timeout de 3 segundos, o BFF chama o serviço de pedidos com timeout de 3 segundos, que chama o de estoque com timeout de 3 segundos. Parece consistente, mas não é.

Se o serviço de pedidos gastou 2,5 segundos antes de chamar o estoque, ele ainda vai esperar até 3 segundos por essa chamada. Só que o gateway desiste aos 3 segundos do início. Por até 2,5 segundos, estoque e pedidos continuam trabalhando numa resposta que ninguém mais vai ler, consumindo recursos justamente no momento em que o sistema já está sob pressão.

## Propagação de deadline

A solução é parar de pensar em timeout por chamada e passar a pensar em prazo da requisição inteira. Quem recebe a requisição original define um deadline absoluto ("isso precisa estar pronto até tal instante") e esse deadline viaja junto com a requisição. Cada serviço calcula quanto tempo ainda resta e usa isso como timeout das próprias chamadas. Se o tempo já acabou, nem tenta.

O gRPC faz isso nativamente: o deadline definido pelo cliente vai no header `grpc-timeout`, já descontando o tempo que passou, e em implementações como as de Java e Go ele é repassado automaticamente para as chamadas seguintes. Em HTTP não existe um padrão único, mas dá para fazer o mesmo com um header próprio:

```java
public class Deadline {
    private final Instant expiraEm;

    public Deadline(Instant expiraEm) {
        this.expiraEm = expiraEm;
    }

    public static Deadline doHeader(String valor, Duration padrao) {
        return valor != null
            ? new Deadline(Instant.ofEpochMilli(Long.parseLong(valor)))
            : new Deadline(Instant.now().plus(padrao));
    }

    public Duration restante() {
        Duration restante = Duration.between(Instant.now(), expiraEm);
        if (restante.isNegative() || restante.isZero()) {
            throw new DeadlineExpiradoException();
        }
        return restante;
    }

    public String paraHeader() {
        return String.valueOf(expiraEm.toEpochMilli());
    }
}
```

E na hora de chamar a próxima dependência:

```java
Duration restante = deadline.restante();
Duration timeout = restante.compareTo(Duration.ofSeconds(1)) < 0
    ? restante
    : Duration.ofSeconds(1);

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://estoque.internal/itens/42"))
    .header("X-Request-Deadline", deadline.paraHeader())
    .timeout(timeout)
    .build();
```

Repare que o timeout é o menor dos dois valores: o deadline diz quanto tempo resta no total, mas cada dependência continua tendo seu próprio teto razoável. Um detalhe prático é que deadline absoluto depende dos relógios das máquinas estarem razoavelmente sincronizados. Se isso preocupa, a alternativa é propagar o tempo restante em milissegundos (como o gRPC faz) e cada serviço recalcular a partir do momento em que recebeu a requisição.

## Timeout no código assíncrono

Em código com `CompletableFuture`, o `orTimeout` resolve o caso simples, e o `completeOnTimeout` permite devolver um valor padrão em vez de falhar:

```java
CompletableFuture<Recomendacoes> recomendacoes = buscarRecomendacoes(clienteId)
    .completeOnTimeout(Recomendacoes.vazias(), 300, TimeUnit.MILLISECONDS);
```

Para uma parte não essencial da tela, como recomendações, isso é muitas vezes melhor do que falhar a página inteira. Só vale lembrar que o timeout do future não cancela automaticamente o trabalho que está rodando por baixo: a chamada HTTP pode continuar até o timeout do próprio cliente. Por isso o timeout precisa existir também no nível mais baixo, não só no future.

## O padrão que sustenta os outros

Timeout não é o padrão mais elegante nem o mais interessante de discutir numa revisão de arquitetura. Mas sem ele, retry, circuit breaker e bulkhead ficam esperando um sinal que nunca chega. Defina timeouts explícitos em toda chamada que sai do processo, baseie os valores em latência medida e não em chute, e, quando a cadeia de serviços crescer, passe a propagar o prazo em vez de deixar cada serviço decidir sozinho quanto tempo vale a pena esperar.
