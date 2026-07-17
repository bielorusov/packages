# frozen_string_literal: true

module Types
  class InfoType < BaseObject
    field :name, String, null: true
    field :version, String, null: true
    field :core, String, null: true
    field :delivered_at, GraphQL::Types::ISO8601DateTime, null: true
    field :locales, [String], null: true
    field :languages, [Types::LanguageType], null: true
    field :encoding, String, null: true
    field :time_zone, String, null: true
    field :default_locale, String, null: true
    field :organization, String, null: true
    field :encrypt_request, Boolean, null: true
    field :encrypt_response, Boolean, null: true
  end
end
