/*
 * Blog search.
 *
 * Nothing here is downloaded until the reader opens the overlay for the first
 * time: lunr, the Portuguese stemmer and the index (~190 KB) only hit the
 * network then. They used to load on every visit, even with no one searching.
 */
(() => {
  /* Every third-party script comes with integrity: they are injected at runtime,
     but that's no reason to give up the check a static <script> tag would
     have. */
  const SCRIPTS = [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.9/lunr.min.js",
      integrity: "sha384-203J0SNzyqHby3iU6hzvzltrWi/M41wOP5Gu+BiJMz5nwKykbkUx8Kp7iti0Lpli",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/lunr-languages@1.14.0/lunr.stemmer.support.js",
      integrity: "sha384-cNMzF77Cs0v2yLtePgqS6A5MwbVWQjEOk/zv3e88sNiFe+opc629fFoPmfZ+6IEf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/lunr-languages@1.14.0/lunr.pt.js",
      integrity: "sha384-217HjdynnwJlbugAE0+W3DfqgYXLZIrh+vjqhkQC19znmkWLw3WskvLqcVqM3/Ws",
    },
  ];

  const searchBox = document.getElementById("search-box");
  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");
  const statusEl = document.getElementById("searchStatus");

  if (!searchBox || !input || !resultsEl) return;

  const indexUrl = (searchBox.dataset.index || "/search-index.json");

  let posts = [];
  let index = null;
  let loading = null;
  let selected = -1;
  let debounceTimer;

  /* Strips accents: "programacao" must match "programação". */
  const fold = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const loadScript = ({ src, integrity }) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.integrity = integrity;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      script.onload = resolve;
      script.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(script);
    });

  function buildIndex() {
    if (loading) return loading;

    setStatus("Carregando índice...");

    // In series: lunr.stemmer.support and lunr.pt depend on lunr being loaded.
    loading = SCRIPTS.reduce((chain, entry) => chain.then(() => loadScript(entry)), Promise.resolve())
      .then(() => fetch(indexUrl))
      .then((response) => {
        if (!response.ok) throw new Error("could not download the index");
        return response.json();
      })
      .then((data) => {
        posts = data.posts;

        index = lunr(function () {
          this.use(lunr.pt);
          this.ref("id");
          this.field("title", { boost: 10 });
          this.field("tags", { boost: 5 });
          this.field("subtitle", { boost: 3 });
          this.field("content");

          posts.forEach((post) => {
            this.add({
              id: post.id,
              title: fold(post.title),
              tags: fold((post.tags || []).join(" ")),
              subtitle: fold(post.subtitle || ""),
              content: fold(post.content),
            });
          }, this);
        });

        setStatus("");
      })
      .catch((error) => {
        loading = null;
        setStatus("Não foi possível carregar a busca. Tente recarregar a página.");
        console.error(error);
      });

    return loading;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  const escapeHtml = (value) =>
    value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Highlights the search terms by comparing the accent-free versions of the strings. */
  function mark(text, terms) {
    const folded = fold(text).toLowerCase();
    const ranges = [];

    terms.forEach((term) => {
      let from = 0;
      while (from < folded.length) {
        const at = folded.indexOf(term, from);
        if (at === -1) break;
        ranges.push([at, at + term.length]);
        from = at + term.length;
      }
    });

    if (!ranges.length) return escapeHtml(text);

    ranges.sort((a, b) => a[0] - b[0]);

    let out = "";
    let cursor = 0;
    ranges.forEach(([start, end]) => {
      if (start < cursor) return;
      out += escapeHtml(text.slice(cursor, start));
      out += `<mark>${escapeHtml(text.slice(start, end))}</mark>`;
      cursor = end;
    });
    out += escapeHtml(text.slice(cursor));

    return out;
  }

  /* Content excerpt around the first occurrence of any term. */
  function snippet(content, terms) {
    const folded = fold(content).toLowerCase();
    let at = -1;

    for (const term of terms) {
      const found = folded.indexOf(term);
      if (found !== -1 && (at === -1 || found < at)) at = found;
    }

    const start = at === -1 ? 0 : Math.max(0, at - 70);
    const text = content.slice(start, start + 190).trim();

    return (start > 0 ? "…" : "") + text + (start + 190 < content.length ? "…" : "");
  }

  /* Emptying the list without resetting `selected` made Enter try to open a
     result that no longer exists. */
  function clearResults() {
    resultsEl.innerHTML = "";
    selected = -1;
  }

  function render(matches, terms) {
    clearResults();

    matches.forEach((match, i) => {
      const post = posts[Number(match.ref)];
      const item = document.createElement("li");
      item.className = "search-results__item";
      item.dataset.position = String(i);

      item.innerHTML = `
        <a class="search-results__link" href="${post.url}">
          <span class="search-results__thumb">
            <img src="${post.cover}" loading="lazy" decoding="async" alt="">
          </span>
          <span>
            <span class="search-results__title">${mark(post.title, terms)}</span>
            <span class="search-results__snippet">${mark(snippet(post.content, terms), terms)}</span>
            <span class="search-results__meta">${escapeHtml(post.date)}${
              post.tags && post.tags.length ? ` · ${escapeHtml(post.tags.join(", "))}` : ""
            }</span>
          </span>
        </a>`;

      resultsEl.appendChild(item);
    });
  }

  function run() {
    const raw = input.value.trim();

    if (raw.length < 2) {
      clearResults();
      setStatus("");
      return;
    }

    buildIndex().then(() => {
      if (!index) return;

      const terms = fold(raw)
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      /*
       * Each term goes in twice: bare and with a wildcard.
       *
       * lunr doesn't run terms with `*` through the pipeline, so the wildcard
       * alone doesn't match the index — which is stemmed ("programacao" became
       * "program"). The bare term covers the whole word and the wildcard covers
       * the word still being typed.
       */
      const query = terms.map((term) => `${term} ${term}*`).join(" ");

      let matches = [];
      try {
        matches = index.search(query);
      } catch (e) {
        matches = [];
      }

      if (!matches.length) {
        clearResults();
        setStatus("Nenhum resultado encontrado.");
        return;
      }

      setStatus(`${matches.length} resultado${matches.length > 1 ? "s" : ""}`);
      render(matches.slice(0, 20), terms);
    });
  }

  function move(step) {
    const items = [...resultsEl.children];
    if (!items.length) return;

    if (selected >= 0) items[selected].classList.remove("is-selected");
    selected = (selected + step + items.length) % items.length;
    items[selected].classList.add("is-selected");
    items[selected].scrollIntoView({ block: "nearest" });
  }

  /* Saved to return focus to whatever opened it, instead of dropping it on <body>. */
  let lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    searchBox.classList.add("is-visible");
    document.body.classList.add("is-locked");
    input.focus();
    buildIndex();
  }

  function close() {
    searchBox.classList.remove("is-visible");
    document.body.classList.remove("is-locked");
    lastFocused?.focus?.();
  }

  /*
   * Traps Tab inside the overlay. Results are navigated with the arrow keys, so
   * the only focusable elements are the input and the close button: without
   * this, tabbing went to the header and the content behind, which is visually
   * covered.
   */
  function trapTab(event) {
    const closeButton = document.getElementById("search-close");
    if (!closeButton) return;

    const first = input;
    const last = closeButton;
    const atEdge = event.shiftKey ? document.activeElement === first : document.activeElement === last;

    if (atEdge) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }

  const isOpen = () => searchBox.classList.contains("is-visible");

  document.getElementById("search-open")?.addEventListener("click", open);
  document.getElementById("search-close")?.addEventListener("click", close);

  searchBox.addEventListener("click", (event) => {
    if (event.target === searchBox) close();
  });

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 150);
  });

  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "");

    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      isOpen() ? close() : open();
      return;
    }

    if (event.key === "/" && !typing && !isOpen()) {
      event.preventDefault();
      open();
      return;
    }

    if (!isOpen()) return;

    if (event.key === "Tab") {
      trapTab(event);
    } else if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter" && selected >= 0) {
      event.preventDefault();
      resultsEl.children[selected].querySelector("a").click();
    }
  });
})();
