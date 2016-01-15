---
layout: post
section-type: post
title: HTML5 - Web Storage
category: geral
tags: [ 'html5', 'webstorage' ]
---

Web Storage &eacute; um recurso do HTML 5 para armazenamento de dados localmente no navegador.

Embora ainda possamos utilizar os cookies para armazenar dados no navegador, existem algumas desvantagens em sua utiliza&ccedil;&atilde;o.

Desvantagens do uso de Cookies:

* O limite de armazenamento de Cookies em navegadores web &eacute; limitado em 4KB.
* Os cookies s&atilde;o enviados com cada solicita&ccedil;&atilde;o HTTP, atrasando assim o desempenho de aplica&ccedil;&otilde;es web.

## HTML5 - Web Storage

Os dados s&atilde;o armazenados em forma de chave/valor, permitindo o armazenamento de at&eacute; 10 MB de dados por dom&iacute;nio. Ao contr&aacute;rio de cookies, os dados armazenados n&atilde;o s&atilde;o inclu&iacute;dos com cada solicita&ccedil;&atilde;o HTTP.

Tipos de armazenamento:

* O armazenamento local (localStorage): Armazena dados sem data de validade. Os dados estar&atilde;o dispon&iacute;veis mesmo quando o navegador &eacute; fechado.
* Armazenamento de sess&atilde;o (sessionStorage): Armazena dados para uma sess&atilde;o. Os dados ser&atilde;o apagados assim que o usu&aacute;rio fechar o navegador.

Exemplo:

	/* 
	 * VERIFICANDO O SUPORTE AO RECURSO
	 * IE7 e versoes mais antigas nao suportam Web Storage. 
	 * Todos os outros navegadores como o Chrome, Opera, Firefox, Safari e IE8+ tem suporte Web Storage.
	 */
	if (typeof(Storage) !== "undefined") {
		 // codigo localStorage/sessionStorage
	} else {
		// navegador noo suporta HTML5 - Web Storage
	}
	
Utilizamos o `setItem('key','value')` para armazenar uma informa&ccedil;&atilde;o.

	/*
	 * armazenando o valor [Daniel Wisky] na chave [nome]
	 */
	localStorage.setItem("nome", "Daniel Wisky"); // ou sessionStorage.setItem("nome", "Daniel Wisky");

Utilizamos o `getItem('key')` para recuperar uma informa&ccedil;&atilde;o armazenada.

	/*
	 * recuperando o valor da chave [nome]
	 */
	localStorage.getItem("nome"); // ou sessionStorage.getItem("nome");

Utilizamos o `removeItem('key')` para remover uma informa&ccedil;&atilde;o armazenada.

	/*
	 * removendo o valor armazenado na chave [nome]
	 */
	localStorage.removeItem("nome"); // ou sessionStorage.removeItem("nome");

Para saber mais: 
<a href="http://tableless.com.br/web-storage-html5/" target="\_blank">tableless</a>, 
<a href="http://www.w3schools.com/html/html5_webstorage.asp" target="\_blank">w3schools</a>.

Um grande abra&ccedil;o e at&eacute; o pr&oacute;ximo post!