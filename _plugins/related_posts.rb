# Related posts by shared tag, ordered by how many tags they share
# and, on ties, by most recent first.
module Jekyll
  module RelatedPostsFilter
    def related_posts(post, all_posts, limit = 3, exclude = [])
      tags = Array(post["tags"])
      return [] if tags.empty?

      current_url = post["url"]
      excluded_urls = Array(exclude).filter_map { |item| item["url"] if item }

      scored = all_posts.filter_map do |candidate|
        # `.url`, not `["id"]`: candidates from site.posts are plain Documents, and
        # candidate["id"] always returns nil on them.
        next if candidate.url == current_url
        next if excluded_urls.include?(candidate.url)

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
