(() => {

  /*
   * Scroll Event
   */
  window.addEventListener('DOMContentLoaded', () => {
    let scrollPos = 0;
    const mainNav = document.getElementById('navigation');
    const backToTop = document.getElementById('backToTop');
    const headerHeight = mainNav.clientHeight;
    window.addEventListener('scroll', function() {
      const currentTop = document.body.getBoundingClientRect().top * -1;
      if (currentTop < scrollPos) {
        // scrolling Up
        if (currentTop > 0 && mainNav.classList.contains('is-fixed')) {
          mainNav.classList.add('is-visible');
        } else {
          mainNav.classList.remove('is-visible', 'is-fixed');
        }
      } else {
        // scrolling down
        mainNav.classList.remove(['is-visible']);
        if (currentTop > headerHeight && !mainNav.classList.contains('is-fixed')) {
          mainNav.classList.add('is-fixed');
        }
      }

      if (currentTop >= 500) {
        backToTop.classList.add("active");
      } else {
        backToTop.classList.remove("active");
      }

      scrollPos = currentTop;
    });
  });

  /*
   * Search Box
   */
  const searchBox = document.getElementById("search-box");
  const searchOpen = document.getElementById("nav-search-link");
  const searchClose = document.getElementById("search-close");

  searchOpen.addEventListener("click", function() {
    searchBox.classList.add("is-visible");
  });

  const closeSearchBox = function() {
    searchBox.classList.remove("is-visible");
  };

  searchClose.addEventListener("click", closeSearchBox);
  searchClose.addEventListener("keydown", function(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeSearchBox();
    }
  });

  /*
   * Dark mode toggle
   * (initial theme is set synchronously in _includes/head.html to avoid a flash)
   */
  const themeToggle = document.getElementById("theme-toggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", function() {
      const root = document.documentElement;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const currentTheme = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      root.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
    });
  }

  /*
   * Infinite scroll (vanilla, replaces the jquery-infinitescroll CDN plugin)
   */
  const articleFeed = document.querySelector(".article-feed");

  if (articleFeed) {
    const pagination = document.querySelector(".pagination");
    const status = document.querySelector(".scroller-status");
    const loader = status ? status.querySelector(".infinite-scroll-request") : null;
    const doneMsg = status ? status.querySelector(".infinite-scroll-last") : null;
    const errorMsg = status ? status.querySelector(".infinite-scroll-error") : null;

    let nextUrl = pagination ? pagination.querySelector(".pagination__next").getAttribute("href") : null;
    let loading = false;

    if (nextUrl) {
      if (doneMsg) doneMsg.style.display = "none";
      pagination.style.display = "none";

      const sentinel = document.createElement("div");
      sentinel.setAttribute("aria-hidden", "true");
      articleFeed.insertAdjacentElement("afterend", sentinel);

      const observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      }, { rootMargin: "400px" });

      const loadNextPage = function() {
        if (loading || !nextUrl) return;
        loading = true;
        if (loader) loader.style.display = "";
        if (errorMsg) errorMsg.style.display = "none";

        fetch(nextUrl)
          .then(function(response) {
            if (!response.ok) throw new Error("network response was not ok");
            return response.text();
          })
          .then(function(html) {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const newPosts = doc.querySelectorAll(".article-feed > .post-preview");
            newPosts.forEach(function(post) {
              articleFeed.appendChild(post);
            });

            const newNextLink = doc.querySelector(".pagination__next");
            nextUrl = newNextLink ? newNextLink.getAttribute("href") : null;

            loading = false;
            if (loader) loader.style.display = "none";

            if (!nextUrl) {
              observer.disconnect();
              sentinel.remove();
              if (doneMsg) doneMsg.style.display = "";
            }
          })
          .catch(function() {
            loading = false;
            if (loader) loader.style.display = "none";
            if (errorMsg) errorMsg.style.display = "";
            observer.disconnect();
          });
      };

      observer.observe(sentinel);
    }
  }

})();