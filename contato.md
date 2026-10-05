---
layout: page
title: "Contato"
description: "Fale comigo: dúvidas sobre os posts, uma ideia de tema ou uma conversa sobre software."
permalink: /contato/
plain: true
---

<p class="contact-intro">
  Bora trocar uma ideia? Mande sua dúvida sobre algum post, sugira um tema ou
  só apareça pra dar um "oi": toda mensagem cai direto na minha caixa de
  entrada e eu mesmo respondo.
</p>

<p id="contactStatus" class="form-status" role="status" aria-live="polite"></p>

{%- comment -%}
O action continua no HTML para o form funcionar sem JS (aí quem recebe é a
página de obrigado do próprio Formspree, que o plano gratuito não deixa
trocar). Com JS, o assets/js/contact.js envia por AJAX e leva para /thanks/,
que é uma página nossa.
{%- endcomment -%}
<form id="contactForm" action="https://formspree.io/f/{{ site.formspree_id }}" method="POST"
      data-success="{{ '/thanks/' | relative_url }}" data-recaptcha-site-key="{{ site.recaptcha_site_key }}" novalidate>
  <input type="text" name="_gotcha" style="display:none" />
  <input type="hidden" name="_subject" value="Contato - Blog" />

  <div class="field">
    <label class="field__label" for="nome">Nome</label>
    <input class="field__control" id="nome" type="text" name="nome" placeholder="Digite seu nome..." required aria-describedby="nome-erro" />
    <p class="field__error" id="nome-erro">Nome é obrigatório.</p>
  </div>

  <div class="field">
    <label class="field__label" for="email">E-mail</label>
    <input class="field__control" id="email" type="email" name="_replyto" placeholder="Digite seu e-mail..." required aria-describedby="email-erro" />
    <p class="field__error" id="email-erro">Por favor, insira um endereço de e-mail válido.</p>
  </div>

  <div class="field">
    <label class="field__label" for="mensagem">Mensagem</label>
    <textarea class="field__control" id="mensagem" name="mensagem" placeholder="Digite sua mensagem aqui..." required aria-describedby="mensagem-erro"></textarea>
    <p class="field__error" id="mensagem-erro">Mensagem é obrigatória.</p>
  </div>

  <button class="button button--primary" type="submit">
    Enviar
    {% include icon.html name="paper-plane" %}
  </button>
</form>

<div class="contact-divider"><span>ou</span></div>

<div>
  <a class="button button--ghost contact-alt" href="https://www.linkedin.com/in/danielwisky" target="_blank" rel="noopener noreferrer">
    {% include icon.html name="linkedin" %}
    Fala comigo no LinkedIn
  </a>
</div>
