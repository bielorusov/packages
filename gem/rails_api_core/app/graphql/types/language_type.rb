# frozen_string_literal: true

module Types
  class LanguageType < BaseObject
    field :name, String, null: true
    field :label, String, null: true
    field :aliases, [String], null: true
  end
end
