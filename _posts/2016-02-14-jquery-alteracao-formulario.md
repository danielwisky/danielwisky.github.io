---
layout: post
section-type: post
title: jQuery - Verificar se houve altera&ccedil;&atilde;o no formul&aacute;rio HTML
category: geral
tags: [ 'jquery']
---

A fun&ccedil;&atilde;o para verificar se houve altera&ccedil;&atilde;o no formul&aacute;rio HTML, pode ser muito &uacute;til, como comunicar o usu&aacute;rio a poss&iacute;vel perda de dados e at&eacute; mesmo evitar que o formul&aacute;rio seja enviado, sem que ao menos, alguma informa&ccedil;&atilde;o tenha sido alterada.

Utilizando a fun&ccedil;&atilde;o abaixo, podemos verificar se algum campo do formul&aacute;rio foi alterado.

	$("#myform :input").change(function() {
	   $("#myform").data("changed",true);
	});

Antes de enviar as informa&ccedil;&otilde;es, verificamos se o formul&aacute;rio foi alterado:

	if ($("#myform").data("changed")) {
	   // submit the form
	}

Caso necess&aacute;rio, podemos transformar a fun&ccedil;&atilde;o acima em um plugin do jQuery, e reutilizar em diversas partes do sistema.

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

Iniciando a verifica&ccedil;&atilde;o.

	$("#myform").trackChanges();

Verificando se o formul&aacute;rio foi alterado.

	if ($("#myform").isChanged()) {
	   // ...
	}

Fonte: 
<a href="http://stackoverflow.com/questions/959670/generic-way-to-detect-if-html-form-is-edited" target="\_blank">stackoverflow</a>.

Um grande abra&ccedil;o e at&eacute; o pr&oacute;ximo post!