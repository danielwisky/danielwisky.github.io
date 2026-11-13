---
layout: post
title: "Por que sua query não usa o índice que você criou"
subtitle: "Funções na coluna, ordem do índice composto, LIKE, tipos que não batem e como ler um EXPLAIN"
tags: [Banco de Dados, SQL]
---

A história costuma ser assim. Uma tela fica lenta, alguém olha a query, vê um `WHERE` numa coluna sem índice e cria o índice. Deploy feito, todo mundo aliviado. No dia seguinte a tela continua lenta.

O índice está lá, dá para ver no schema. Ele só não está sendo usado.

Isso acontece muito mais do que deveria, e quase sempre por um dos mesmos motivos. Nenhum deles é bug do banco. Na maioria dos casos, a query foi escrita de um jeito que impede o índice de ajudar, ou o banco olhou para os dados e decidiu, com razão, que o índice não valia a pena.

Os exemplos aqui são em PostgreSQL, mas a lógica vale para praticamente qualquer banco relacional. Onde o MySQL se comporta diferente, eu aviso.

## Antes de tudo: pergunte ao banco

Não adianta adivinhar. O banco diz exatamente o que pretende fazer com uma query, basta pedir:

```sql
EXPLAIN ANALYZE
SELECT * FROM pedido WHERE cliente_id = 42;
```

O `EXPLAIN` sozinho mostra o plano que o otimizador escolheu e as estimativas dele. Com `ANALYZE`, o banco executa a query de verdade e mostra também quanto tempo cada etapa levou e quantas linhas realmente passaram por ela. Cuidado: como executa, um `EXPLAIN ANALYZE` num `UPDATE` ou `DELETE` altera os dados. Se precisar analisar um desses, rode dentro de uma transação e dê `ROLLBACK` no final.

No resultado, o que interessa primeiro é o tipo de acesso à tabela:

- **Seq Scan**: leu a tabela inteira, linha por linha. É o que você está tentando evitar, na maioria das vezes.
- **Index Scan**: usou o índice para achar as linhas e depois foi buscar cada uma na tabela.
- **Index Only Scan**: respondeu usando só o índice, indo na tabela apenas para as páginas que o VACUUM ainda não marcou como visíveis (isso aparece como `Heap Fetches` no plano). O melhor caso.
- **Bitmap Index Scan + Bitmap Heap Scan**: usou o índice para montar a lista de páginas com linhas relevantes e depois leu essas páginas em ordem. Comum quando a query devolve um número médio de linhas.

A segunda coisa a olhar é a diferença entre `rows` estimado e `rows` real. Se o banco achou que viriam 10 linhas e vieram 200 mil, ele tomou a decisão com base numa informação errada, e é bem provável que a decisão também esteja errada. Guarde isso, vamos voltar nesse ponto.

No MySQL, o equivalente é o `EXPLAIN` (e o `EXPLAIN ANALYZE` a partir do 8.0.18). Lá, a coluna `type` com valor `ALL` é o seq scan, e a coluna `key` mostra qual índice foi usado, ou `NULL` se nenhum foi.

## Motivo 1: você passou a coluna por uma função

Esse é de longe o mais comum. Você tem um índice em `email` e escreve:

```sql
SELECT * FROM usuario WHERE lower(email) = 'ana@exemplo.com';
```

O índice guarda os valores de `email` ordenados como eles estão gravados. Ele não sabe nada sobre `lower(email)`. Para responder essa query, o banco precisa calcular `lower()` em todas as linhas e comparar uma por uma. Seq scan.

O mesmo acontece com datas, e esse é traiçoeiro porque a query parece muito natural:

```sql
-- não usa o índice em criado_em
SELECT * FROM pedido WHERE date(criado_em) = '2026-11-13';

-- usa
SELECT * FROM pedido
 WHERE criado_em >= '2026-11-13'
   AND criado_em <  '2026-11-14';
```

A segunda versão compara a coluna crua com um intervalo, e um índice B-tree é exatamente uma estrutura feita para responder "me dê tudo entre X e Y". Repare também no intervalo semiaberto (`>=` no começo, `<` no fim): ele não deixa de fora nada que aconteceu às 23:59:59.999 e não precisa de malabarismo com o último instante do dia. Se a coluna for `timestamptz`, lembre que "o dia 13" depende do fuso, assunto do [post sobre fusos horários](/2026-11-05-fusos-horarios-sao-uma-armadilha/).

