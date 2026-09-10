# Cache-busting por conteúdo: gera um hash curto do arquivo (em vez de
# site.time, que muda a cada build mesmo sem o asset ter mudado, invalidando
# o cache do navegador à toa a cada deploy).
require "digest"

module Jekyll
  module AssetHashFilter
    def asset_hash(path)
      file_path = File.join(Dir.pwd, path.to_s.sub(%r{\A/}, ""))
      return "0" unless File.exist?(file_path)

      Digest::MD5.file(file_path).hexdigest[0, 8]
    end
  end
end

Liquid::Template.register_filter(Jekyll::AssetHashFilter)
