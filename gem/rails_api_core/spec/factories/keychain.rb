# frozen_string_literal: true

FactoryBot.define do
  factory :keychain, class: 'ApiCore::Models::Keychain' do
    keychain { ApiCore::Keychain.new }
  end
end
