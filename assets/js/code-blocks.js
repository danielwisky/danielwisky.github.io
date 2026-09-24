/*
 * Enriquece os blocos de código do Rouge com uma barra no topo (semáforos,
 * nome da linguagem e botão de copiar).
 *
 * O Rouge já faz o realce de sintaxe no build, então não há realce em runtime
 * aqui — só a moldura. O markup dos posts não precisa mudar: a linguagem sai
 * da classe `language-*` que o kramdown coloca no wrapper.
 */
(() => {
  // Mesmo sprite do resto do site (assets/img/icons.svg), via <use>.
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/img/icons.svg#${name}"></use></svg>`;

  const blocks = document.querySelectorAll("div.highlighter-rouge");
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const code = block.querySelector("pre");
    if (!code) return;

    const match = [...block.classList].find((c) => c.startsWith("language-"));
    const language = match ? match.replace("language-", "") : "";

    // Blocos sem linguagem viram `language-plaintext`; mostrar esse rótulo só
    // polui a barra.
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
