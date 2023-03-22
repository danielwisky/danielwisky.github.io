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

  searchOpen.onclick = function() {
    searchBox.classList.add("is-visible");
  };

  searchClose.onclick = function() {
    searchBox.classList.remove("is-visible");
  };

})();