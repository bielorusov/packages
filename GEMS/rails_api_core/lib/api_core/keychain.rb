# frozen_string_literal: true

require 'openssl'
require 'base64'

module ApiCore
  class Keychain
    attr_reader :signature, :size, :pattern

    def initialize(size: 512, pattern: 'des3', signature: SecureRandom.uuid)
      @srv_rsa    = OpenSSL::PKey::RSA.new(size)
      @srv_cipher = OpenSSL::Cipher::Cipher.new(pattern)
      @cli_rsa    = OpenSSL::PKey::RSA.new(size)
      @cli_cipher = OpenSSL::Cipher::Cipher.new(pattern)
      @signature  = signature.presence || SecureRandom.uuid
      @size       = size
      @pattern    = pattern
    end

    # Frontend <=> Backend:
    # Encrypt with pub on FE, decrypt with prv on BE
    def client_keys
      @client_keys ||= {
        prv: @srv_rsa.to_pem(@srv_cipher, signature),  # For decrypt BE data
        pub: @cli_rsa.public_key.to_pem,               # For Encrypt FE data
        sign: signature                                # signature
      }
    end

    # Backend => Frontend
    # Encrypt with pub on BE, decrypt with prv on FE
    def server_keys
      @server_keys ||= {
        prv: @cli_rsa.to_pem(@cli_cipher, signature), # For decrypt FE data
        pub: @srv_rsa.public_key.to_pem,              # For Encrypt BE data
        sign: signature                               # Password
      }
    end

    def encoded_client_keys
      @encoded_client_keys ||= ApiCore::Keychain.encode_keys(client_keys)
    end

    def encoded_server_keys
      @encoded_server_keys ||= ApiCore::Keychain.encode_keys(server_keys)
    end

    class << self
      def encode_keys(keys)
        Base64.strict_encode64(keys.to_json)
        # keys.each_with_object({}) do |vals, memo|
        #   memo[vals.first] = Base64.strict_encode64(vals.second)
        # end
      end

      def decode_keys(keys)
        JSON.parse(Base64.strict_decode64(keys)).deep_symbolize_keys
        # keys.each_with_object({}) do |vals, memo|
        #   memo[vals.first] = Base64.strict_decode64(vals.second)
        # end
      end
    end
  end
end
