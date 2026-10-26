---
layout: page
title: "Sobre"
description: "Bacharel em Engenharia da Computação e engenheiro de software, hoje em Clojure, Java e Kotlin."
permalink: /sobre/
---

Sou o Daniel: bacharel em Engenharia da Computação (UMESP), pós-graduado em Engenharia de Software (FIT) e em Arquitetura de Software e Soluções (XP Educação). No dia a dia, trabalho com desenvolvimento de software, hoje principalmente em Clojure, Java e Kotlin.

Esse blog é onde registro o que vou aprendendo pelo caminho. Às vezes o post nasce de uma decisão de arquitetura que testei na prática e quero deixar documentada, às vezes de um conceito que precisei revisitar do zero pra entender de verdade antes de explicar pra outra pessoa.

### Áreas de interesse

{% capture tag_data %}{% for tag in site.tags %}{{ tag[1].size | plus: 1000 }}:{{ tag[0] }}|{% endfor %}{% endcapture %}
{% assign tag_entries = tag_data | split: "|" | sort | reverse %}
{% assign top_tags = tag_entries | slice: 0, 4 %}

<div class="tag-cloud tag-cloud--compact">
  <div class="tag-cloud__chips">
    {%- for entry in top_tags %}
    {%- assign tag_name = entry | split: ":" | last %}
    {%- assign tag_count = entry | split: ":" | first | minus: 1000 %}
    <a class="tag-chip tag-chip--main" href="{{ '/tags/' | relative_url }}#{{ tag_name | slugify }}">{{ tag_name }}<span class="tag-cloud__count">{{ tag_count }}</span></a>
    {%- endfor %}
  </div>
</div>

Clique numa tag pra ver os posts sobre o assunto. Se algum te interessa, ou você só quer trocar uma ideia sobre software, [bora conversar]({{ '/contato/' | relative_url }}).
