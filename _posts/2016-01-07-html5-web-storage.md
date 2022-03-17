---
layout: post
title: HTML5 - Web Storage
subtitle: Web Storage é um recurso do HTML 5 para armazenamento de dados localmente no navegador.
cover-img: /assets/img/default-bg.jpg
tags: [HTML5]
---

Web Storage é um recurso do HTML 5 para armazenamento de dados localmente no navegador.

Embora ainda possamos utilizar os cookies para armazenar dados no navegador, existem algumas desvantagens em sua utilização.

Desvantagens do uso de Cookies:

* O limite de armazenamento de Cookies em navegadores web é limitado em 4KB.
* Os cookies são enviados com cada solicitação HTTP, atrasando assim o desempenho de aplicações web.

## HTML5 - Web Storage

Os dados são armazenados em forma de chave/valor, permitindo o armazenamento de até 10 MB de dados por domínio. Ao contrário de cookies, os dados armazenados não são incluídos com cada solicitação HTTP.

Tipos de armazenamento:

* O armazenamento local (localStorage): Armazena dados sem data de validade. Os dados estarão disponíveis mesmo quando o navegador é fechado.
* Armazenamento de sessão (sessionStorage): Armazena dados para uma sessão. Os dados serão apagados assim que o usuário fechar o navegador.

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
	
Utilizamos o `setItem('key','value')` para armazenar uma informação.

	/*
	 * armazenando o valor [Daniel Wisky] na chave [nome]
	 */
	localStorage.setItem("nome", "Daniel Wisky"); // ou sessionStorage.setItem("nome", "Daniel Wisky");

Utilizamos o `getItem('key')` para recuperar uma informação armazenada.

	/*
	 * recuperando o valor da chave [nome]
	 */
	localStorage.getItem("nome"); // ou sessionStorage.getItem("nome");

Utilizamos o `removeItem('key')` para remover uma informação armazenada.

	/*
	 * removendo o valor armazenado na chave [nome]
	 */
	localStorage.removeItem("nome"); // ou sessionStorage.removeItem("nome");

Para saber mais: 
<a href="http://tableless.com.br/web-storage-html5/" target="\_blank">tableless</a>, 
<a href="http://www.w3schools.com/html/html5_webstorage.asp" target="\_blank">w3schools</a>.

Um grande abraço e até o próximo post!