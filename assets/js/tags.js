(() => {

  /*
   * /tags page
   *
   * Without this script the page is the full listing with anchors. With it, the
   * search field filters tags and sections, and clicking a tag shows only its
   * section, keeping the #slug in the URL (sidebar links land already filtered).
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

    // The bar sits right above the section: when scrolling to it, the active tag
    // and "Ver todas" stay in view, even with the cloud off screen.
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

  // A URL without a hash goes back to the full listing.
  const clearHash = () => {
    if (location.hash) history.pushState(null, "", location.pathname + location.search);
  };

  const fromHash = () => {
    let slug = "";
    try {
      slug = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      /* malformed hash (e.g. #100%): treat as no tag */
    }
    if (!slug || !select(slug)) showAll();
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      // Cmd/Ctrl/Shift/middle click still open the link in another tab.
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

  // Back/forward between hashes fires both popstate and hashchange; listening to
  // both would run select() twice (and repeat the aria-live announcement).
  window.addEventListener("popstate", fromHash);

  filter.hidden = false;
  fromHash();
})();
