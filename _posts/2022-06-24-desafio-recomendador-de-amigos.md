---
layout: post
title: Desafio Recomendador de Amigos
subtitle: Desafio de programação para construção de um sistema de recomendação de amigos
tags: [desafios, programação]
---

Você deve implementar um sistema que permita que uma pessoa obtenha sugestões de novos amigos se baseando nas amizades já existentes. 

Você deve criar uma aplicação que armazene dados em memória (não utilize nenhum banco de dados externo, utilize variáveis globais) e implemente as seguintes rotas:

## Create Person

`[POST] http://localhost/person`

Esta rota deve receber um CPF e um nome, e realizar o cadastro do usuário.
Deve retornar erro com status code 400 caso o usuário já esteja cadastrado ou o CPF informado tenha tamanho diferente de 11 dígitos numéricos (Não implemente qualquer algoritmo validador de CPF).

Entrada:

```
{
    "cpf": "12345678909",
    "name": "Joaozinho"
}
```

Saída:
* Deve retornar código HTTP 200 em caso de sucesso.
* Deve retornar código HTTP 400 caso o usuário cadastrado já exista ou caso o CPF informado não consista de 11 dígitos numéricos

## Get Person

`[GET] http://localhost/person/:CPF`

Esta rota deve receber um CPF e, se o usuário existir, retornar seus dados, caso contrário, deve retornar erro com status code 404.

## Clean

`[DELETE] http://localhost/clean`

Esta rota deve limpar os dados em memória.

## Create Relationship

`[POST] http://localhost/relationship`

Esta rota deve receber dois CPFs e, caso os dois usuários existam, criar um relacionamento entre eles, caso contrário, deve retornar erro com status code 404.

Entrada:

```
{
    "cpf1": "11111111111",
    "cpf2": "22222222222"
}
```

Saída:
* Deve retornar código HTTP 200 em caso de sucesso.
* Deve retornar código HTTP 404 caso um dos usuários não exista

## Get Recommendations

`[GET] http://localhost/recommendations/:CPF`

Deve receber um CPF e retornar erro com status code 400 se o CPF informado não consistir em 11 dígitos numéricos, erro com status code 404 se o usuário correspondente não existir. 

Caso o CPF corresponda a um usuário cadastrado, o retorno deve ser um Array contendo a lista de CPFs de todos os amigos dos amigos do usuário informado que não são seus amigos, ordenada de maneira decrescente pela relevância, ou seja, deve-se verificar quantos amigos tem relacionamento com a pessoa, e as pessoas com mais relacionamentos com amigos devem ser informados primeiro.

<center>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="151px" height="251px" viewBox="-0.5 -0.5 151 251" content="&lt;mxfile host=&quot;www.draw.io&quot; modified=&quot;2022-06-24T13:42:27.818Z&quot; agent=&quot;5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36&quot; etag=&quot;FetW0i1nEyMYEFaBdmJ_&quot; version=&quot;20.0.3&quot; type=&quot;device&quot;&gt;&lt;diagram id=&quot;KAWuq6KrpY3d5XPo_5gN&quot; name=&quot;Page-1&quot;&gt;1VhNc5swEP01HNsBZGL76GCnOSSXup9HDVoDqWCpEF/99RVGMmaYeNy0DeRk9mmFdt9bnrEt4if1B0Gz6BEZcMu1WW2RreW6jk1W6qNFmg7xyLoDQhEzndQD+/gXmJ0aLWIG+SBRInIZZ0MwwDSFQA4wKgRWw7QD8uGpGQ1hBOwDysfo15jJqENX7rLH7yEOI3Oyc6P7S6hJ1p3kEWVYnUFkZxFfIMruKql94C15hpdu390zq6fCBKTymg1P2y+bNeb7h/uflXhsPn38jOW7G12bbEzDwFT/OkQhIwwxpXzXo7c9+oCYqTRHgU8gZaPlo4VEBUUy4XpVlSiabyqw33sm/N6GJtjWg6jRUVCIEtjpJmzTKqrCFFPokLuYc53ctdLW/yxDGsqxEAFcoMVMGhUhyAt5i5OO6gEATEAVr/YJ4FTG5bAOqicxPOX1YqkLrdcfaLect3a5FPgDfOQoFMLgQAsu34CmZEpN9X1Lygt90makchXFEvYZPXZbKdsd6kXzrDPCQ1y3PGsOSxAS6sssjrs2GzxtYtrFlzqseks0GdGZGxrsn9PkjmjazYEm1x7SNDlP6xdYhMAiZccH1H5dw3hFLyBXeoE7qRfYL1Dvb/RyBmr14s3sy/la8bwpxSMjh/Ln6FDO1A61mvdLzFQzvngLM74YzfjtHGbcmduMeyOetnPk6T++raiw/6F7XDv7u4DsfgM=&lt;/diagram&gt;&lt;/mxfile&gt;"><defs/><g><path d="M 75 50 Q 75 75 50 75 Q 25 75 25 100" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 75 50 Q 75 75 100 75 Q 125 75 125 100" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><rect x="50" y="0" width="50" height="50" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 48px; height: 1px; padding-top: 25px; margin-left: 51px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">A</div></div></div></foreignObject><text x="75" y="29" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">A</text></switch></g><rect x="100" y="200" width="50" height="50" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 48px; height: 1px; padding-top: 225px; margin-left: 101px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">E</div></div></div></foreignObject><text x="125" y="229" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">E</text></switch></g><path d="M 125 150 L 125 200" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 100 125 Q 75 125 75 175 Q 75 225 50 225" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><rect x="100" y="100" width="50" height="50" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 48px; height: 1px; padding-top: 125px; margin-left: 101px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">C</div></div></div></foreignObject><text x="125" y="129" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">C</text></switch></g><path d="M 25 150 Q 25 150 25 200" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><rect x="0" y="100" width="50" height="50" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 48px; height: 1px; padding-top: 125px; margin-left: 1px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">B</div></div></div></foreignObject><text x="25" y="129" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">B</text></switch></g><rect x="0" y="200" width="50" height="50" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 48px; height: 1px; padding-top: 225px; margin-left: 1px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">D</div></div></div></foreignObject><text x="25" y="229" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">D</text></switch></g></g><switch><g requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"/><a transform="translate(0,-5)" xlink:href="https://www.diagrams.net/doc/faq/svg-export-text-problems" target="_blank"><text text-anchor="middle" font-size="10px" x="50%" y="100%">Text is not SVG - cannot display</text></a></switch></svg>
</center>

Neste caso, assumindo que a entrada seja A, o retorno deve ser exatamente [D, E], nesta ordem, pois 2 amigos de A tem amizade com D, e apenas um amigo de A tem amizade com E.

Um grande abraço e até o próximo post!