Matemática na coluna tem o mesmo efeito:

```sql
-- não usa
WHERE preco * 2 > 100

-- usa
WHERE preco > 50
```

A regra geral: deixe a coluna sozinha de um lado da comparação e faça as contas do outro lado.

Quando não dá para reescrever, como no caso do `lower(email)`, que existe justamente porque você quer comparar sem diferenciar maiúsculas, a saída é indexar a própria expressão:

```sql
CREATE INDEX idx_usuario_email_lower ON usuario (lower(email));
```

Aí o índice guarda os valores já em minúsculas, e a query precisa usar exatamente a mesma expressão para aproveitá-lo. O MySQL suporta algo parecido com índices funcionais a partir do 8.0.13, mas lá a collation padrão já ignora maiúsculas e minúsculas, então muitas vezes o `lower()` nem é necessário.

## Motivo 2: os tipos não batem

Esse é o primo silencioso do motivo anterior. Imagine uma coluna `cpf` do tipo `VARCHAR`, com índice, e uma query vinda de algum lugar que passa o valor como número:

```sql
SELECT * FROM cliente WHERE cpf = 12345678901;
```

No MySQL, comparar uma coluna de texto com um número faz o banco converter o valor de cada linha para número antes de comparar. É uma função aplicada na coluna, só que invisível. O índice deixa de servir, e a query continua funcionando, só que lenta. Pior: a conversão pode gerar falsos positivos, porque textos diferentes podem virar o mesmo número.

O PostgreSQL é mais rígido com tipos e, nesse exemplo específico, simplesmente dá erro, o que é uma bênção. Mas o problema aparece de outras formas, principalmente quando a aplicação manda parâmetros com um tipo diferente do da coluna (um `numeric` comparado com uma coluna `integer`, por exemplo) e o banco precisa decidir de que lado converter.

Quando um plano não faz sentido nenhum, vale olhar o `EXPLAIN` procurando por casts na condição de filtro, algo como `((cliente_id)::numeric = '42'::numeric)`. Se a conversão está sendo aplicada na coluna, achou o culpado.

## Motivo 3: a ordem das colunas no índice composto

Um índice composto em `(cliente_id, status)` é ordenado primeiro por `cliente_id` e, dentro de cada cliente, por `status`. Pense numa lista telefônica ordenada por sobrenome e depois por nome: ótima para achar "Silva, Ana", ótima para achar todos os "Silva", e inútil para achar todas as "Ana".

```sql
CREATE INDEX idx_pedido_cliente_status ON pedido (cliente_id, status);

-- usa bem o índice
WHERE cliente_id = 42 AND status = 'PAGO'

-- usa bem o índice (prefixo à esquerda)
WHERE cliente_id = 42

-- não aproveita a ordenação do índice
WHERE status = 'PAGO'
```

Isso é conhecido como regra do prefixo mais à esquerda. Versões recentes dos bancos têm uma otimização chamada *skip scan* (o PostgreSQL a partir do 18, e o MySQL desde o 8.0.13, com mais restrições, como a query usar só colunas que estão no índice), que consegue usar o índice mesmo sem a primeira coluna quando ela tem poucos valores distintos. É uma ajuda bem-vinda, mas não é algo para usar como base do seu design.

Na hora de escolher a ordem, uma heurística que funciona bem: colunas comparadas por igualdade primeiro, colunas de intervalo ou de ordenação depois.

```sql
-- query
SELECT * FROM pedido
 WHERE cliente_id = 42
   AND criado_em >= '2026-10-01'
 ORDER BY criado_em DESC
 LIMIT 20;

-- índice que serve para o filtro e para a ordenação
CREATE INDEX idx_pedido_cliente_criado ON pedido (cliente_id, criado_em);
```

Com o índice nessa ordem, o banco pula direto para o trecho do cliente 42, que já está ordenado por data, lê 20 entradas e para. Se a ordem fosse `(criado_em, cliente_id)`, ele teria que andar pelo índice a partir do pedido mais recente, passando pelos pedidos de todos os clientes, até achar 20 do cliente 42. Se esse cliente compra pouco, isso pode significar percorrer quase tudo desde outubro. É também o que faz a [paginação por cursor](/2026-10-15-paginacao-por-cursor-vs-offset/) ser rápida: ela depende de existir um índice nessa ordem.

## Motivo 4: LIKE começando com curinga

```sql
-- pode usar índice
WHERE nome LIKE 'Silva%'

-- não usa índice B-tree
WHERE nome LIKE '%Silva%'
```

