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

    # O style.css é compilado a partir de dezenas de partials em _sass/, então
    # hashear só o .scss de entrada não detecta mudança nenhuma. Aqui o digest
    # cobre a entrada mais todas as partials.
    def sass_hash(entry)
      entry_path = File.join(Dir.pwd, entry.to_s.sub(%r{\A/}, ""))
      files = [entry_path] + Dir.glob(File.join(Dir.pwd, "_sass", "**", "*.s[ac]ss")).sort

      digest = Digest::MD5.new
      files.each do |file|
        next unless File.file?(file)

        digest << File.read(file)
      end

      digest.hexdigest[0, 8]
    end
  end
end

Liquid::Template.register_filter(Jekyll::AssetHashFilter)
