# frozen_string_literal: true

require 'spec_helper'

describe ApiCore::Keychain do
  let(:keychain) { ApiCore::Keychain.new }
  let(:server_keys) { keychain.server_keys }
  let(:client_keys) { keychain.client_keys }

  describe 'Keychain#server_keys' do
    context 'signature [sign]' do
      it 'similar between Client and Server' do
        expect(server_keys[:sign]).to eq(client_keys[:sign])
      end
    end

    context 'private key' do
      it 'not empty' do
        expect(server_keys[:prv]).to_not be_empty
      end

      it 'has valid content' do
        expect(server_keys[:prv]).to include('-----BEGIN RSA PRIVATE KEY-----')
      end
    end

    context 'public key' do
      it 'not empty' do
        expect(client_keys[:pub]).to_not be_empty
      end

      it 'has valid content' do
        expect(client_keys[:pub]).to include('-----BEGIN PUBLIC KEY-----')
      end
    end
  end

  describe 'Keychain#client_keys' do
    context 'private key' do
      it 'not empty' do
        expect(client_keys[:prv]).to_not be_empty
      end

      it 'has valid content' do
        expect(client_keys[:prv]).to include('-----BEGIN RSA PRIVATE KEY-----')
      end
    end

    context 'public key' do
      it 'not empty' do
        expect(client_keys[:pub]).to_not be_empty
      end

      it 'has valid content' do
        expect(client_keys[:pub]).to include('-----BEGIN PUBLIC KEY-----')
      end
    end
  end

  describe 'Encoding Keychain keys' do
    let(:encoded_server_keys) { Base64.strict_encode64(keychain.server_keys.to_json) }
    let(:encoded_client_keys) { Base64.strict_encode64(keychain.client_keys.to_json) }

    describe 'Keychain.encode_keys' do
      it 'encode keys to Base64 strict' do
        expect(ApiCore::Keychain.encode_keys(server_keys)).to eq(encoded_server_keys)
        expect(ApiCore::Keychain.encode_keys(client_keys)).to eq(encoded_client_keys)
      end
    end

    describe 'Keychain.decode_keys' do
      it 'decode keys from Base64 strict' do
        expect(ApiCore::Keychain.decode_keys(encoded_server_keys)).to eq(server_keys)
        expect(ApiCore::Keychain.decode_keys(encoded_client_keys)).to eq(client_keys)
      end
    end
  end
end
