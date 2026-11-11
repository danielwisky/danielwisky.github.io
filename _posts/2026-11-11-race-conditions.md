---
layout: post
title: "Race conditions: o bug que só aparece em produção"
subtitle: "Check-then-act, lost update, como reproduzir no seu notebook e como evitar de verdade"
tags: [Java, Programação]
---

O código abaixo passou no code review, tem teste unitário, e funcionou perfeitamente por meses:

```java
public void sacar(long contaId, BigDecimal valor) {
    var conta = repositorio.buscar(contaId);
    if (conta.saldo().compareTo(valor) < 0) {
        throw new SaldoInsuficienteException();
    }
    conta.debitar(valor);
    repositorio.salvar(conta);
}
```

Até que um dia o suporte abre um chamado: um cliente com R$ 100 de saldo conseguiu sacar R$ 100 duas vezes. Ninguém consegue reproduzir. Os logs mostram as duas operações, ambas com sucesso, com poucos milissegundos de diferença. O teste continua verde.

Isso é uma condição de corrida, ou race condition: o resultado do programa depende da ordem em que coisas concorrentes acontecem, e alguma dessas ordens produz um resultado errado. O código não está errado em nenhuma linha isolada. Ele está errado no espaço entre as linhas.

## Por que só aparece em produção

No seu notebook, você testa clicando num botão. Uma requisição por vez, com segundos de intervalo. A janela entre ler o saldo e salvar o novo valor dura alguns milissegundos, e a chance de duas requisições caírem exatamente nesse intervalo é praticamente zero.

Em produção a conta muda. Usuário que clica duas vezes no botão de pagar. App mobile que faz retry porque a rede oscilou. Dois pods atrás de um load balancer recebendo requisições do mesmo cliente. Um job em batch rodando ao mesmo tempo que a API. Multiplique uma probabilidade pequena por milhões de requisições e ela deixa de ser pequena.

E tem o pior detalhe: quando você vai investigar, colocando logs ou um debugger, muda o tempo de execução e o bug some. Não é à toa que esse tipo de problema ganhou o apelido de *heisenbug*.

## Os dois padrões que causam quase tudo

A maioria das race conditions do dia a dia cai em um de dois formatos. Reconhecer o formato é metade do trabalho.

### Check-then-act

Você verifica uma condição e depois age com base nela, assumindo que ela continua verdadeira. O saque do começo do post é exatamente isso: verifica o saldo, depois debita. Entre o *check* e o *act*, outra thread pode ter mudado o mundo.

```
Thread A: lê saldo = 100
Thread B: lê saldo = 100
Thread A: 100 >= 100, ok, debita -> salva saldo 0
Thread B: 100 >= 100, ok, debita -> salva saldo 0
```

Duas retiradas de 100, saldo final 0, e o banco perdeu 100 reais.

O padrão aparece em muitos lugares diferentes:

```java
// cadastro
if (!usuarios.existePorEmail(email)) {
    usuarios.salvar(new Usuario(email));
}

// cache preguiçoso
if (!cache.containsKey(chave)) {
    cache.put(chave, calcular(chave));
}

// arquivo
if (!Files.exists(caminho)) {
    Files.createFile(caminho);
}
```

Todos parecem corretos, e todos permitem que duas threads passem pelo `if` antes de qualquer uma delas agir. No caso do arquivo, o problema tem até nome próprio na área de segurança: TOCTOU, *time of check to time of use*.

### Read-modify-write (lost update)

Você lê um valor, calcula um novo a partir dele e escreve de volta. Se duas operações fazem isso ao mesmo tempo, uma sobrescreve a outra e um update se perde.

```java
class Contador {
    private int valor;

    void incrementar() {
        valor++;
    }
}
```

O `valor++` parece uma operação só, mas são três: ler `valor`, somar 1, escrever. Duas threads podem ler 41, as duas calculam 42, e as duas escrevem 42. Dois incrementos, um efeito.

O mesmo acontece fora da memória. Com JPA isso é extremamente comum, porque o código fica com cara de inofensivo:

```java
var produto = produtos.findById(id).orElseThrow();
produto.setEstoque(produto.getEstoque() - quantidade);
produtos.save(produto);
```

