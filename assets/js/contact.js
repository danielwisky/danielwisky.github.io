/*
 * Contact form: validation and AJAX submission.
 *
 * Submission goes through fetch instead of letting the browser post the form
 * because Formspree, on the free plan, always dumps the visitor on the thank-you
 * page on its own domain. With AJAX we can send them to our /thanks/.
 *
 * Without JS the form still works: the `action` stays in the HTML and Formspree
 * handles the rest.
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
    // Without aria-invalid the error message is visual only: screen reader users
    // were thrown into the field without knowing why.
    control.setAttribute("aria-invalid", String(!valid));
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

    // Validates on blur; on input, only once the field is already invalid, so
    // we don't flag an error while the person is still typing.
    control.addEventListener("blur", () => validate(field));
    control.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validate(field);
    });
  });

  const recaptchaSiteKey = form.dataset.recaptchaSiteKey;

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
      // v3 has no checkbox: it generates a score token in the background on each submit.
      const formData = new FormData(form);
      if (recaptchaSiteKey && typeof grecaptcha !== "undefined") {
        const token = await new Promise((resolve) => {
          grecaptcha.ready(() => {
            grecaptcha.execute(recaptchaSiteKey, { action: "contato" }).then(resolve);
          });
        });
        formData.set("g-recaptcha-response", token);
      }

      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      form.reset();
      form.style.display = "none";
      say("Mensagem enviada. Respondo assim que possível.");

      const success = form.dataset.success;
      if (success) window.location.assign(success);
    } catch (error) {
      submit.disabled = false;
      say("Não consegui enviar. Tente de novo, ou me escreva direto por e-mail.", true);
      console.error(error);
    }
  });
})();
