---
layout: post
title: "Paginação por cursor vs. offset: por que o OFFSET 100000 derruba o banco"
subtitle: "A paginação que funciona bem na página 1 e vira um problema na página 5.000"
tags: [Banco de Dados, APIs]
---

Toda API que lista alguma coisa começa com uma paginação parecida com esta: o cliente manda `?page=3&size=20`, o backend converte isso em `LIMIT 20 OFFSET 40` e devolve os registros. Funciona, é fácil de entender e todo framework já entrega pronto. O problema aparece meses depois, quando a tabela tem milhões de linhas e alguém (um usuário curioso, um job de exportação, um crawler) começa a pedir a página 5.000. A consulta que levava poucos milissegundos passa a levar segundos, o banco começa a suar e ninguém mudou uma linha de código.

## O que o OFFSET realmente faz

A intuição engana: parece que `OFFSET 100000` manda o banco "pular" direto para a linha 100.001. Não é assim. O banco precisa encontrar as primeiras 100.020 linhas na ordem pedida, descartar 100.000 delas e devolver as 20 restantes.

```sql
SELECT id, cliente_id, total, criado_em
FROM pedidos
ORDER BY criado_em DESC
LIMIT 20 OFFSET 100000;
```

Mesmo com um índice em `criado_em`, o banco percorre esse índice entrada por entrada até chegar na posição certa. O custo cresce de forma linear com o offset: a página 1 lê 20 linhas, a página 5.000 lê cem mil. E como cada requisição faz esse trabalho do zero, o custo total para um crawler percorrer todas as páginas cresce com o quadrado do número de páginas.

## O problema que ninguém percebe: páginas que se movem

Além da performance, o offset tem um defeito de consistência. Ele define a página pela posição, e a posição de um registro muda quando outros registros entram ou saem.

Imagine uma lista ordenada do mais novo para o mais antigo. O usuário carrega a página 1 e, enquanto lê, chegam dois pedidos novos. Quando ele pede a página 2, tudo andou duas posições para baixo, e os dois últimos itens da página 1 aparecem de novo no topo da página 2. O inverso também acontece: se algo for apagado, um item escorrega da página 2 para a 1 e o usuário simplesmente nunca vê esse item. Num feed isso é só irritante. Num job que exporta registros para outro sistema, é dado duplicado ou perdido.

## Paginação por cursor (keyset)

A alternativa é parar de perguntar "me dá a página N" e passar a perguntar "me dá os próximos 20 depois deste aqui". Em vez de uma posição, o cliente envia o valor da chave de ordenação do último item que recebeu, e a consulta usa esse valor num `WHERE`:

```sql
SELECT id, cliente_id, total, criado_em
FROM pedidos
WHERE (criado_em, id) < (:ultimoCriadoEm, :ultimoId)
ORDER BY criado_em DESC, id DESC
LIMIT 20;
```

Com um índice composto em `(criado_em, id)`, o banco vai direto para o ponto certo do índice e lê exatamente 20 entradas. A página 5.000 custa o mesmo que a página 1. E como a referência é um valor, não uma posição, registros novos inseridos no topo não empurram nada: a próxima página continua exatamente de onde a anterior parou.

O `id` na ordenação não está ali por enfeite. Se a ordenação fosse só por `criado_em`, dois pedidos criados no mesmo instante teriam o mesmo cursor, e um deles poderia ser pulado. A coluna extra funciona como desempate e garante uma ordem total. Se o seu banco não lida bem com a comparação de tuplas, a forma expandida é equivalente:

```sql
WHERE criado_em < :ultimoCriadoEm
   OR (criado_em = :ultimoCriadoEm AND id < :ultimoId)
```

## Expondo o cursor na API

Para o cliente, o cursor deve ser opaco. Em vez de devolver `criado_em` e `id` soltos e deixar o front montar a próxima requisição, o backend serializa os valores e devolve uma string:

```java
public record Cursor(Instant criadoEm, long id) {

    public String encode() {
        String raw = criadoEm + "|" + id;
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public static Cursor decode(String token) {
        String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
        String[] partes = raw.split("\\|");
        return new Cursor(Instant.parse(partes[0]), Long.parseLong(partes[1]));
    }
}
```

```json
{
  "itens": [ ... ],
  "proximoCursor": "MjAyNi0xMC0xNVQxNDowMDowMC4xMjM0NTZafDQyMTk5"
}
```

Um detalhe que pega muita gente: o cursor precisa guardar o valor com a mesma precisão da coluna no banco. Se `criado_em` tem microssegundos e o cursor guarda só milissegundos, a comparação usa um valor truncado e pula justamente os registros daquele milissegundo que ainda não foram lidos. Também vale tratar token inválido como erro do cliente (um 400), em vez de deixar a exceção do parse virar um 500.

Deixar o cursor opaco dá liberdade para mudar a implementação depois (trocar a coluna de ordenação, adicionar um campo) sem quebrar contrato com ninguém, o que conversa bem com o que escrevi sobre [versionamento de API](/2026-10-07-versionamento-de-api-sem-quebrar-clientes/). Quando `proximoCursor` vem nulo, acabou a lista. Se você usa Spring Data, as versões mais recentes já trazem suporte nativo a esse modelo com `ScrollPosition` e `Window`, o que poupa boa parte do código acima.

## O que você perde

Cursor não é de graça, e vale saber o que fica pelo caminho antes de trocar tudo:

- **Pular para uma página específica.** Não existe "ir para a página 37". Só dá para andar para frente (e para trás, se você inverter a comparação e a ordenação).
- **Total de páginas.** Saber quantas páginas existem exige um `COUNT(*)`, que em tabelas grandes tem o mesmo problema de performance que o offset. Muitas interfaces resolvem isso trocando a numeração por um "carregar mais" ou scroll infinito.
- **Ordenação flexível.** Cada ordenação que o cliente pode escolher precisa de um cursor com as colunas certas e, de preferência, de um índice que a sustente. Ordenar por cinco colunas diferentes significa cinco combinações para manter.

## Quando usar cada um

Offset continua sendo uma escolha razoável quando a tabela é pequena ou limitada, como uma tela administrativa com algumas centenas de registros ou uma busca que nunca passa da página 10, e quando o usuário realmente precisa pular para uma página específica. Nesses casos a simplicidade compensa.

Cursor é a escolha certa para feeds, timelines, históricos de transações, APIs públicas e qualquer processo que percorra a tabela inteira, como exportações e sincronizações entre sistemas. Uma boa regra prática: se existe a chance de alguém chegar na página mil, ou se perder ou duplicar um registro entre páginas seria um bug, comece com cursor. Migrar uma API de offset para cursor depois que ela já tem clientes é bem mais trabalhoso do que escolher certo no começo.
