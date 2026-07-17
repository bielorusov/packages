# frozen_string_literal: true

require 'mongoid'

module ApiCore
  module Models
    class Keychain
      include Mongoid::Document
      include Mongoid::Timestamps

      EXPIRE_PERIOD = 72.hours

      field :client_keys, type: String
      field :server_keys, type: String
      field :signature,   type: String
      field :size,        type: Integer
      field :pattern,     type: String
      field :lifetime,    type: String

      index({ signature: 1 }, { unique: true, background: true })

      scope :active, -> { where(:lifetime.gt => Time.now.to_i) }

      validates :client_keys, :server_keys, :signature, presence: true
      validates :signature, uniqueness: true

      before_create :assign_lifetime

      class << self
        def generate(size: 2048, pattern: 'des3', signature: nil)
          new.tap do |doc|
            doc.keychain = ApiCore::Keychain.new(size: size, pattern: pattern, signature: signature)
          end
        end

        def generate!(size: 2048, pattern: 'des3', signature: nil)
          generate(size: size, pattern: pattern, signature: signature).tap(&:save!)
        end
      end

      # INFO: Assign fields from ApiCore::Keychain object
      def keychain=(keychain)
        tap do |doc|
          doc.signature   = keychain.signature
          doc.server_keys = keychain.encoded_server_keys
          doc.client_keys = keychain.encoded_client_keys
          doc.size        = keychain.size
          doc.pattern     = keychain.pattern
        end
      end

      # INFO: Return decoded client keys from Base64 Hash
      # Available keys: :pub, :prv, :sign
      def decoded_client_keys
        @decoded_client_keys ||= ApiCore::Keychain.decode_keys(client_keys)
      end

      # INFO: Return decoded server keys from Base64 Hash
      # Available keys: :pub, :prv, :sign
      def decoded_server_keys
        @decoded_server_keys ||= ApiCore::Keychain.decode_keys(server_keys)
      end

      # INFO: Expire current keychain
      def expire
        update_attribute(:lifetime, Time.now.to_i)
      end

      def expire_at
        Time.at(lifetime.to_i)
      end

      # INFO: Prolong for the period
      def prolong(period = EXPIRE_PERIOD)
        update_attribute(:lifetime, (Time.now + period).to_i)
      end

      private

      # INFO: Assign lifetme before create new Keychain
      def assign_lifetime
        tap do |doc|
          doc.lifetime = (Time.now + EXPIRE_PERIOD).to_i
        end
      end
    end
  end
end