Dois pedidos simultâneos do mesmo produto leem estoque 10, cada um subtrai 1, e os dois salvam 9. Um item foi vendido sem sair do estoque.

## Reproduzindo de propósito

Não dá para corrigir com confiança o que você não consegue reproduzir. A boa notícia é que dá para aumentar muito a chance da corrida acontecer: muitas threads, começando todas ao mesmo tempo, repetindo várias vezes.

```java
@RepeatedTest(100)
void naoPermiteSacarMaisQueOSaldo() throws Exception {
    var contaId = criarContaComSaldo(new BigDecimal("100"));
    var largada = new CountDownLatch(1);
    var sucessos = new AtomicInteger();

    try (var executor = Executors.newFixedThreadPool(10)) {
        for (int i = 0; i < 10; i++) {
            executor.submit(() -> {
                largada.await();
                try {
                    servico.sacar(contaId, new BigDecimal("100"));
                    sucessos.incrementAndGet();
                } catch (SaldoInsuficienteException e) {
                    // esperado para 9 das 10 threads
                }
                return null;
            });
        }
        largada.countDown();
    }

    assertEquals(1, sucessos.get());
}
```

O `CountDownLatch` é o truque principal: todas as threads ficam paradas esperando a largada e saem juntas, em vez de começarem espalhadas conforme o executor as cria. Isso concentra as operações exatamente na janela perigosa.

Se o código tem a race condition, esse teste costuma falhar em poucas execuções. E ele vira o teste de regressão depois que você corrigir. Vale lembrar do que falei no [post sobre testes flaky](/2026-11-06-testes-flaky/): um teste concorrente que falha de vez em quando pode estar te avisando de um bug real, não sendo flaky.

Para código concorrente de baixo nível, em que você está escrevendo estruturas de dados lock-free ou mexendo com `volatile`, existe o jcstress, ferramenta da própria OpenJDK feita para estressar esse tipo de código e encontrar resultados que o modelo de memória permite mas você não esperava. Para o dia a dia de aplicação, o teste com latch costuma bastar.

## Como evitar

A ideia por trás de todas as soluções é a mesma: transformar o *check* e o *act* (ou o *read* e o *write*) numa operação só, que ninguém consegue interromper no meio. O que muda é onde essa garantia mora.

### Em memória: operações atômicas

Para estado dentro de uma única JVM, o pacote `java.util.concurrent` já resolve a maioria dos casos:

```java
class Contador {
    private final AtomicInteger valor = new AtomicInteger();

    void incrementar() {
        valor.incrementAndGet();
    }
}
```

E para o cache preguiçoso, o `ConcurrentHashMap` tem a operação certa pronta:

```java
cache.computeIfAbsent(chave, this::calcular);
```

Trocar `HashMap` por `ConcurrentHashMap` não resolve nada se você continuar fazendo `containsKey` seguido de `put`. Cada chamada isolada é thread-safe, mas a sequência das duas não é. A correção está em usar a operação composta.

Quando não existe operação atômica pronta, `synchronized` ou um `ReentrantLock` protegem o trecho inteiro. Funciona, com um porém grande: só dentro do mesmo processo.

### O lock em memória que não protege nada

Esse é o erro mais comum quando alguém descobre a race condition do saque:

```java
public synchronized void sacar(long contaId, BigDecimal valor) { ... }
```

Resolve no notebook. Em produção, com três réplicas do serviço, cada uma tem o próprio lock, e duas requisições caindo em pods diferentes continuam correndo uma contra a outra. Além disso, você serializou todos os saques de todas as contas numa fila só dentro de cada pod.

Se o estado está no banco, a proteção precisa estar no banco.

### No banco: deixe o banco fazer a conta

A forma mais simples e muitas vezes a melhor: em vez de ler, calcular no Java e escrever, mande o banco fazer tudo num único comando.

```sql
UPDATE conta
   SET saldo = saldo - :valor
 WHERE id = :id
   AND saldo >= :valor
```

O check e o act viraram uma instrução só. Se o número de linhas afetadas for zero, o saldo era insuficiente. Não tem janela entre leitura e escrita, porque não tem leitura separada.

### Lock pessimista

Quando a lógica é complexa demais para caber num `UPDATE`, dá para travar a linha durante a transação:

