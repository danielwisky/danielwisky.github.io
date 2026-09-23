/*
 * Enriquece os blocos de código do Rouge com uma barra no topo (semáforos,
 * nome da linguagem e botão de copiar).
 *
 * O Rouge já faz o realce de sintaxe no build, então não há realce em runtime
 * aqui — só a moldura. O markup dos posts não precisa mudar: a linguagem sai
 * da classe `language-*` que o kramdown coloca no wrapper.
 */
(() => {
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
    copy.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copiar';

    let resetTimer;

    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        copy.classList.add("is-done");
        copy.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copiado!';
      } catch (e) {
        copy.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Falhou';
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copy.classList.remove("is-done");
        copy.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copiar';
      }, 2000);
    });

    bar.appendChild(copy);
    block.insertBefore(bar, block.firstChild);
  });
})();
