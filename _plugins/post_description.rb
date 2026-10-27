# Uses the subtitle as the description for posts that don't define one.
#
# Without this, jekyll-seo-tag falls back to the excerpt, the entire first paragraph
# (500+ characters in several posts), and search engines cut it at ~155. The subtitle
# is already a short handwritten summary.
module Jekyll
  class PostDescription < Generator
    safe true
    priority :low

    def generate(site)
      site.posts.docs.each do |post|
        next if post.data["description"]

        subtitle = post.data["subtitle"]
        post.data["description"] = subtitle if subtitle && !subtitle.to_s.strip.empty?
      end
    end
  end
end
