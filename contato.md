---
layout: page
title: "Contato"
subtitle: "Pouco conhecimento faz com que as pessoas se sintam orgulhosas. Muito conhecimento, com que se sintam humildes.<br/>(Leonardo DaVinci)"
cover-img: "/assets/img/contato-bg.jpg"
---

<p>Caso queira entrar em contato, por favor, preencha o formulário abaixo e envie sua mensagem.</p>
<div class="my-5">
  <form id="contactForm" action="https://formspree.io/f/{{ site.email }}" class="needs-validation" method="POST" novalidate>
    <input type="text" name="_gotcha" style="display:none" />
    <input type="hidden" name="_subject" value="Contato - Blog" />
    <input type="hidden" name="_next" value="{{ site.baseurl }}/obrigado/" />
    <div class="form-floating">
      <input class="form-control" id="nome" type="text" name="nome" placeholder="Digite seu nome..." required />
      <label>Nome:</label>
      <div class="invalid-feedback">Nome é obrigatório.</div>
    </div>
    <div class="form-floating">
      <input class="form-control" id="email" type="email" name="_replyto" placeholder="Digite seu e-mail..." required />
      <label for="email">E-mail:</label>
      <div class="invalid-feedback">Por favor insira um endereço de e-mail válido.</div>
    </div>
    <div class="form-floating">
      <textarea class="form-control" id="mensagem" name="mensagem" placeholder="Digite sua mensagem aqui..." style="height: 12rem" required></textarea>
      <label for="message">Mensagem:</label>
      <div class="invalid-feedback">Mensagem é obrigatório.</div>
    </div>
    <br/>
    <button class="btn text-uppercase" type="submit">Enviar</button>
  </form>
</div>
