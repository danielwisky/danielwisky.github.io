# Preenche `page.image` de cada post com a capa em JPEG (og) da primeira tag.
#
# Sem isso o jekyll-seo-tag não sabe que o post tem imagem: ele emite
# `twitter:card = summary` (miniatura pequena) e nenhum og:image. Emitir as
# tags à mão no head funcionaria para o og:image, mas deixaria o twitter:card
# duplicado e errado — mais simples é dar o dado ao plugin e deixar que ele
# gere o conjunto completo e consistente.
#
# O mapa tag -> capa vem de _data/covers.yml, gerado por scripts/build-covers.mjs.
module Jekyll
  class PostCoverImage < Generator
    safe true
    priority :low

    DEFAULT_OG = "/assets/img/covers/og/default.jpg".freeze

    def generate(site)
      covers = site.data["covers"] || {}

      site.posts.docs.each do |post|
        # Respeita uma imagem definida à mão no front matter.
        next if post.data["image"]

        first_tag = Array(post.data["tags"]).first
        entry = covers[first_tag]

        post.data["image"] = (entry && entry["og"]) || DEFAULT_OG
      end
    end
  end
end
