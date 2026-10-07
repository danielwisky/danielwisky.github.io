# Posts relacionados por tag em comum, ordenados por quantas tags
# compartilham e, em empate, pelos mais recentes primeiro.
#
# post-nav.html já cobre anterior/próximo, mas isso é só ordem cronológica,
# sem relação nenhuma de assunto. Fazer esse cruzamento em Liquid puro exigiria
# contar tags em comum por post sem suporte nativo a dicionário — mais simples
# resolver em Ruby, no mesmo espírito do tags_by_count.rb.
module Jekyll
  module RelatedPostsFilter
    def related_posts(post, all_posts, limit = 3)
      tags = Array(post["tags"])
      return [] if tags.empty?

      current_url = post["url"]

      # Comparação por `.url` (método real do Document), não por `["id"]`:
      # candidatos vindos de `site.posts` são Document puros, sem o fallback
      # para data que o Drop de `page` tem, então `candidate["id"]` sempre
      # voltava nil e o próprio post nunca era excluído da lista.
      scored = all_posts.filter_map do |candidate|
        next if candidate.url == current_url

        shared = (Array(candidate.data["tags"]) & tags).size
        [candidate, shared] if shared.positive?
      end

      scored
        .sort_by { |candidate, shared| [-shared, -candidate.date.to_i] }
        .first(limit)
        .map(&:first)
    end
  end
end

Liquid::Template.register_filter(Jekyll::RelatedPostsFilter)
