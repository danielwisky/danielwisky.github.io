module Jekyll
  module TagsByCountFilter
    # site.tags comes sorted alphabetically; the sidebar wants the most used.
    def tags_by_count(tags)
      tags.sort_by { |name, posts| [-posts.size, name] }
    end
  end
end

Liquid::Template.register_filter(Jekyll::TagsByCountFilter)
