# Posts relacionados por tag em comum, ordenados por quantas tags
# compartilham e, em empate, pelos mais recentes primeiro.
module Jekyll
  module RelatedPostsFilter
    def related_posts(post, all_posts, limit = 3)
      tags = Array(post["tags"])
      return [] if tags.empty?

      current_url = post["url"]

      scored = all_posts.filter_map do |candidate|
        # `.url`, não `["id"]`: candidatos de site.posts são Document puros, e
        # candidate["id"] sempre volta nil neles.
        next if candidate.url == current_url

        shared = tags & Array(candidate.data["tags"])
        [candidate, shared] unless shared.empty?
      end

      scored
        .sort_by { |candidate, shared| [-shared.size, -candidate.date.to_i] }
        .first(limit)
        .map { |candidate, shared| { "post" => candidate, "tag" => shared.first } }
    end
  end
end

Liquid::Template.register_filter(Jekyll::RelatedPostsFilter)
