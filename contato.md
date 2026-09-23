---
layout: page
title: "Contato"
permalink: /contato/
plain: true
---

<p id="contactStatus" class="form-status" role="status" aria-live="polite"></p>

{%- comment -%}
O action continua no HTML para o form funcionar sem JS (aí quem recebe é a
página de obrigado do próprio Formspree, que o plano gratuito não deixa
trocar). Com JS, o assets/js/contact.js envia por AJAX e leva para /thanks/,
que é uma página nossa.
{%- endcomment -%}
<form id="contactForm" action="https://formspree.io/f/{{ site.formspree_id }}" method="POST"
      data-success="{{ '/thanks/' | relative_url }}" novalidate>
  <input type="text" name="_gotcha" style="display:none" />
  <input type="hidden" name="_subject" value="Contato - Blog" />

  <div class="field">
    <label class="field__label" for="nome">Nome</label>
    <input class="field__control" id="nome" type="text" name="nome" placeholder="Digite seu nome..." required />
    <p class="field__error">Nome é obrigatório.</p>
  </div>

  <div class="field">
    <label class="field__label" for="email">E-mail</label>
    <input class="field__control" id="email" type="email" name="_replyto" placeholder="Digite seu e-mail..." required />
    <p class="field__error">Por favor, insira um endereço de e-mail válido.</p>
  </div>

  <div class="field">
    <label class="field__label" for="mensagem">Mensagem</label>
    <textarea class="field__control" id="mensagem" name="mensagem" placeholder="Digite sua mensagem aqui..." required></textarea>
    <p class="field__error">Mensagem é obrigatória.</p>
  </div>

  <button class="button button--primary" type="submit">
    Enviar
    <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
  </button>
</form>
