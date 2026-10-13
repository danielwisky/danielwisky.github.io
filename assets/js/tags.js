(() => {

  /*
   * Página /tags
   *
   * Sem este script a página é a listagem completa com âncoras. Com ele, o
   * campo de busca filtra tags e seções, e clicar numa tag mostra só a seção
   * dela, mantendo o #slug na URL (os links da sidebar caem já filtrados).
   */
  const filter = document.querySelector("[data-tag-filter]");
  if (!filter) return;

  const input = filter.querySelector("input");
  const clear = filter.querySelector("[data-tag-clear]");
  const status = document.querySelector("[data-tag-status]");
  const selected = document.querySelector("[data-tag-selected]");
  const selectedText = selected.querySelector("[data-tag-selected-text]");
  const selectedClear = selected.querySelector("[data-tag-clear]");
  const chips = [...document.querySelectorAll(".tag-cloud [data-tag]")];
  const groups = [...document.querySelectorAll("[data-tag-group]")];
  const sections = [...document.querySelectorAll("[data-tag-section]")];

  const normalize = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const names = new Map(sections.map((s) => [s.dataset.tagSection, normalize(s.dataset.tagName)]));

  const syncGroups = () => {
    groups.forEach((group) => {
      group.hidden = !group.querySelector("[data-tag]:not([hidden])");
    });
  };

  const showAll = () => {
    chips.forEach((chip) => {
      chip.hidden = false;
      chip.classList.remove("is-active");
      chip.removeAttribute("aria-current");
    });
    sections.forEach((section) => { section.hidden = false; });
    syncGroups();
    clear.hidden = true;
    status.textContent = "";
    selected.hidden = true;
    selectedText.textContent = "";
  };

  const select = (slug) => {
    const target = sections.find((s) => s.dataset.tagSection === slug);
    if (!target) return false;

    input.value = "";
    showAll();
    sections.forEach((section) => { section.hidden = section !== target; });
    chips.forEach((chip) => {
      const active = chip.dataset.tag === slug;
      chip.classList.toggle("is-active", active);
      if (active) chip.setAttribute("aria-current", "true");
    });

    // A barra fica logo acima da seção: ao rolar até ela, a tag ativa e o
    // "Ver todas" continuam à vista, mesmo com a nuvem fora da tela.
    const count = target.querySelectorAll(".tag-entry").length;
    selectedText.textContent = `${count} ${count === 1 ? "post" : "posts"} em #${target.dataset.tagName}`;
    selected.hidden = false;
    selected.scrollIntoView();
    return true;
  };

  const applyQuery = () => {
    const query = normalize(input.value);
    if (!query) {
      showAll();
      return;
    }

    let found = 0;
    chips.forEach((chip) => {
      const match = names.get(chip.dataset.tag).includes(query);
      chip.hidden = !match;
      chip.classList.remove("is-active");
      chip.removeAttribute("aria-current");
      if (match) found += 1;
    });
    sections.forEach((section) => {
      section.hidden = !names.get(section.dataset.tagSection).includes(query);
    });
    syncGroups();

    selected.hidden = true;
    selectedText.textContent = "";
    clear.hidden = false;
    status.textContent = found
      ? `${found} ${found === 1 ? "assunto encontrado" : "assuntos encontrados"}`
      : "Nenhum assunto encontrado";
  };

  // A URL sem hash volta a ser a listagem completa.
  const clearHash = () => {
    if (location.hash) history.pushState(null, "", location.pathname + location.search);
  };

  const fromHash = () => {
    let slug = "";
    try {
      slug = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      /* hash mal codificado (ex.: #100%): trata como sem tag */
    }
    if (!slug || !select(slug)) showAll();
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      // Cmd/Ctrl/Shift/botão do meio seguem abrindo o link em outra aba.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      if (chip.classList.contains("is-active")) {
        clearHash();
        showAll();
        return;
      }
      history.pushState(null, "", `#${chip.dataset.tag}`);
      select(chip.dataset.tag);
    });
  });

  input.addEventListener("input", () => {
    clearHash();
    applyQuery();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value) {
      input.value = "";
      showAll();
    }
  });

  clear.addEventListener("click", () => {
    input.value = "";
    clearHash();
    showAll();
    input.focus();
  });

  selectedClear.addEventListener("click", () => {
    const active = chips.find((chip) => chip.classList.contains("is-active"));
    clearHash();
    showAll();
    active?.focus();
  });

  // Voltar/avançar entre hashes dispara popstate e hashchange; ouvir os dois
  // rodaria o select() duas vezes (e repetiria o aviso do aria-live).
  window.addEventListener("popstate", fromHash);

  filter.hidden = false;
  fromHash();
})();