Voltando à lista telefônica: achar quem começa com "Silva" é fácil, porque estão todos juntos. Achar quem tem "Silva" em qualquer posição do nome exige ler a lista inteira.

Tem um detalhe no PostgreSQL que pega muita gente: mesmo o `LIKE 'Silva%'` pode não usar um índice comum se o banco estiver configurado com uma collation diferente de `C`, que é o caso da maioria das instalações com `pt_BR.UTF-8` ou `en_US.UTF-8`. Nesse caso, é preciso criar o índice com uma classe de operadores própria:

```sql
CREATE INDEX idx_cliente_nome_prefixo ON cliente (nome text_pattern_ops);
```

Esse índice atende `LIKE 'prefixo%'` e igualdade, mas não serve para `<`, `>` ou `ORDER BY` na collation normal. Se a coluna também é usada nesses casos, o índice comum continua sendo necessário.

Para busca por trecho no meio do texto, o caminho no PostgreSQL é a extensão `pg_trgm` com um índice GIN, que quebra o texto em trigramas e consegue responder `LIKE '%Silva%'` e até buscas aproximadas. Se a necessidade for busca textual de verdade, com relevância e radicais de palavras, aí é assunto de full-text search, ou de uma ferramenta feita para isso.

## Motivo 5: o índice não vale a pena, e o banco está certo

Às vezes o banco ignora o índice porque usar o índice seria mais lento. E ele tem razão.

Imagine uma tabela de pedidos em que 95% das linhas têm `status = 'ENTREGUE'`. Uma query buscando os entregues vai devolver quase a tabela inteira. Usar o índice significaria, para cada entrada, pular para uma posição diferente da tabela buscar a linha. Ler a tabela de forma sequencial, do começo ao fim, é muito mais barato. O otimizador sabe disso e escolhe o seq scan.

Agora, a mesma coluna buscando `status = 'AGUARDANDO_PAGAMENTO'`, que são 0,5% das linhas, provavelmente usa o índice sem problema. A decisão depende do valor buscado, não só da coluna. Isso é o que se chama de seletividade.

Se você só consulta os valores raros, existe uma opção melhor do que indexar a coluna inteira, o índice parcial:

```sql
CREATE INDEX idx_pedido_pendente ON pedido (criado_em)
 WHERE status = 'AGUARDANDO_PAGAMENTO';
```

Ele indexa só as linhas que interessam, fica pequeno e é barato de manter. O PostgreSQL suporta isso nativamente. O MySQL não tem índice parcial nesse formato.

O mesmo raciocínio explica outro caso que assusta quem está começando: em tabelas pequenas, o banco quase sempre faz seq scan. Se a tabela inteira cabe em poucas páginas, lê-la de uma vez é mais rápido do que passar pelo índice. Não tente "consertar" isso. E tome cuidado ao testar em desenvolvimento, com mil linhas na tabela: o plano que você vê lá pode ser completamente diferente do de produção.

## Motivo 6: o banco está decidindo com informação velha

O otimizador não olha os dados toda vez que planeja uma query. Ele usa estatísticas: quantas linhas a tabela tem, quantos valores distintos cada coluna tem, quais são os mais comuns, como os valores se distribuem. Essas estatísticas são atualizadas periodicamente, não em tempo real.

Se você acabou de carregar 10 milhões de linhas numa tabela que tinha mil, ou apagou metade dela, as estatísticas podem estar descrevendo uma tabela que não existe mais. O banco escolhe o plano certo para os dados errados.

Lembra da diferença entre `rows` estimado e real no `EXPLAIN ANALYZE`? É aqui que ela aparece. Uma estimativa errada por ordens de grandeza é um sinal forte de estatística desatualizada, e a solução costuma ser simples:

```sql
ANALYZE pedido;
```

No PostgreSQL, o autovacuum atualiza estatísticas sozinho na maior parte do tempo, mas depois de cargas grandes vale rodar o `ANALYZE` na mão, principalmente em pipelines que carregam uma tabela e já consultam em seguida. No MySQL, o equivalente é o `ANALYZE TABLE`.

Às vezes o problema não é estatística velha, mas estatística que não consegue capturar a realidade, como colunas correlacionadas (cidade e estado, por exemplo) em que o banco assume que são independentes e erra a estimativa. O PostgreSQL tem `CREATE STATISTICS` para esse caso. É um assunto mais avançado, mas bom saber que existe.

