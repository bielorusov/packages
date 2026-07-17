# frozen_string_literal: true

require 'openssl'
require 'base64'

module ApiCore
  class Encryptor
    attr_reader :prv_rsa, :pub_rsa, :encrypted_data, :decrypted_data, :payload_format

    def initialize(prv_key, pub_key, psw = '', payload_format = 'json')
      @prv_rsa = OpenSSL::PKey::RSA.new(prv_key, psw)
      @pub_rsa = OpenSSL::PKey::RSA.new(pub_key)
      @payload_format = payload_format
    end

    def encrypt(payload)
      Base64.strict_encode64(pub_rsa.public_encrypt(format_encrypted_data(payload)))
    end

    def decrypt(payload)
      format_decrypted_data(prv_rsa.private_decrypt(Base64.strict_decode64(payload)))
    end

    private

    def format_encrypted_data(payload)
      case payload_format
      when 'json'
        payload.to_json
      else
        payload
      end
    end

    def format_decrypted_data(payload)
      case payload_format
      when 'json'
        JSON.parse(payload).deep_symbolize_keys
      else
        payload
      end
    end
  end
end
