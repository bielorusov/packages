# frozen_string_literal: true

module ApiCore
  class Config < OpenStruct
    def default_locale
      I18n.default_locale
    end

    def i18n
      @i18n ||= YAML.load_file(
        File.join(ApiCore.gem_root, 'config/i18n.yml')
      ).with_indifferent_access
    end

    def available_locales
      i18n[:locales].keys.map(&:to_sym)
    end

    def languages
      i18n[:locales]
    end

    def default_locale
      i18n[:default_locale].to_sym
    end

    def time_zone
      i18n[:time_zone]
    end

    def encoding
      'utf-8'
    end
  end

  class << self
    def gem_root
      Gem::Specification.find_by_name('api-core').gem_dir
    end

    def configure(&_block)
      yield(config)
    end

    def config
      @config ||= Config.new
    end
  end
end
