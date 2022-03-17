---
layout: page
title: Contato
subtitle: Pouco conhecimento faz com que as pessoas se sintam orgulhosas. Muito conhecimento, com que se sintam humildes.<br/>(Leonardo DaVinci)
cover-img: /assets/img/sobre-bg.jpg
---

<p>Caso queira entrar em contato, por favor, preencha o formulário abaixo e envie sua mensagem.</p>

<form id="contactForm" action="https://formspree.io/f/{{ site.social-network-links.email }}" method="POST">
  <input type="text" name="_gotcha" style="display:none" />
  <input type="hidden" name="_subject" value="Contato - Blog" />
  <input type="hidden" name="_next" value="{{ site.baseurl }}/obrigado/" />
  <div class="control-group">
    <div class="form-group floating-label-form-group controls">
      <label>Nome:</label>
      <input class="form-control"  id="nome" type="text" name="nome" placeholder="Nome">
    </div>
  </div>
  <div class="control-group">
    <div class="form-group floating-label-form-group controls">
      <label>Email:</label>
      <input class="form-control"  id="email" type="email" name="_replyto" placeholder="Email">
    </div>
  </div>
  <div class="control-group">
    <div class="form-group floating-label-form-group controls">
      <label>Mensagem:</label>
      <textarea class="form-control"  id="mensagem" rows="5" class="form-control" name="mensagem" placeholder="Mensagem"></textarea>
    </div>
  </div>
  <br>
  <div class="form-group">
    <button type="submit" class="btn btn-primary">Enviar</button>
  </div>
</form>