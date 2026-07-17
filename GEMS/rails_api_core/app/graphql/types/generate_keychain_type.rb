# frozen_string_literal: true

module Types
  class GenerateKeychainType < BaseObject
    field :keys, String, null: false
    field :size, Integer, null: false
    field :pattern, String, null: false
    field :expire_at, String, null: false
  end
end
