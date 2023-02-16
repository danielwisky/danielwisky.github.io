/*
 * Scroll Event
 */
window.addEventListener('DOMContentLoaded', () => {
	let scrollPos = 0;
	const mainNav = document.getElementById('mainNav');
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
 * Change Theme
 */
const changeThemeLink = document.getElementById("nav-change-theme-link");
const changeThemeIcon = document.getElementById("nav-change-theme-icon");

if (typeof(Storage) !== "undefined" && localStorage.getItem("theme") == "dark") {
  changeToDarkTheme();
}

changeThemeLink.onclick = function() {
  if (changeThemeIcon.classList.contains("fa-moon")) {
    changeToDarkTheme();
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("theme", "dark");
    }
  } else {
    changeToLightTheme();
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("theme", "light");
    }
  }
};

function changeToLightTheme() {
  changeThemeIcon.classList.add("fa-moon");
  changeThemeIcon.classList.remove("fa-sun");
  document.body.classList.remove("dark");
}

function changeToDarkTheme() {
  changeThemeIcon.classList.remove("fa-moon");
  changeThemeIcon.classList.add("fa-sun");
  document.body.classList.add("dark");
}

/*
 * Search Box
 */
const searchBox = document.getElementById("searchBox");
const searchOpen = document.getElementById("nav-search-link");
const searchClose = document.getElementById("searchClose");

searchOpen.onclick = function() {
  searchBox.classList.add("is-visible");
};

searchClose.onclick = function() {
  searchBox.classList.remove("is-visible");
};