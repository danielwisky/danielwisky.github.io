---
layout: post
title: "Versionamento de API: como evoluir sem quebrar quem te consome"
subtitle: "Toda mudança parece inofensiva até alguém descobrir que ela quebrou em produção"
tags: [APIs, Arquitetura]
---

Toda API que vive o suficiente precisa mudar. Um campo novo, uma regra de negócio diferente, um tipo de dado que precisa trocar. O problema nunca é a mudança em si, é que alguém, em algum lugar, já construiu um cliente que depende exatamente do comportamento atual, e nem sempre esse alguém está disponível pra avisar quando algo quebra. Versionamento de API existe pra resolver esse conflito: como o serviço evolui sem forçar todo consumidor a mudar no mesmo instante.

## O que é uma mudança quebradora e o que não é

Antes de escolher uma estratégia de versionamento, vale separar os dois tipos de mudança, porque só um deles exige uma versão nova.

Mudanças aditivas não quebram nada: adicionar um campo novo na resposta, aceitar um parâmetro opcional a mais na requisição, criar um endpoint novo. Um cliente bem escrito ignora campos que não conhece e continua funcionando sem perceber a diferença.

Mudanças quebradoras são as que exigem atenção: remover um campo, renomear um campo, mudar o tipo de um valor, tornar um parâmetro opcional em obrigatório, mudar o código de status de uma resposta, ou alterar o significado de um campo que já existia. Qualquer uma dessas muda o contrato que o cliente assumiu como verdade, e é exatamente aqui que entra a decisão de versionar.

```java
// aditivo: cliente antigo ignora o campo novo, nada quebra
public record Pedido(String id, BigDecimal total, String moeda) {}

// quebrador: cliente antigo esperava "total" como String
public record Pedido(String id, BigDecimal total) {}
```

## As três formas mais comuns de versionar

**Versionamento na URI** é o mais direto de entender e o mais fácil de testar manualmente, porque a versão fica visível na própria rota:

```
GET /v1/pedidos/123
GET /v2/pedidos/123
```

A desvantagem é que a URI deixa de representar só o recurso, passa a carregar também uma decisão de implementação, e cada versão nova geralmente significa duplicar controllers inteiros, mesmo quando só um campo mudou.

**Versionamento por header** mantém a URI estável e move a decisão para um header customizado ou para o próprio `Accept`:

```
GET /pedidos/123
Accept: application/vnd.empresa.pedido.v2+json
```

Isso é mais alinhado com a ideia de que a URI identifica um recurso, não uma versão dele, mas tem um custo real de descoberta: um desenvolvedor que só olha a URL numa documentação ou num log não sabe qual versão está em jogo, precisa inspecionar os headers.

**Versionamento por campo no corpo** é o mais raro dos três, mas aparece em APIs que já têm um envelope de mensagem padronizado, como sistemas de mensageria:

```json
{ "schemaVersion": 2, "payload": { "id": "123", "total": 450.0 } }
```

Na prática, a escolha entre URI e header costuma ser menos sobre qual é tecnicamente superior e mais sobre qual o time já está acostumado a operar. Uma API pública que precisa de documentação simples de consumir geralmente se beneficia da URI. Uma API interna, com poucos consumidores e um time de plataforma que já versiona payloads, tende a preferir o header.

## Compatibilidade retroativa é a estratégia que evita versionar

A técnica mais subestimada em versionamento de API é simplesmente não precisar de uma versão nova. Boa parte das mudanças que parecem exigir um `v2` podem ser desenhadas de um jeito aditivo desde o início:

- Em vez de remover um campo, marcá-lo como depreciado e manter os dois por um tempo, populando ambos até que os consumidores migrem.
- Em vez de mudar o tipo de um campo existente, adicionar um campo novo com o tipo correto e deixar o antigo como espelho temporário.
- Em vez de tornar um parâmetro obrigatório, aplicar um valor padrão sensato quando ele vier ausente.

```java
@Deprecated(since = "2024-01", forRemoval = true)
public BigDecimal total() {
    return totalDecimal();
}

public BigDecimal totalDecimal() {
    return total;
}
```

Esse tipo de transição custa mais trabalho de manutenção no curto prazo, porque o serviço carrega os dois caminhos ao mesmo tempo, mas evita o custo bem maior de manter versões inteiras de API em paralelo, cada uma com seu próprio ciclo de testes e deploy.

## Depreciação precisa ter prazo e sinalização

Criar uma versão nova sem um plano de aposentadoria da versão antiga só empurra o problema. Uma API com `v1`, `v2` e `v3` ativas ao mesmo tempo, sem data de desligamento de nenhuma, multiplica o esforço de qualquer mudança futura por três.

A prática que funciona é sinalizar a depreciação de forma que o cliente consiga automatizar a reação a ela, não só ler num changelog que ninguém vai abrir:

```
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: <https://docs.empresa.com/migracao-v2>; rel="deprecation"
```

O header `Sunset` tem um RFC próprio (RFC 8594), e o `Deprecation` segue uma proposta do IETF amplamente adotada mesmo sem ainda ter virado RFC formal. Juntos, permitem que o cliente detecte programaticamente que está usando algo que vai parar de funcionar numa data conhecida, em vez de descobrir isso só quando a chamada já está retornando erro.

## A régua prática

Antes de criar uma versão nova, vale perguntar se a mudança realmente precisa quebrar alguém, porque a resposta é não com mais frequência do que parece. Quando a resposta é sim, a escolha entre URI, header ou outro mecanismo importa menos do que ter desde o início um plano de depreciação com prazo definido e sinalização clara. Uma API que versiona bem não é a que nunca muda, é a que muda sem pegar ninguém de surpresa.
