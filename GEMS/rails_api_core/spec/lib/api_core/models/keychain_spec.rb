# frozen_string_literal: true

require 'spec_helper'

describe ApiCore::Models::Keychain do
  let(:keychain) { create(:keychain) }

  describe 'Encryptor#encrypt' do
    it 'encrypt data with client public key' do
      # binding.pry
      # expect(encrypted_payload).to_not be_empty
    end
  end
end
