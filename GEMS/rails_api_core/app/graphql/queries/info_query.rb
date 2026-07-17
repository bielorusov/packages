# frozen_string_literal: true

module Queries
  class InfoQuery < BaseQuery
    description 'Information about API'
    type Types::InfoType, null: false

    def resolve
      {
        name: ApiCore.config.name,
        git_tag: ENV.fetch('GIT_TAG') { 'Unknown' },
        app_version: ENV.fetch('APP_VERSION') { 'Unknown' },
        platform: ENV.fetch('PLATFORM') { 'Unknown' },
        version: ApiCore.config.version,
        core: ApiCore::VERSION,
        delivered_at: ApiCore.config.delivered_at,
        locales: ApiCore.config.locales,
        languages: ApiCore.config.languages.values,
        encoding: ApiCore.config.encoding,
        time_zone: ApiCore.config.time_zone,
        default_locale: ApiCore.config.default_locale,
        organization: ApiCore.config.organization,
        encrypt_request: ApiCore.config.encrypt_request,
        encrypt_response: ApiCore.config.encrypt_response
      }
    end
  end
end
