# frozen_string_literal: true

module Queries
  class GenerateKeychainQuery < BaseQuery
    description 'Generate Private/Public Client <=> Server keys'

    type Types::GenerateKeychainType, null: false

    argument :size, Integer, required: false
    argument :pattern, String, required: false
    argument :signature, String, required: false

    def resolve(size: 2048, pattern: 'des3', signature: nil)
      @size = size
      @pattern = pattern
      @signature = signature

      {
        keys: keychain.client_keys,
        size: keychain.size,
        pattern: keychain.pattern,
        expire_at: keychain.expire_at
      }
    end

    private

    def keychain
      @keychain ||= ApiCore::Models::Keychain.generate!(size: @size, pattern: @pattern, signature: @signature)
    end
  end
end

