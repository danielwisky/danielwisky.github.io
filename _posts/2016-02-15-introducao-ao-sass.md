---
layout: post
section-type: post
title: Introdu&ccedil;&atilde;o ao SASS
category: geral
tags: ['sass','css']
---

Sass (Syntactically Awesome StyleSheets): &eacute; um pr&eacute;-processador de CSS, originalmente desenvolvido em Ruby, que interpreta arquivos .scss/.sass e transforma em arquivos .css

Algumas vantagens de utiliza&ccedil;&atilde;o:

* Vari&aacute;veis: s&atilde;o usadas para armazenar informa&ccedil;&otilde;es que funcionam como constantes, sendo definida apenas uma vez, &oacute;timo para guardar as principais cores de um template, fonte padr&atilde;o, etc.
* Operadores: Os operadores s&atilde;o &uacute;teis para c&aacute;lculos matem&aacute;ticos como controle de altura e largura, podendo tamb&eacute;m ser baseado em vari&aacute;veis.
* Mixins: Os mixins permitem que sejam criados grupos de declara&ccedil;&otilde;es, como por exemplo classes, que ser&atilde;o reutilizadas no decorrer do c&oacute;digo, onde &eacute; poss&iacute;vel definir par&acirc;metros, possibilitando tamb&eacute;m o comportamento de heran&ccedil;a.

## M&atilde;os &agrave; Obra

Vamos utilizar agora uma das fun&ccedil;&otilde;es do Sass que &eacute; a poss&iacute;bilidade unir seletores sem a necessidade de repetir o c&oacute;digo, como &eacute; feito para declarar um estilo por exemplo dentro da tag &lt;p&gt; que est&aacute; associada a uma &lt;div&gt; de classe .conteudo.

Agora vamos criar o arquivo `style.scss` com o seguinte conte&uacute;do:

	.conteudo {
	    width: 100%;
	    p {
	        color: red;
	        font-size: 12px;
	    }
	}

Ap&oacute;s cria&ccedil;&atilde;o do arquivo, acesse o cmd (Prompt de comando), no diret&oacute;rio aonde o arquivo .scss foi salvo e digite `sass --watch style.scss:style.css`

Ser&aacute; criado um arquivo `style.css` no mesmo diret&oacute;rio contendo o resultado:

	.conteudo {
	  width: 100%; }
	  .conteudo p {
		color: red;
		font-size: 12px; }

Vamos explorar alguns outros recursos dispon&iacute;veis no Sass. 

### Vari&aacute;veis

	$main-color: #ff0000;
	.main {
	    background: $main-color;
	}
	
### Unindo popriedades

	.texto {
	    font: {
		  family: arial;
		  size: 30em;
		  weight: bold;
	  }
	}

Resultado (arquivo css):

	.texto {
	  font-family: Arial;
	  font-size: 30em;
	  font-weight: bold; }
	  
### pseudo-elementos

	a {
	    color: #ce4dd6;
	    &:hover { color: #ffb3ff;}
	    &:visited { color: #c458cb; }
	}

Resultado (arquivo css):

	a {
	  color: #ce4dd6; }
	  a:hover {
		color: #ffb3ff; }
	  a:visited {
		color: #c458cb; }

Mais informa&ccedil;&otilde;es sobre Sass:
<a href="http://sass-lang.com/install" target="\_blank">instala&ccedil;&atilde;o</a>, 
<a href="http://sass-lang.com/documentation" target="\_blank">documenta&ccedil;&atilde;o</a>.

Pesquise tamb&eacute;m outros pr&eacute;-processadores de css:  
<a href="http://lesscss.org/" target="\_blank">LESS</a>, 
<a href="http://foundation.zurb.com/" target="\_blank">Foundation</a>.

Um grande abra&ccedil;o e at&eacute; o pr&oacute;ximo post!