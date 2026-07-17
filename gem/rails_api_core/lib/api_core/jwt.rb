# frozen_string_literal: true

require 'jwt'

module ApiCore
  class JWT
    class << self
      def encode(payload)
        ::JWT.encode(
          payload,
          OpenSSL::PKey::RSA.new(ApiCore.config.jwt_private_key),
          'RS256'
        )
      rescue ::JWT::EncodeError => _e
        nil
      end

      def decode(token)
        ::JWT.decode(
          token,
          OpenSSL::PKey::RSA.new(ApiCore.config.jwt_public_key),
          ApiCore.config.jwt_validation,
          algorithm: 'RS256',
          typ: 'JWT'
        ).first
      rescue ::JWT::ExpiredSignature => _e
        nil
      rescue ::JWT::DecodeError => _e
        nil
      end
    end
  end
end