## Motivo 7: o índice serve para filtrar, mas não para o resto da query

Às vezes o índice é usado, aparece no plano, e mesmo assim a query é lenta. Vale olhar o que vem depois.

Um caso comum é o índice que acha as linhas certas, mas a query pede um monte de colunas que não estão nele, então o banco precisa ir na tabela buscar cada linha. Se isso acontece para milhares de linhas, pesa. Quando uma query específica é crítica, dá para incluir as colunas que ela precisa no índice e transformar o acesso num Index Only Scan:

```sql
CREATE INDEX idx_pedido_cliente_cobertura
    ON pedido (cliente_id, criado_em)
    INCLUDE (valor_total, status);
```

O `INCLUDE` existe no PostgreSQL desde a versão 11 e guarda essas colunas no índice sem fazer parte da ordenação. No MySQL com InnoDB, a ideia é parecida, mas feita colocando as colunas no próprio índice composto. Mais um motivo para evitar `SELECT *`: ele torna esse tipo de otimização praticamente impossível.

Outro caso é o `ORDER BY` numa coluna que não está no índice, obrigando o banco a ler todas as linhas que passam pelo filtro e ordená-las antes de devolver as 20 primeiras. Com `LIMIT`, o PostgreSQL consegue guardar só as 20 melhores enquanto lê (o plano mostra `top-N heapsort`), mas ainda precisa ler tudo. No plano, isso aparece como um nó `Sort`. Se ele estiver no caminho de uma query que deveria ser rápida, a ordem do índice composto provavelmente precisa ser revista, como no motivo 3.

## E por que não indexar tudo?

Depois de descobrir que índice resolve tanta coisa, a tentação é criar um para cada coluna. Não faça isso. Todo índice tem custo:

- Cada `INSERT` precisa gravar uma entrada em todos os índices da tabela. No PostgreSQL, um `UPDATE` que altera qualquer coluna indexada gera entradas novas em todos os índices, não só no da coluna alterada, porque a nova versão da linha vai para outro lugar. Só escapam disso os updates HOT, que não mexem em colunas indexadas e cabem na mesma página. Uma tabela com dez índices escreve bem mais devagar do que uma com dois.
- Índices ocupam espaço em disco e, mais importante, disputam memória com os dados que você realmente consulta.
- Índices parecidos se sobrepõem e somam custo sem benefício. Um índice em `(cliente_id)` é praticamente redundante se já existe um em `(cliente_id, criado_em)`.

O PostgreSQL guarda quantas vezes cada índice foi usado na view `pg_stat_user_indexes`. Vale olhar de vez em quando a coluna `idx_scan`: índice com zero leituras depois de meses em produção é custo sem benefício. Antes de apagar, confira se ele não está garantindo uma constraint única e se não é usado em réplicas de leitura, porque cada servidor tem os próprios contadores. Confira também se os contadores não foram zerados recentemente: um crash, um restore de backup ou um `pg_stat_reset()` reinicia tudo.

## Na prática

O roteiro que eu sigo quando uma query não usa o índice:

- Rode `EXPLAIN ANALYZE` com dados parecidos com os de produção. Plano de banco de desenvolvimento com mil linhas não diz muita coisa.
- Procure a coluna do índice envolvida em função, conta ou cast no `WHERE`. Reescreva deixando a coluna sozinha ou crie um índice na expressão.
- Confira se os tipos dos parâmetros batem com os tipos das colunas.
- Em índice composto, confirme que a query usa o prefixo à esquerda. Igualdade primeiro, intervalo e ordenação depois.
- `LIKE '%texto'` não usa índice B-tree. Para prefixo no PostgreSQL, confira a collation. Para trecho no meio, `pg_trgm`.
- Se a query devolve boa parte da tabela, o seq scan provavelmente é a escolha certa. Para valores raros, considere um índice parcial.
- Estimativa de linhas muito diferente da real? Rode `ANALYZE` na tabela.
- Índice usado e query lenta mesmo assim? Olhe o que vem depois: busca na tabela, `Sort`, colunas que não estão no índice.

O otimizador não é um oráculo, mas também não é burro. Na grande maioria das vezes em que ele ignora o seu índice, ele está fazendo a melhor escolha possível com a query que recebeu e com o que sabe sobre os dados. Em vez de brigar com ele, a pergunta mais útil é: o que eu estou escrevendo ou deixando de contar que faz esse índice não servir?
