---
layout: post
title: "Níveis de isolamento: o que o @Transactional não te conta"
subtitle: "Dirty read, phantom, lost update, write skew e por que o mesmo nome significa coisas diferentes em cada banco"
tags: [Banco de Dados, Programação]
---

Quase todo mundo que trabalha com Spring já escreveu isto e dormiu tranquilo:

```java
@Transactional
public void transferir(long origem, long destino, BigDecimal valor) {
    // ...
}
```

A transação está ali, então está tudo protegido, certo? Mais ou menos. Uma transação garante que tudo acontece ou nada acontece. Isso é o A de ACID, atomicidade. O que ela **não** garante por padrão é que duas transações rodando ao mesmo tempo não se atrapalhem. Isso é o I, de isolamento, e ele não é um interruptor de liga e desliga. É um botão com vários níveis, e o nível que vem configurado de fábrica no seu banco quase certamente deixa passar algumas anomalias.

No [post de ontem sobre race conditions](/2026-11-11-race-conditions/) eu terminei falando rapidamente sobre isso. Hoje é a conversa completa.

## O ideal: serializável

O comportamento que todo mundo imagina quando pensa em transação tem nome: serializabilidade. A ideia é que, mesmo com várias transações rodando em paralelo, o resultado final seja igual ao de alguma execução em que elas rodaram uma de cada vez, em fila.

Se o banco garantisse isso sempre, você nunca precisaria pensar em concorrência dentro de uma transação. O problema é o custo: garantir serializabilidade exige travar mais coisas ou abortar mais transações, e isso reduz o quanto o banco consegue fazer em paralelo. Por isso os bancos oferecem níveis mais fracos, que trocam algumas garantias por desempenho. E por isso quase nenhum banco popular usa serializável como padrão.

Para escolher um nível com consciência, é preciso conhecer o que cada um deixa passar.

## As anomalias

### Dirty read

Uma transação lê um dado que outra transação escreveu mas ainda não confirmou.

```
T1: UPDATE conta SET saldo = 0 WHERE id = 1
T2: SELECT saldo FROM conta WHERE id = 1   -> 0
T1: ROLLBACK
```

A T2 tomou uma decisão com base num saldo que nunca existiu de verdade. É a anomalia mais grave, e quase todo banco evita por padrão.

### Non-repeatable read

A mesma transação lê a mesma linha duas vezes e recebe valores diferentes, porque outra transação alterou e confirmou no meio do caminho.

```
T1: SELECT saldo FROM conta WHERE id = 1   -> 100
T2: UPDATE conta SET saldo = 50 WHERE id = 1; COMMIT
T1: SELECT saldo FROM conta WHERE id = 1   -> 50
```

Parece inofensivo, até você ter um relatório que soma os saldos de todas as contas numa consulta e lista os detalhes em outra, e os dois números não batem.

### Phantom read

Parecido, mas em vez de uma linha mudar, aparece (ou some) uma linha que satisfaz a condição da consulta.

```
T1: SELECT count(*) FROM pedido WHERE cliente_id = 7   -> 3
T2: INSERT INTO pedido (cliente_id, ...) VALUES (7, ...); COMMIT
T1: SELECT count(*) FROM pedido WHERE cliente_id = 7   -> 4
```

Travar as linhas que você leu não ajuda aqui, porque a linha nova não existia quando você leu. É isso que torna fantasmas difíceis de evitar.

### Lost update

Duas transações leem o mesmo valor, calculam um novo a partir dele e escrevem. Uma sobrescreve a outra.

```
T1: SELECT estoque FROM produto WHERE id = 1   -> 10
T2: SELECT estoque FROM produto WHERE id = 1   -> 10
T1: UPDATE produto SET estoque = 9 WHERE id = 1; COMMIT
T2: UPDATE produto SET estoque = 9 WHERE id = 1; COMMIT
```

Duas vendas, estoque 9. É o read-modify-write do post de race conditions, e ele acontece dentro de transações perfeitamente válidas.