```sql
SELECT * FROM conta WHERE id = :id FOR UPDATE
```

Com JPA, `@Lock(LockModeType.PESSIMISTIC_WRITE)` no método do repositório gera algo equivalente. A segunda transação que tentar ler a mesma conta fica esperando a primeira terminar. É seguro e fácil de entender, mas segura conexões enquanto espera e pode gerar deadlock se duas transações travarem linhas em ordens diferentes. Mantenha a transação curta e trave sempre na mesma ordem.

### Lock otimista

A alternativa é não travar nada e detectar o conflito na hora de escrever. Você adiciona uma coluna de versão:

```java
@Entity
class Produto {
    @Id Long id;
    int estoque;
    @Version long versao;
}
```

O Hibernate passa a incluir a versão lida no `WHERE` e a gravar a próxima versão junto: `UPDATE ... SET estoque = ?, versao = ? WHERE id = ? AND versao = ?`. Se outra transação alterou o registro no meio do caminho, a versão não bate, nenhuma linha é atualizada e você recebe uma exceção de lock otimista (`OptimisticLockException` no JPA, que no Spring chega como `ObjectOptimisticLockingFailureException`). Aí cabe a você decidir: tentar de novo lendo o valor atualizado, ou devolver um erro de conflito para o cliente.

Funciona muito bem quando conflitos são raros, porque não segura ninguém esperando. Quando o mesmo registro é disputado o tempo todo, os retries começam a se acumular e o lock pessimista ou o `UPDATE` atômico costumam ser melhores.

### Constraint única

Para check-then-act do tipo "se não existe, cria", a ferramenta certa geralmente é uma constraint:

```sql
ALTER TABLE usuario ADD CONSTRAINT uk_usuario_email UNIQUE (email);
```

Você pode até manter o `existePorEmail` para devolver uma mensagem bonita no caso comum, mas quem garante a regra é o banco. Se duas requisições passarem pelo `if` ao mesmo tempo, uma delas falha no insert com violação de constraint, e você trata isso como "e-mail já cadastrado". É o mesmo princípio por trás das chaves de idempotência do [post sobre idempotência em APIs](/2026-09-29-idempotencia-em-apis/).

### E o nível de isolamento?

Uma pergunta frequente é se aumentar o nível de isolamento da transação resolve. Às vezes resolve, mas depende do banco e do nível. No PostgreSQL, por exemplo, o padrão é `READ COMMITTED`, que não impede o lost update no padrão ler-calcular-escrever da aplicação. Lá, `REPEATABLE READ` e `SERIALIZABLE` detectam quando duas transações atualizam a mesma linha e abortam uma delas, o que significa que você também precisa tratar erro e fazer retry. Já no MySQL com InnoDB, o padrão é `REPEATABLE READ` e ele não aborta nesse caso: o lost update continua acontecendo. O mesmo nome de nível pode ter comportamentos diferentes em cada banco. Antes de mudar o isolamento do sistema inteiro, quase sempre é melhor resolver o ponto específico com uma das técnicas acima.

## Na prática

Um resumo para levar para o próximo code review:

- Procure por `if` seguido de escrita sobre estado compartilhado. É check-then-act até que se prove o contrário.
- Procure por ler, calcular e salvar. É lost update até que se prove o contrário.
- Em memória, prefira operações atômicas prontas (`AtomicInteger`, `computeIfAbsent`, `merge`) a montar a sequência na mão.
- Lock em memória não protege estado que está no banco quando o serviço tem mais de uma instância.
- No banco, `UPDATE` com a condição no `WHERE` resolve a maioria dos casos de forma simples.
- Use `@Version` quando conflitos são raros e `FOR UPDATE` quando são frequentes.
- Regras do tipo "não pode existir duplicado" moram numa constraint única, não num `if`.
- Reproduza com várias threads saindo juntas de um `CountDownLatch`, e guarde esse teste.

Race conditions são traiçoeiras porque o código parece correto quando lido de cima para baixo, uma linha de cada vez. O hábito que mais ajuda é ler de outro jeito: para cada linha que toca estado compartilhado, perguntar o que acontece se outra requisição executar exatamente essa mesma linha no mesmo instante. Na maioria das vezes a resposta é "nada demais". Quando não for, você acabou de encontrar o bug antes do cliente.
