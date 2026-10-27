/*
 * Enhances Rouge code blocks with a top bar (traffic lights, language name
 * and copy button).
 *
 * Rouge already does syntax highlighting at build time, so there is no runtime
 * highlighting here — just the frame. Post markup doesn't need to change: the
 * language comes from the `language-*` class kramdown puts on the wrapper.
 */
(() => {
  // Same sprite as the rest of the site (assets/img/icons.svg), via <use>.
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/img/icons.svg#${name}"></use></svg>`;

  const blocks = document.querySelectorAll("div.highlighter-rouge");
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const code = block.querySelector("pre");
    if (!code) return;

    const match = [...block.classList].find((c) => c.startsWith("language-"));
    const language = match ? match.replace("language-", "") : "";

    // Blocks without a language become `language-plaintext`; showing that label
    // just clutters the bar.
    const label = language && language !== "plaintext" ? language : "";

    const bar = document.createElement("div");
    bar.className = "code-bar";
    bar.innerHTML =
      '<span class="code-bar__dots"><span></span><span></span><span></span></span>' +
      `<span class="code-bar__lang">${label}</span>`;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "code-bar__copy";
    copy.setAttribute("aria-label", "Copiar código");
    copy.innerHTML = icon('copy') + ' Copiar';

    let resetTimer;

    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        copy.classList.add("is-done");
        copy.innerHTML = icon('check') + ' Copiado!';
      } catch (e) {
        copy.innerHTML = icon('xmark') + ' Falhou';
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copy.classList.remove("is-done");
        copy.innerHTML = icon('copy') + ' Copiar';
      }, 2000);
    });

    bar.appendChild(copy);
    block.insertBefore(bar, block.firstChild);
  });
})();
