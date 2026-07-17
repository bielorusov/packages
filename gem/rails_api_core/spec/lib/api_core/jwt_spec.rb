# frozen_string_literal: true

require 'spec_helper'

describe ApiCore::JWT do
  context 'With HASH' do
    let(:decoded_payload) { { data: { token: SecureRandom.uuid } }.deep_stringify_keys }
    let(:encoded_payload) { ApiCore::JWT.encode(decoded_payload) }

    describe '.encode' do
      it 'works' do
        expect(ApiCore::JWT.encode(decoded_payload)).to match(encoded_payload)
      end
    end

    describe '.decode' do
      it 'works' do
        expect(ApiCore::JWT.decode(encoded_payload)).to match(decoded_payload)
      end
    end
  end

  context 'With STRING' do
    let(:decoded_payload) { 'StringExample' }
    let(:encoded_payload) { ApiCore::JWT.encode(decoded_payload) }

    describe '.encode' do
      it 'works' do
        expect(ApiCore::JWT.encode(decoded_payload)).to match(encoded_payload)
      end
    end

    describe '.decode' do
      it 'works' do
        expect(ApiCore::JWT.decode(encoded_payload)).to match(decoded_payload)
      end
    end
  end
end
