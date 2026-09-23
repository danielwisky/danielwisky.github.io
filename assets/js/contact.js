/*
 * Validação do formulário de contato.
 *
 * Substitui o `.needs-validation` do Bootstrap: marca o .field como inválido
 * para o CSS mostrar a mensagem de erro correspondente.
 */
(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const fields = [...form.querySelectorAll(".field")];

  const validate = (field) => {
    const control = field.querySelector(".field__control");
    if (!control) return true;

    const valid = control.checkValidity();
    field.classList.toggle("is-invalid", !valid);
    return valid;
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

  form.addEventListener("submit", (event) => {
    const results = fields.map(validate);

    if (results.includes(false)) {
      event.preventDefault();
      form.querySelector(".field.is-invalid .field__control")?.focus();
    }
  });
})();
