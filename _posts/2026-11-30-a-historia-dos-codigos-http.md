---
layout: post
title: "404, 418 e 451: as histórias por trás dos erros da web"
subtitle: "Não, o 404 não vem de uma sala no CERN. De onde vêm os códigos HTTP, por que o 404 era só o quinto da fila e o que um bule de chá e um livro de Ray Bradbury fazem na especificação"
tags: [APIs, História]
---

Fiz um vídeo sobre esse assunto. Se preferir assistir, ele está aqui embaixo. Se preferir ler, o post conta a mesma história com um pouco mais de detalhe e os links para as fontes.

<div class="video-container">
    <iframe src="https://www.youtube-nocookie.com/embed/FTEeTeVFGgQ" title="404, 418 e 451: as histórias por trás dos erros da web" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## O mito da sala 404

Talvez você já tenha ouvido esta: o erro 404 teria esse nome por causa de uma sala 404 no CERN, onde ficavam os primeiros servidores da web. Quando alguém pedia um arquivo que não existia, a resposta seria "sala 404: arquivo não encontrado". É uma história ótima, e é exatamente por isso que ela circula tanto.

Só que é mito. Robert Cailliau, que criou a web junto com Tim Berners-Lee no CERN, já disse que o 404 não tem nada a ver com nenhuma sala ou lugar do CERN. A explicação de verdade é bem menos romântica, e está escrita nas próprias especificações do HTTP.

## O primeiro dígito diz o tipo de resposta

Todo código de status HTTP tem três dígitos, e o primeiro define a classe da resposta. A especificação atual, a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#section-15), lista cinco:

| Classe | Significado |
|---|---|
| `1xx` | Informação: a requisição foi recebida e o processamento continua |
| `2xx` | Sucesso |
| `3xx` | Redirecionamento: o cliente precisa fazer mais alguma coisa, como ir para outro endereço |
| `4xx` | Erro do cliente |
| `5xx` | Erro do servidor |

O `1xx` chegou depois. Ele não aparece no rascunho de 1992 que vou mostrar a seguir, e o HTTP/1.0, publicado como [RFC 1945](https://www.rfc-editor.org/rfc/rfc1945) em maio de 1996, ainda dizia que essa classe não era usada e ficava reservada para o futuro.

E os outros dois dígitos? A RFC 9110 é direta: eles não têm papel nenhum de classificação. O 04 do 404 não quer dizer "não encontrado" em nenhum código secreto. Ele só identifica qual erro de cliente é aquele.

## O 404 era só o quinto da fila

Para ver de onde vieram os números, vale voltar ao [Basic HTTP as defined in 1992](https://www.w3.org/Protocols/HTTP/HTTP2.html), um rascunho assinado por Tim Berners-Lee. A página de [códigos de status](https://www.w3.org/Protocols/HTTP/HTRESP.html) desse rascunho lista os erros do cliente em sequência:

| Código | Nome no rascunho |
|---|---|
| `400` | Bad request |
| `401` | Unauthorized |
| `402` | PaymentRequired |
| `403` | Forbidden |
| `404` | Not found |

É isso. O 404 não carrega simbologia nenhuma: era o quinto item da lista de erros do cliente. Se a ordem tivesse sido outra, a gente estaria vendo páginas "403 Not Found" até hoje.

A mesma página guarda outra curiosidade. Numa nota de 19 de setembro de 1994, ela propõe o 502 como "Service temporarily overloaded" e o 503 como "Gateway timeout", ambos marcados "TO BE DISCUSSED". Hoje esses significados mudaram: a RFC 9110 define o 502 como Bad Gateway, o 503 como Service Unavailable e o 504 como Gateway Timeout.

### O que o 404 significa hoje

A definição atual tem um detalhe que pouca gente nota. Segundo a RFC 9110, o 404 indica que o servidor não encontrou uma representação para o recurso pedido **ou não quer revelar que ela existe**. Ou seja, devolver 404 para um recurso que existe, mas que o usuário não pode ver, é um uso previsto pela especificação. Assim o servidor não entrega nem a informação de que aquele dado existe.

A mesma seção diz que o 404 não informa se a ausência é temporária ou permanente. Quando o servidor sabe que o recurso sumiu de vez, o código preferido é o **410 Gone**.

## O 402, que espera desde 1992

O 402 Payment Required tem uma história curiosa. No rascunho de 1992, ele já estava lá, com a ideia de que o servidor informaria os esquemas de cobrança aceitos e o cliente poderia tentar de novo com um cabeçalho `ChargeTo`. A web mal tinha nascido e já pensava em cobrar.

A ideia nunca virou padrão. Na RFC 9110, de 2022, a definição do 402 cabe em uma frase só: o código é **reservado para uso futuro**.

## 418 I'm a teapot

Em 1º de abril de 1998, saiu a [RFC 2324](https://www.rfc-editor.org/rfc/rfc2324), que especifica o HTCPCP, o *Hyper Text Coffee Pot Control Protocol*: um protocolo para controlar cafeteiras pela internet. É uma piada de primeiro de abril publicada como RFC de verdade, e ela define um código de erro novo:

> Any attempt to brew coffee with a teapot should result in the error code "418 I'm a teapot".

Qualquer tentativa de fazer café num bule de chá deve resultar em "418 I'm a teapot". A RFC ainda brinca que o corpo da resposta pode ser *short and stout*, baixinho e gordinho, como diz a cantiga infantil inglesa sobre um bule de chá.

O problema é que a piada pegou, e o 418 acabou implementado de brincadeira em muito lugar. Pegou tanto que a RFC 9110, de junho de 2022, tem uma seção chamada **418 (Unused)**. Ela explica que o código foi usado como piada vezes demais para servir para qualquer outra coisa no futuro. Um código HTTP aposentado por excesso de humor.

## 451 Unavailable For Legal Reasons

O último da lista é o mais literário. A [RFC 7725](https://www.rfc-editor.org/rfc/rfc7725), de fevereiro de 2016, criou o **451 Unavailable For Legal Reasons**, para quando o servidor nega acesso a um recurso como consequência de uma exigência legal.

O número não é por acaso. É uma referência a *Fahrenheit 451*, o romance de Ray Bradbury em que os livros são proibidos e queimados. A RFC não explica a escolha no texto, mas a seção de agradecimentos termina com uma linha que diz tudo:

> Thanks also to Ray Bradbury.

## O que fica

Os códigos HTTP parecem cheios de mistério, mas a regra é simples: o primeiro dígito diz o tipo de resposta, e os outros dois são só a posição na lista. O 404 virou o erro mais famoso da web por ser o quinto da fila, não por causa de uma sala no CERN.

O mais divertido é que, mesmo num padrão tão sério, sobrou espaço para um pagamento que nunca chegou, um bule de chá aposentado e uma homenagem a um livro sobre censura.

Fontes:
- [Basic HTTP as defined in 1992 (W3C)](https://www.w3.org/Protocols/HTTP/HTTP2.html)
- [Status codes in HTTP (W3C)](https://www.w3.org/Protocols/HTTP/HTRESP.html)
- [RFC 1945: Hypertext Transfer Protocol, HTTP/1.0](https://www.rfc-editor.org/rfc/rfc1945)
- [RFC 2324: Hyper Text Coffee Pot Control Protocol](https://www.rfc-editor.org/rfc/rfc2324)
- [RFC 7725: An HTTP Status Code to Report Legal Obstacles](https://www.rfc-editor.org/rfc/rfc7725)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
