# frozen_string_literal: true

lib = File.expand_path('lib', __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'api_core/version'

Gem::Specification.new do |spec|
  spec.name        = 'api-core'
  spec.version     = ApiCore::VERSION
  spec.authors     = ['Dmytro Bielorusov']
  spec.email       = ['dmytro.bielorusov@gmail.com']

  spec.summary     = 'Core of APIs based on rails'
  spec.description = 'Core of APIs based on rails'
  spec.homepage    = 'https://bielorusov.com'
  spec.license     = 'MIT'

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = %w[lib]

  spec.add_dependency 'rails', '~> 7.2.1'
  spec.add_development_dependency 'graphql'
  spec.add_development_dependency 'jwt'
  spec.add_development_dependency 'rake'
  spec.add_development_dependency 'rspec'
  spec.add_development_dependency 'factory_bot'
end
