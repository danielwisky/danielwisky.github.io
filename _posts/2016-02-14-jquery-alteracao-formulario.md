---
layout: post
title: jQuery - Verificar alteração no formulário HTML
cover-img: /assets/img/default-bg
tags: [jQuery]
---

A função para verificar se houve alteração no formulário HTML, pode ser muito útil, como comunicar o usuário a possível perda de dados e até mesmo evitar que o formulário seja enviado, sem que ao menos, alguma informação tenha sido alterada.

Utilizando a função abaixo, podemos verificar se algum campo do formulário foi alterado.

	$("#myform :input").change(function() {
	   $("#myform").data("changed",true);
	});

Antes de enviar as informações, verificamos se o formulário foi alterado:

	if ($("#myform").data("changed")) {
	   // submit the form
	}

Caso necessário, podemos transformar a função acima em um plugin do jQuery, e reutilizar em diversas partes do sistema.

	jQuery.fn.extend({
		trackChanges: function() {
			$(":input", this).change(function() {
				$(this.form).data("changed", true);
			});
		},
		isChanged: function() {
			return this.data("changed");
		}
	});

Iniciando a verificação.

	$("#myform").trackChanges();

Verificando se o formulário foi alterado.

	if ($("#myform").isChanged()) {
	   // ...
	}

Fonte: 
<a href="http://stackoverflow.com/questions/959670/generic-way-to-detect-if-html-form-is-edited" target="\_blank">stackoverflow</a>.

Um grande abraço e até o próximo post!