### Write skew

Essa é a mais sutil, e a que mais pega gente experiente. Duas transações leem o mesmo conjunto de dados, cada uma toma uma decisão com base no que leu e escreve em linhas **diferentes**. Nenhuma sobrescreve a outra, mas o resultado combinado viola uma regra.

O exemplo clássico é o de plantão médico. A regra do hospital: sempre precisa ter pelo menos um médico de plantão. Ana e Bruno estão de plantão e os dois pedem para sair ao mesmo tempo.

```
T1 (Ana):   SELECT count(*) FROM plantao WHERE ativo   -> 2, ok, posso sair
T2 (Bruno): SELECT count(*) FROM plantao WHERE ativo   -> 2, ok, posso sair
T1:         UPDATE plantao SET ativo = false WHERE medico = 'Ana';   COMMIT
T2:         UPDATE plantao SET ativo = false WHERE medico = 'Bruno'; COMMIT
```

Zero médicos de plantão. Cada transação, sozinha, estava correta. Não houve conflito de escrita na mesma linha, então mecanismos que detectam lost update não percebem nada. É um check-then-act em que o check e o act tocam linhas diferentes.

## A tabela do padrão SQL

O padrão SQL define quatro níveis pelo que cada um proíbe:

| Nível | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| READ UNCOMMITTED | pode | pode | pode |
| READ COMMITTED | não | pode | pode |
| REPEATABLE READ | não | não | pode |
| SERIALIZABLE | não | não | não |

É a tabela que aparece em todo material sobre o assunto, e ela tem dois problemas sérios.

O primeiro é que ela não fala de lost update nem de write skew, que são justamente as anomalias que mais causam bug em aplicação. Isso não é descuido de quem resume o padrão: um artigo de 1995, *A Critique of ANSI SQL Isolation Levels*, já apontava que as definições eram ambíguas e deixavam anomalias de fora, e foi nele que o *snapshot isolation* foi definido.

O segundo é que os bancos implementam esses nomes do jeito que querem. O nome do nível diz pouco. O que importa é o comportamento do banco que você usa.

## O mesmo nome, bancos diferentes

### PostgreSQL

O padrão é `READ COMMITTED`. Cada **comando** enxerga um retrato dos dados confirmados no momento em que ele começou. Duas consultas na mesma transação podem ver dados diferentes.

`READ UNCOMMITTED` existe na sintaxe, mas se comporta como `READ COMMITTED`. Não há dirty read no PostgreSQL.

`REPEATABLE READ` é implementado como snapshot isolation: a transação inteira enxerga um retrato tirado no primeiro comando. Isso evita inclusive fantasmas, indo além do que o padrão exige. E se outra transação alterar e confirmar uma linha que a sua também tenta atualizar, a sua espera e depois é abortada com `could not serialize access due to concurrent update` (se a outra fizer rollback, a sua segue normalmente). Ou seja, lost update vira erro. Write skew, por outro lado, passa.

`SERIALIZABLE` usa uma técnica chamada *Serializable Snapshot Isolation*, que monitora as dependências de leitura e escrita entre transações e aborta uma delas quando detecta um padrão que poderia gerar um resultado impossível em execução serial. Aqui o write skew do plantão é pego.

### MySQL (InnoDB)

O padrão é `REPEATABLE READ`, um nível acima do PostgreSQL, mas com uma pegadinha. Leituras comuns (`SELECT` simples) usam um snapshot tirado na primeira leitura. Leituras com lock (`SELECT ... FOR UPDATE`) e comandos de escrita, porém, enxergam a versão mais recente confirmada, não o snapshot. A mesma transação pode ver dados diferentes dependendo de como lê.

