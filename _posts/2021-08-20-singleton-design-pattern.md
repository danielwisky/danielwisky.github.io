---
layout: post
section-type: post
title: Singleton Design Pattern
subtitle: "Padrões de Projeto"
author: "Daniel Wisky"
header-img: "img/default-bg.jpg"
---

## Propósito

O Singleton é um padrão de projeto criacional que permite a você garantir que uma classe tenha apenas uma instância, enquanto provê um ponto de acesso global para essa instância.

## Problema

O padrão Singleton resolve dois problemas de uma só vez, violando o princípio de responsabilidade única:

1. Garantir que uma classe tenha apenas uma única instância. Por que alguém iria querer controlar quantas instâncias uma classe tem? A razão mais comum para isso é para controlar o acesso a algum recurso compartilhado—por exemplo, uma base de dados ou um arquivo. 

   Funciona assim: imagine que você criou um objeto, mas depois de um tempo você decidiu criar um novo. Ao invés de receber um objeto fresco, você obterá um que já foi criado.

2. Fornece um ponto de acesso global para aquela instância. Se lembra daquelas variáveis globais que você (tá bom, eu) usou para guardar alguns objetos essenciais? Embora sejam muito úteis, elas também são muito inseguras uma vez que qualquer código pode potencialmente sobrescrever os conteúdos daquelas variáveis e quebrar a aplicação.

   Assim como uma variável global, o padrão Singleton permite que você acesse algum objeto de qualquer lugar no programa. Contudo, ele também protege aquela instância de ser sobrescrita por outro código.

   Há outro lado para esse problema: você não quer que o código que resolve o problema #1 fique espalhado por todo seu programa. É muito melhor tê-lo dentro de uma classe, especialmente se o resto do seu código já depende dela.

Hoje em dia, o padrão Singleton se tornou tão popular que as pessoas podem chamar algo de singleton mesmo se ele resolve apenas um dos problemas listados.

## Exemplo de Implementação

Segue abaixo um exemplo de implementação em Java utilizando o Padrão Singleton.

	public class Singleton {

	    private Singleton() {}

        private static class SingletonHolder {
        	private static final Singleton INSTANCE = new Singleton();
        }

        public static Singleton getInstance() {
            return SingletonHolder.INSTANCE;
        }
	}

Fonte:
<a href="http://localhost:4000/2021/08/20/singleton-design-pattern/" target="\_blank">Refactoring</a>.

Para saber mais:
<a href="https://sourcemaking.com/design_patterns/singleton" target="\_blank">Singleton Design Pattern</a>.

Um grande abraço e até o próximo post!