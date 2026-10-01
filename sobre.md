---
layout: page
title: "Sobre"
description: "Bacharel em Engenharia da Computação e engenheiro de software, hoje em Clojure, Java e Kotlin."
permalink: /sobre/
---

Sou o Daniel: bacharel em Engenharia da Computação (UMESP) e pós-graduado em Engenharia de Software (FIT). No dia a dia, trabalho com desenvolvimento de software, hoje principalmente em Clojure, Java e Kotlin.

Esse blog é onde registro o que vou aprendendo pelo caminho. Às vezes o post nasce de uma decisão de arquitetura que testei na prática e quero deixar documentada, às vezes de um conceito que precisei revisitar do zero pra entender de verdade antes de explicar pra outra pessoa.

### Áreas de interesse

{% assign interesses = "Clean Code,Apache Kafka,noSQL,Inteligência Artificial" | split: "," %}

<div class="tag-cloud">
  {%- for tag in interesses %}
  <a class="tag-chip" href="{{ '/tags/' | relative_url }}#{{ tag | slugify }}">{{ tag }}</a>
  {%- endfor %}
</div>

Clique numa tag pra ver os posts sobre o assunto. Se algum te interessa, ou você só quer trocar uma ideia sobre software, [bora conversar]({{ '/contato/' | relative_url }}).
