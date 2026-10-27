(() => {

  /*
   * Light / dark theme
   *
   * The initial theme is applied in the <head> (inline script), to avoid a
   * white flash. Only the toggle lives here.
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
        /* private mode: carry on without persisting */
      }

      // Disqus only resolves the color scheme when the embed loads, and its
      // reset() doesn't recompute it. _includes/comments.html exposes a function
      // that recreates the whole embed, which is what actually changes the color.
      //
      // Only reloads if it's already mounted: the embed is now lazy, and
      // switching the theme at the top of the post shouldn't pull it in early.
      if (window.DISQUS) window.loadDisqus?.();
    });
  }

  /*
   * Mobile menu
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

    // Also on load: the browser restores the scroll position on reload,
    // and links with an #anchor open the page midway.
    syncBackToTop();
    window.addEventListener("scroll", syncBackToTop, { passive: true });
  }

  /*
   * "Load more"
   *
   * Replaces infinite scroll, which kept pushing the footer and the end of the
   * sidebar forever out of the reader's reach. Jekyll's pagination link stays
   * in the HTML and works without JS; here it is only intercepted to fetch the
   * next page without reloading.
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
            // Moves focus to the first new post, so keyboard users don't
            // jump back to the top of the list. It has to be the title link:
            // the cover one is aria-hidden and tabindex="-1", invisible to screen
            // readers.
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
