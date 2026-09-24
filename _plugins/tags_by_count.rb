module Jekyll
  module TagsByCountFilter
    # site.tags vem ordenado alfabeticamente; a sidebar quer as mais usadas.
    def tags_by_count(tags)
      tags.sort_by { |name, posts| [-posts.size, name] }
    end
  end
end

Liquid::Template.register_filter(Jekyll::TagsByCountFilter)
