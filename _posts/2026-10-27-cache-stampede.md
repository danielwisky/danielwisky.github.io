---
layout: post
title: "Cache stampede: quando o cache expira e derruba o banco"
subtitle: "Por que um TTL bem-intencionado pode virar uma avalanche de queries, e como evitar"
tags: [Arquitetura, Redis]
---

A página inicial de um e-commerce mostra os produtos mais vendidos da semana. Calcular essa lista exige uma query pesada, que junta pedidos, itens e estoque, e leva uns dois segundos. Ninguém quer rodar isso a cada acesso, então o resultado vai para o Redis com TTL de cinco minutos. Funciona muito bem, até o instante em que a chave expira. Nesse segundo, oitocentas requisições chegam, todas dão *miss*, e todas decidem fazer a coisa certa: buscar no banco e repopular o cache. O banco recebe oitocentas cópias da mesma query pesada ao mesmo tempo, a latência dispara, as conexões do pool acabam, e outras partes do sistema que não têm nada a ver com a página inicial começam a falhar junto.

Esse efeito tem nome: cache stampede, às vezes chamado de *dogpile*. É mais um caso em que cada parte do sistema se comporta exatamente como foi programada, e o problema aparece só na soma.

## Por que ele é traiçoeiro

O cache costuma entrar no sistema justamente para proteger o banco, e com o tempo o banco passa a ser dimensionado contando com essa proteção. Se o cache resolve 99% das leituras, o banco só precisa aguentar 1%. O stampede é o momento em que essa conta deixa de valer, mesmo que por poucos segundos.

Ele também é difícil de diagnosticar. Os picos acontecem em ciclos, a cada vencimento do TTL, e duram pouco. Olhando o dashboard de longe, parece ruído. E existe a versão mais grave do problema: o cache frio. Depois de um restart do Redis, de um flush acidental ou de um deploy que muda o formato das chaves, não é uma chave que expira, são todas ao mesmo tempo.

## Jitter no TTL

A primeira medida é a mais barata. Se muitas chaves são gravadas juntas com o mesmo TTL, elas também expiram juntas. Adicionar uma variação aleatória espalha esses vencimentos ao longo do tempo, a mesma ideia do jitter no [retry com backoff](/2026-10-13-retry-backoff-e-jitter/).

```java
Duration ttlBase = Duration.ofMinutes(5);
long variacao = ThreadLocalRandom.current().nextLong(0, 60);
redis.opsForValue().set(chave, valor, ttlBase.plusSeconds(variacao));
```

Isso resolve o caso de muitas chaves sincronizadas, mas não ajuda em nada quando o problema é uma única chave muito acessada. Para essa, é preciso controlar quem recalcula.

## Só uma requisição recalcula

A ideia central da maioria das soluções é a mesma: quando a chave expira, uma requisição vai ao banco e as outras esperam o resultado dela em vez de fazerem a mesma consulta. Dentro de uma única instância, isso é bem simples de implementar com um mapa de cálculos em andamento:

```java
private final ConcurrentHashMap<String, CompletableFuture<Produtos>> emAndamento = new ConcurrentHashMap<>();

public CompletableFuture<Produtos> buscar(String chave) {
    Produtos emCache = cache.get(chave);
    if (emCache != null) {
        return CompletableFuture.completedFuture(emCache);
    }
    CompletableFuture<Produtos> novo = new CompletableFuture<>();
    CompletableFuture<Produtos> existente = emAndamento.putIfAbsent(chave, novo);
    if (existente != null) {
        return existente;
    }
    CompletableFuture.supplyAsync(() -> carregarDoBanco(chave))
        .whenComplete((valor, erro) -> {
            if (erro == null) {
                cache.put(chave, valor);
                novo.complete(valor);
            } else {
                novo.completeExceptionally(erro);
            }
            emAndamento.remove(chave, novo);
        });
    return novo;
}
```

Na prática, nem precisa escrever isso na mão. O Caffeine já garante que um carregamento por chave acontece uma vez só, e o Spring oferece `@Cacheable(sync = true)` com o mesmo objetivo. A limitação é que isso vale por instância: com trinta pods, ainda são até trinta consultas simultâneas. Bem melhor do que oitocentas, e muitas vezes já é suficiente.

