# Usa o subtitle como description dos posts que não definem uma.
#
# Sem isso o jekyll-seo-tag cai no excerpt, que é o primeiro parágrafo inteiro
# (500+ caracteres em vários posts), e o buscador corta em ~155. O subtitle já
# é um resumo curto escrito à mão.
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
