(() => {

  /*
   * Tema claro / escuro
   *
   * A aplicação inicial do tema acontece no <head> (script inline), para não
   * piscar branco. Aqui fica só a alternância.
   */
  const themeToggle = document.getElementById("theme-toggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";

      if (dark) {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
      }

      try {
        localStorage.setItem("theme", dark ? "light" : "dark");
      } catch (e) {
        /* modo privativo: segue sem persistir */
      }

      // O Disqus só lê o colorScheme no carregamento do embed, então a thread
      // precisa ser recarregada para acompanhar o tema.
      if (window.DISQUS && typeof window.disqus_config === "function") {
        window.DISQUS.reset({ reload: true, config: window.disqus_config });
      }
    });
  }

  /*
   * Menu mobile
   */
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.classList.toggle("is-active", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
  }

  /*
   * Back to top
   */
  const backToTop = document.getElementById("backToTop");

  if (backToTop) {
    const syncBackToTop = () => {
      backToTop.classList.toggle("is-active", window.scrollY >= 500);
    };

    // Também na carga: o navegador restaura a posição de scroll ao recarregar,
    // e links com #âncora já abrem a página no meio.
    syncBackToTop();
    window.addEventListener("scroll", syncBackToTop, { passive: true });
  }

  /*
   * "Carregar mais"
   *
   * Substitui o scroll infinito, que empurrava o rodapé e o fim da sidebar
   * para sempre longe do leitor. O link de paginação do Jekyll continua no
   * HTML e funciona sem JS; aqui ele só é interceptado para trazer a próxima
   * página sem recarregar.
   */
  const articleFeed = document.querySelector(".article-feed");
  const pagination = document.querySelector(".pagination");
  const nextLink = pagination ? pagination.querySelector(".pagination__next") : null;

  if (articleFeed && nextLink) {
    const status = document.querySelector(".scroller-status");
    const loader = status ? status.querySelector(".infinite-scroll-request") : null;
    const doneMsg = status ? status.querySelector(".infinite-scroll-last") : null;
    const errorMsg = status ? status.querySelector(".infinite-scroll-error") : null;

    let nextUrl = nextLink.getAttribute("href");
    let loading = false;

    if (doneMsg) doneMsg.style.display = "none";
    nextLink.textContent = "Carregar mais";

    nextLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (loading || !nextUrl) return;

      loading = true;
      nextLink.setAttribute("aria-busy", "true");
      nextLink.style.display = "none";
      if (loader) loader.style.display = "";
      if (errorMsg) errorMsg.style.display = "none";

      fetch(nextUrl)
        .then((response) => {
          if (!response.ok) throw new Error("network response was not ok");
          return response.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const newPosts = [...doc.querySelectorAll(".article-feed > .article")];
          newPosts.forEach((post) => articleFeed.appendChild(post));

          const newNextLink = doc.querySelector(".pagination__next");
          nextUrl = newNextLink ? newNextLink.getAttribute("href") : null;

          loading = false;
          nextLink.removeAttribute("aria-busy");
          if (loader) loader.style.display = "none";

          if (nextUrl) {
            nextLink.style.display = "";
            // Leva o foco para o primeiro post novo, para quem navega por
            // teclado não voltar ao topo da lista. Tem de ser o link do título:
            // o da capa é aria-hidden e tabindex="-1", invisível para leitores
            // de tela.
            if (newPosts.length) {
              newPosts[0].querySelector(".article__title a")?.focus({ preventScroll: true });
            }
          } else {
            nextLink.remove();
            if (doneMsg) doneMsg.style.display = "";
          }
        })
        .catch(() => {
          loading = false;
          nextLink.removeAttribute("aria-busy");
          nextLink.style.display = "";
          if (loader) loader.style.display = "none";
          if (errorMsg) errorMsg.style.display = "";
        });
    });
  }

})();
