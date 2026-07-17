# frozen_string_literal: true

Mongoid::Config.belongs_to_required_by_default = false
Mongo::Logger.logger.level = Logger::FATAL
Mongoid.raise_not_found_error = false

Mongoid.configure do |config|
  config.clients.default = {
    hosts: ENV.fetch('MONGO_HOSTS', 'mongodb://localhost:27017'),
    database: ENV.fetch('MONGO_DB_NAME', 'identystub_development'),
    options: {
      server_selection_timeout: ENV.fetch('MONGO_TIMEOUT', '1').to_i
    }
  }
end
