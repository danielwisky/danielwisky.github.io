# Content-based cache-busting: generates a short hash of the file (instead of
# site.time, which changes on every build even if the asset hasn't, needlessly
# invalidating the browser cache on every deploy).
#
# Both filters are called once per page, but the content on disk doesn't
# change during a build, so the result is memoized. Without this, sass_hash
# re-read the ~20 _sass partials on every page: over a thousand file reads
# in a 53-page build.
require "digest"

module Jekyll
  module AssetHashFilter
    def self.cache
      @cache ||= {}
    end

    def asset_hash(path)
      AssetHashFilter.cache["asset:#{path}"] ||= begin
        file_path = File.join(Dir.pwd, path.to_s.sub(%r{\A/}, ""))

        if File.exist?(file_path)
          Digest::MD5.file(file_path).hexdigest[0, 8]
        else
          "0"
        end
      end
    end

    # style.css is compiled from dozens of partials in _sass/, so hashing
    # only the entry .scss detects no changes at all. Here the digest
    # covers the entry plus all the partials.
    def sass_hash(entry)
      AssetHashFilter.cache["sass:#{entry}"] ||= begin
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
end

Liquid::Template.register_filter(Jekyll::AssetHashFilter)
