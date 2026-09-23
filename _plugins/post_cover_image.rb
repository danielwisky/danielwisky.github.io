# Preenche `page.image` de cada post com a capa em bitmap (variante og).
#
# Sem isso o jekyll-seo-tag não sabe que o post tem imagem: ele emite
# `twitter:card = summary` (miniatura pequena) e nenhum og:image. Emitir as
# tags à mão no head funcionaria para o og:image, mas deixaria o twitter:card
# duplicado e errado — mais simples é dar o dado ao plugin e deixar que ele
# gere o conjunto completo e consistente.
#
# A precedência aqui precisa espelhar a de _includes/post-cover.html, senão o
# card da rede social mostraria uma imagem diferente da que o post exibe.
module Jekyll
  class PostCoverImage < Generator
    safe true
    priority :low

    DEFAULT_OG = "/assets/img/covers/og/default.jpg".freeze

    def generate(site)
      photos = site.data["photos"] || {}
      covers = site.data["covers"] || {}

      site.posts.docs.each do |post|
        # Respeita uma imagem definida à mão no front matter.
        next if post.data["image"]

        post.data["image"] = og_for(post, photos, covers)
      end
    end

    private

    def og_for(post, photos, covers)
      return post.data["cover-img"] if post.data["cover-img"]

      photo = photos[post.data["slug"]]
      return photo["og"] if photo

      cover = covers[Array(post.data["tags"]).first]
      return cover["og"] if cover

      DEFAULT_OG
    end
  end
end
