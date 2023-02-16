---
layout: null
sitemap: false
---

var posts = [{% for post in site.posts %}{
  'id': {% increment counter %},
  'title': {{ post.title | jsonify }},
  'subtitle': {{ post.subtitle | jsonify }},
  'link': {{ post.url | absolute_url | jsonify }},
  {% if post.thumbnail-img %}'thumb': {{ post.thumbnail-img | absolute_url | jsonify }},{% endif %}
  'date': "{% include date-pt-br.html date = post.date %}",
  'datetime' : {{ post.date | date_to_xmlschema | jsonify }},
  'categories': {{ post.categories | jsonify }},
  'tags': {{ post.tags | jsonify }},
  'content': {{ post.content | strip_html | jsonify }}
  }{% unless forloop.last %},{% endunless %}{% endfor %}
];

var index = lunr(function() {
  this.field('title')
  this.field('subtitle')
  this.field('content', {
    boost: 10
  })
  this.field('categories')
  this.field('tags')
  this.ref('id')

  posts.forEach(function (post) { this.add(post) }, this)
});

const searchResults = document.getElementById("searchResults");
const searchInput = document.getElementById("searchInput");

searchInput.onkeyup = function() {

  // clear results
  searchResults.innerHTML = "";

  let query = this.value;
  if (query.length >= 3) {
    // search for it
    let result = index.search(query);

    if (result.length === 0) {
      let noResults = createItemNotFound();
      searchResults.prepend(noResults);
    }

    for (let item in result) {
      let ref = result[item].ref;
      let resultItem = createResultItem(ref);
      searchResults.append(resultItem);
    }
  }
};

function createResultItem(ref) {
  let resultItem = document.createElement("li");
  let resultLink = document.createElement("a");
  let resultDate = document.createElement("span");
  let resultTime = document.createElement("time");

  if (posts[ref].thumb) {
    let resultThumb = document.createElement("a");
    resultThumb.classList.add("search-results__image");
    resultThumb.setAttribute("href", posts[ref].link);
    resultThumb.setAttribute("style", "background-image: url(" + posts[ref].thumb + ");");
    resultItem.append(resultThumb);
  }

  resultTime.textContent = posts[ref].date;
  resultTime.setAttribute("datetime", posts[ref].datetime);
  resultDate.classList.add("search-results-date");
  resultDate.append(resultTime);
  resultLink.classList.add("search-results__link");
  resultLink.setAttribute("href", posts[ref].link);
  resultLink.textContent = posts[ref].title;
  resultLink.append(resultDate);
  resultItem.classList.add("search-results__item");
  resultItem.append(resultLink);

  return resultItem;
}

function createItemNotFound() {
  let noResults = document.createElement("li");
  noResults.classList.add("no-results");
  noResults.textContent = "Nenhum resultado encontrado.";
  return noResults;
}