E ao contrário do PostgreSQL, o InnoDB nesse nível não aborta a segunda transação no cenário de lost update: ela espera a primeira terminar e depois grava por cima o valor que calculou com base na leitura antiga. Para leituras com lock, ele usa *gap locks* e *next-key locks*, que travam intervalos de índice e impedem inserções no meio, o que evita fantasmas nesse caso mas pode surpreender com esperas e deadlocks em consultas que parecem não ter relação. E, diferente do PostgreSQL, o `READ UNCOMMITTED` do InnoDB permite dirty read de verdade.

### Oracle

O padrão é `READ COMMITTED`, e o que ele chama de `SERIALIZABLE` é, na prática, snapshot isolation. Write skew passa mesmo no nível de nome mais forte.

### SQL Server

O padrão é `READ COMMITTED` baseado em locks, que pode ser trocado para uma versão baseada em snapshot com a opção `READ_COMMITTED_SNAPSHOT`. No Azure SQL Database, essa opção já vem ligada. Também existe um nível `SNAPSHOT` separado, que no SQL Server precisa ser habilitado no banco com `ALLOW_SNAPSHOT_ISOLATION` (no Azure SQL Database ele também já vem ligado). Aqui, assim como no MySQL, `READ UNCOMMITTED` realmente permite dirty read, e a dica `WITH (NOLOCK)`, que tem o mesmo efeito, costuma aparecer como "otimização" em consultas de relatório. Ler dado que pode sofrer rollback é um preço alto pela velocidade.

A conclusão desta seção é desconfortável: se você troca de banco, ou se o seu time escreveu o código pensando num banco e roda em outro, o mesmo `@Transactional(isolation = Isolation.REPEATABLE_READ)` pode ter garantias diferentes.

## Como o READ COMMITTED te salva (às vezes)

Antes de sair aumentando o isolamento, vale entender por que muito código funciona bem no nível padrão.

No PostgreSQL, quando um `UPDATE` em `READ COMMITTED` encontra uma linha que outra transação está alterando, ele espera essa transação terminar e então **reavalia a condição do `WHERE` contra a versão nova da linha**. Por isso este comando, que apareceu no post de race conditions, é seguro mesmo no nível padrão:

```sql
UPDATE conta
   SET saldo = saldo - :valor
 WHERE id = :id
   AND saldo >= :valor
```

A segunda transação espera, vê o saldo já debitado, e a condição `saldo >= :valor` deixa de ser verdadeira. Zero linhas afetadas, saldo insuficiente.

O que não é seguro é ler numa instrução e escrever em outra com base no que leu. Essa é a fronteira importante: **uma instrução é atômica em relação à linha que ela toca; a sequência de instruções não é**.

## Serializável na prática

Se você decidir usar `SERIALIZABLE` (ou `REPEATABLE READ` no PostgreSQL), aceite uma regra: **transações vão falhar, e o seu código precisa tentar de novo**.

No PostgreSQL, o erro vem com o SQLSTATE `40001` (falha de serialização). Em outros bancos o código muda: no Oracle é o ORA-08177, e no MySQL o conflito costuma aparecer como deadlock. No Spring, ele normalmente chega como uma exceção da família `ConcurrencyFailureException`. Atenção: a falha pode acontecer no próprio `COMMIT`, e com o `DataSourceTransactionManager` ela vira `TransactionSystemException`, que fica fora dessa família. Use o `JdbcTransactionManager`, que traduz também os erros de commit, ou trate os dois casos no retry. E o retry precisa repetir a **transação inteira**, desde a primeira leitura, porque a decisão que você tomou foi baseada em dados que não valem mais.

```java
public void sairDoPlantao(String medico) {
    for (int tentativa = 1; ; tentativa++) {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                long ativos = plantoes.contarAtivos();
                if (ativos < 2) {
                    throw new PlantaoMinimoException();
                }
                plantoes.desativar(medico);
            });
            return;
        } catch (ConcurrencyFailureException e) {
            if (tentativa == 3) {
                throw e;
            }
        }
    }
}
```

