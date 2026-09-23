/*
 * Formulário de contato: validação e envio por AJAX.
 *
 * O envio vai por fetch em vez de deixar o navegador postar o form porque o
 * Formspree ignora o campo `_next` (o redirecionamento agora se configura no
 * painel deles) e mandaria a pessoa para uma página de obrigado no domínio
 * deles. Com AJAX a resposta aparece aqui mesmo.
 *
 * Sem JS o form ainda funciona: o `action` continua no HTML e o Formspree
 * cuida do resto.
 */
(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("contactStatus");
  const submit = form.querySelector('button[type="submit"]');
  const fields = [...form.querySelectorAll(".field")];

  const validate = (field) => {
    const control = field.querySelector(".field__control");
    if (!control) return true;

    const valid = control.checkValidity();
    field.classList.toggle("is-invalid", !valid);
    return valid;
  };

  const say = (message, isError) => {
    if (!status) return;
    status.textContent = message;
    status.classList.add("is-visible");
    status.classList.toggle("is-error", Boolean(isError));
  };

  fields.forEach((field) => {
    const control = field.querySelector(".field__control");
    if (!control) return;

    // Só valida no blur/input depois que o campo já foi marcado como inválido,
    // para não acusar erro enquanto a pessoa ainda está digitando.
    control.addEventListener("blur", () => validate(field));
    control.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validate(field);
    });
  });

  form.addEventListener("submit", async (event) => {
    const results = fields.map(validate);

    if (results.includes(false)) {
      event.preventDefault();
      form.querySelector(".field.is-invalid .field__control")?.focus();
      return;
    }

    event.preventDefault();
    submit.disabled = true;
    say("Enviando...");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      form.reset();
      form.style.display = "none";
      say("Mensagem enviada. Respondo assim que possível.");
    } catch (error) {
      submit.disabled = false;
      say("Não consegui enviar. Tente de novo, ou me escreva direto por e-mail.", true);
      console.error(error);
    }
  });
})();
