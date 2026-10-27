# Fills each post's `page.image` with the bitmap cover (og variant).
#
# Without this, jekyll-seo-tag doesn't know the post has an image: it emits
# `twitter:card = summary` (small thumbnail) and no og:image. Emitting the
# tags by hand in the head would work for og:image, but would leave twitter:card
# duplicated and wrong — it's simpler to give the data to the plugin and let it
# generate the complete, consistent set.
#
# The precedence here must mirror _includes/post-cover.html, otherwise the
# social card would show a different image from the one the post displays.
module Jekyll
  class PostCoverImage < Generator
    safe true
    priority :low

    DEFAULT_OG = "/assets/img/covers/og/default.jpg".freeze

    def generate(site)
      photos = site.data["photos"] || {}
      covers = site.data["covers"] || {}

      site.posts.docs.each do |post|
        # Respect an image set by hand in the front matter.
        next if post.data["image"]

        post.data["image"] = og_for(post, photos, covers)
      end
    end

    private

    def og_for(post, photos, covers)
      # cover-img only works as og:image if it's a bitmap: the whole reason this
      # plugin exists is that social networks reject SVG, and the generated
      # covers are all SVG.
      manual = post.data["cover-img"]
      return manual if manual && !manual.to_s.end_with?(".svg")

      photo = photos[post.data["slug"]]
      cover = covers[Array(post.data["tags"]).first]

      # Chained `||` instead of returns: an entry that exists but lacks the
      # "og" key would leave page.image nil, and seo-tag would omit the image.
      (photo && photo["og"]) || (cover && cover["og"]) || DEFAULT_OG
    end
  end
end
