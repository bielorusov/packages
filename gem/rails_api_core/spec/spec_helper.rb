# frozen_string_literal: true

ENV['RACK_ENV'] = 'test'
ENV['RAILS_ENV'] = 'test'

require 'rails'
require 'pry'
require 'factory_bot'

require_relative '../lib/api_core'
require_relative '../config/initializers/mongo'

ApiCore.configure do |config|
  config.jwt_private_key = OpenSSL::PKey::RSA.generate 1024 # 2048 recommended
  config.jwt_public_key = config.jwt_private_key.public_key
end

# INFO: Load Factories for FactoryBot
Dir[File.join(File.dirname(__FILE__), 'factories', '*.rb')].each { |file| require file }

RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods

  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
end
