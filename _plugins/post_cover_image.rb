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
      # cover-img só serve como og:image se for bitmap: o motivo de este
      # plugin existir é justamente que redes sociais rejeitam SVG, e as capas
      # geradas são todas SVG.
      manual = post.data["cover-img"]
      return manual if manual && !manual.to_s.end_with?(".svg")

      photo = photos[post.data["slug"]]
      cover = covers[Array(post.data["tags"]).first]

      # `||` em cadeia em vez de returns: uma entrada existir mas não ter a
      # chave "og" deixaria page.image nil, e o seo-tag omitiria a imagem.
      (photo && photo["og"]) || (cover && cover["og"]) || DEFAULT_OG
    end
  end
end
