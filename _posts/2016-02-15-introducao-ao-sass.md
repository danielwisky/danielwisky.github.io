---
layout: post
section-type: post
title: Introdução ao SASS
subtitle: "O que é SASS? O que é SASS e quais suas vantagens para edição de CSS"
author: "Daniel Wisky"
header-img: "img/post-bg-04.jpg"
---

Sass (Syntactically Awesome StyleSheets): é um pré-processador de CSS, originalmente desenvolvido em Ruby, que interpreta arquivos .scss/.sass e transforma em arquivos .css

Algumas vantagens de utilização:

* Variáveis: são usadas para armazenar informações que funcionam como constantes, sendo definida apenas uma vez, ótimo para guardar as principais cores de um template, fonte padrão, etc.
* Operadores: Os operadores são úteis para cálculos matemáticos como controle de altura e largura, podendo também ser baseado em variáveis.
* Mixins: Os mixins permitem que sejam criados grupos de declarações, como por exemplo classes, que serão reutilizadas no decorrer do código, onde é possível definir parâmetros, possibilitando também o comportamento de herança.

## Mãos à Obra

Vamos utilizar agora uma das funções do Sass que é a possíbilidade unir seletores sem a necessidade de repetir o código, como é feito para declarar um estilo por exemplo dentro da tag <p> que está associada a uma <div> de classe .conteudo.

Agora vamos criar o arquivo `style.scss` com o seguinte conteúdo:

	.conteudo {
	    width: 100%;
	    p {
	        color: red;
	        font-size: 12px;
	    }
	}

Após criação do arquivo, acesse o cmd (Prompt de comando), no diretório aonde o arquivo .scss foi salvo e digite `sass --watch style.scss:style.css`

Será criado um arquivo `style.css` no mesmo diretório contendo o resultado:

	.conteudo {
	  width: 100%; }
	  .conteudo p {
		color: red;
		font-size: 12px; }

Vamos explorar alguns outros recursos disponíveis no Sass. 

### Variáveis

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

Mais informações sobre Sass:
<a href="http://sass-lang.com/install" target="\_blank">instalação</a>, 
<a href="http://sass-lang.com/documentation" target="\_blank">documentação</a>.

Pesquise também outros pré-processadores de css:  
<a href="http://lesscss.org/" target="\_blank">LESS</a>, 
<a href="http://foundation.zurb.com/" target="\_blank">Foundation</a>.

Um grande abraço e até o próximo post!