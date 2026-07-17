# frozen_string_literal: true

require 'spec_helper'

describe ApiCore::Encryptor do
  let(:keychain) { ApiCore::Keychain.new }
  let(:server_keys) { keychain.server_keys }
  let(:client_keys) { keychain.client_keys }
  let(:signature) { keychain.signature }
  let(:payload) { { name: 'Yokihiro Matsumoto', details: { age: 56 } } }

  context 'When Client sending payload to the Server' do
    let(:encryptor) { ApiCore::Encryptor.new(server_keys[:prv], client_keys[:pub], signature, 'json') }
    let(:encrypted_payload) { encryptor.encrypt(payload) }
    let(:decrypted_payload) { encryptor.decrypt(encrypted_payload) }

    describe 'Encryptor#encrypt' do
      it 'encrypt data with client public key' do
        expect(encrypted_payload).to_not be_empty
      end
    end

    describe 'Encryptor#decrypt' do
      it 'decrypt data with server private key' do
        expect(decrypted_payload).to match(payload)
      end
    end
  end

  context 'When Server responding to the Client' do
    let(:encryptor) { ApiCore::Encryptor.new(client_keys[:prv], server_keys[:pub], signature, 'json') }
    let(:encrypted_payload) { encryptor.encrypt(payload) }
    let(:decrypted_payload) { encryptor.decrypt(encrypted_payload) }

    describe 'Encryptor#encrypt' do
      it 'encrypt data with server public key' do
        expect(encrypted_payload).to_not be_empty
      end
    end

    describe 'Encryptor#decrypt' do
      it 'decrypt data with client private key' do
        expect(decrypted_payload).to match(payload)
      end
    end
  end
end
