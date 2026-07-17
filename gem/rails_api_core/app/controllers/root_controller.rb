# frozen_string_literal: true

class RootController < ApplicationController
  def index
    render json: {
      name: ApiCore.config.name,
      git_tag: ENV.fetch('GIT_TAG') { 'Unknown' },
      app_version: ENV.fetch('APP_VERSION') { 'Unknown' },
      platform: ENV.fetch('PLATFORM') { 'Unknown' }
    }
  end
end