## Lock distribuído para recalcular

Quando nem trinta consultas são aceitáveis, dá para coordenar entre instâncias usando o próprio Redis. Quem dá *miss* tenta adquirir um lock com `SET NX`. Quem consegue recalcula, e quem não consegue espera um pouco e lê o cache de novo.

```java
Boolean adquiriu = redis.opsForValue()
    .setIfAbsent("lock:" + chave, instanciaId, Duration.ofSeconds(10));

if (Boolean.TRUE.equals(adquiriu)) {
    Produtos valor = carregarDoBanco(chave);
    redis.opsForValue().set(chave, valor, ttlComJitter());
    return valor;
}
return aguardarCache(chave);
```

Esse caminho funciona, mas cobra o preço de qualquer lock distribuído. O lock precisa de expiração, senão uma instância que morre no meio do cálculo trava a chave para sempre. A expiração precisa ser maior do que o tempo do cálculo, senão duas instâncias recalculam ao mesmo tempo. E quem fica esperando precisa de um limite, senão um banco lento transforma a espera em fila de threads presas. É o tipo de solução que vale a pena só quando a consulta é cara de verdade.

## Entregar o valor velho enquanto atualiza

Muitas vezes o jeito mais simples de evitar a espera é não deixar o valor sumir. Com *stale-while-revalidate*, o cache guarda o valor por mais tempo do que ele é considerado fresco. Quando ele passa do prazo, a próxima leitura recebe o valor antigo na hora, e uma atualização roda em segundo plano.

No Caffeine, isso é o `refreshAfterWrite`:

```java
LoadingCache<String, Produtos> cache = Caffeine.newBuilder()
    .refreshAfterWrite(Duration.ofMinutes(5))
    .expireAfterWrite(Duration.ofMinutes(30))
    .build(this::carregarDoBanco);
```

Depois de cinco minutos, o próximo acesso dispara um recarregamento assíncrono e continua recebendo o valor que já estava lá. Só depois de trinta minutos sem atualização bem-sucedida a entrada some de verdade. Para a lista de mais vendidos, ninguém vai perceber que ela ficou alguns segundos desatualizada. Para o saldo de uma conta, a conversa é outra, e é por isso que essa técnica depende de quanto o dado tolera estar velho.

## Expiração antecipada probabilística

Uma variação elegante é deixar cada leitura decidir, com alguma probabilidade, se vai recalcular o valor antes de ele expirar. Quanto mais perto do vencimento, maior a chance. Com muitas leituras por segundo, quase sempre alguma delas recalcula pouco antes da expiração, e o *miss* nunca chega a acontecer. Essa técnica aparece com o nome de XFetch, e a fórmula também considera quanto tempo o cálculo demora: valores caros de gerar são renovados mais cedo. Não precisa de lock nem de coordenação, só guardar junto ao valor o tempo de expiração e a duração do último cálculo.

## Qual escolher

- **Jitter no TTL**: sempre. Custa uma linha e evita sincronizar vencimentos.
- **Coalescing por instância**: quase sempre, e geralmente já vem pronto na biblioteca de cache.
- **Stale-while-revalidate**: quando o dado aceita alguns segundos de atraso, que é a maioria dos casos de cache.
- **Lock distribuído**: quando a consulta é cara a ponto de nem uma por instância ser aceitável.
- **Expiração probabilística**: para chaves muito quentes, quando você quer evitar o *miss* sem coordenação.

## O cache também é uma dependência

O ponto mais importante talvez seja mudar a forma de enxergar o cache. Ele não é só uma otimização que pode falhar sem consequência: quando o banco é dimensionado contando com ele, a ausência do cache vira um incidente. Vale tratar isso como as outras dependências do sistema, com [timeouts](/2026-10-16-timeouts-e-propagacao-de-deadline/) que impedem uma recomputação lenta de segurar threads indefinidamente, um [circuit breaker](/2026-10-09-circuit-breaker/) na frente do banco para não piorar uma situação que já está ruim, e um plano para o dia em que o Redis reiniciar e todas as chaves estiverem vazias ao mesmo tempo. O TTL de cinco minutos continua sendo uma boa ideia. Só não pode ser a única.