O `transactionTemplate` está configurado com `ISOLATION_SERIALIZABLE`. Um detalhe que pega muita gente: o retry precisa ficar **fora** da transação. Colocar um loop de retry dentro de um método `@Transactional` não adianta, porque a transação já foi marcada como falha e todas as tentativas rodam dentro dela. Se preferir anotações, o Spring Retry com `@Retryable` resolve, desde que ele envolva o método transacional e não o contrário. E vale aplicar o que está no [post sobre retry, backoff e jitter](/2026-10-13-retry-backoff-e-jitter/): sob contenção alta, tentar de novo imediatamente só gera mais conflito.

Outra consequência: nada de efeitos colaterais externos dentro da transação. Se ela chama uma API de pagamento e depois aborta por serialização, o retry vai chamar de novo. Publicação de eventos, e-mails e chamadas externas ficam para depois do commit, de preferência com o [outbox pattern](/2026-10-08-outbox-pattern/).

E não é de graça. O banco precisa monitorar mais coisas e vai abortar transações que, olhando de perto, nem conflitavam de verdade. A documentação do PostgreSQL deixa claro que a falha acontece quando ele detecta condições que *poderiam* gerar uma anomalia, e que consultas com varredura sequencial aumentam a taxa de falhas. Transações curtas e índices bons reduzem bastante essas falhas.

## Alternativas para o write skew

Nem sempre vale subir o isolamento do sistema por causa de uma regra. Para o caso do plantão, existem saídas mais localizadas:

- **Travar explicitamente o que foi lido.** `SELECT medico FROM plantao WHERE ativo FOR UPDATE` trava as linhas lidas, e a segunda transação espera a primeira. No PostgreSQL, `FOR UPDATE` não pode ser usado junto com `count(*)`, então conte as linhas na aplicação ou numa subconsulta. Funciona quando o conjunto lido já existe. No PostgreSQL isso não protege contra fantasmas, porque não dá para travar uma linha que ainda não existe. No InnoDB em `REPEATABLE READ`, os next-key locks bloqueiam inserções no intervalo lido.
- **Materializar o conflito.** Criar uma linha que represente a coisa disputada (por exemplo, um registro por turno) e travar essa linha. Transforma o write skew num conflito na mesma linha, que os mecanismos normais já tratam.
- **Constraint no banco.** Quando a regra pode ser expressa como `UNIQUE`, `CHECK` ou uma *exclusion constraint* (no PostgreSQL), o banco garante a regra independente do nível de isolamento. Para "não pode haver duas reservas sobrepostas na mesma sala", por exemplo, uma exclusion constraint resolve de forma elegante.

## Na prática

O resumo para a próxima vez que você escrever `@Transactional`:

- Descubra qual é o nível padrão do seu banco e o que ele realmente garante. Não confie no nome.
- `READ COMMITTED` é suficiente para a maioria dos casos **se** as regras de negócio estiverem em `UPDATE` com condição no `WHERE`, em constraints ou em locks explícitos.
- Ler numa instrução e escrever em outra com base no que leu é o padrão que causa lost update e write skew. Procure por ele no code review.
- Write skew passa em snapshot isolation, inclusive no `SERIALIZABLE` do Oracle e no `REPEATABLE READ` do PostgreSQL.
- Se usar `SERIALIZABLE`, trate a falha de serialização (SQLSTATE `40001` no PostgreSQL) com retry da transação inteira, com o retry fora do método transacional.
- Nada de chamadas externas dentro de transações que podem ser repetidas.
- Teste com concorrência real, várias threads saindo juntas, contra o mesmo banco que roda em produção. Um banco em memória nos testes pode ter um modelo de isolamento completamente diferente.

Isolamento é um daqueles assuntos em que o padrão de fábrica funciona tão bem na maior parte do tempo que a gente esquece que ele existe. Até o dia em que dois médicos saem do plantão ao mesmo tempo. Saber o que o seu banco promete, e principalmente o que ele não promete, é o que separa um `@Transactional` que protege de um que só dá a sensação de proteção.
