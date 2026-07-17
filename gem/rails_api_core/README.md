# ApiCore

Shared Rails API foundations for AssistsHub services. The gem provides:

- API metadata configuration and root endpoint
- GraphQL base types, resolvers, controller, and development GraphiQL route
- RS256 JWT encoding and decoding
- RSA key generation and two-way payload encryption
- Optional Mongoid-backed keychain persistence

## Installation

Add the gem and its currently required integrations to your application's
`Gemfile`:

```ruby
gem 'api-core', require: 'api-core'
gem 'graphql'
gem 'jwt'
gem 'mongoid'

group :development do
  gem 'graphiql-rails'
end
```

Then install the dependencies:

```bash
bundle install
```

The published gem name and Ruby entrypoint use `api-core` with a hyphen.

## Configuration

Create `config/initializers/api_core.rb`:

```ruby
ApiCore.configure do |config|
  config.name = 'Offers API'
  config.version = '1.0.0'
  config.organization = 'AssistsHub'
  config.delivered_at = Time.current

  # InfoQuery currently reads this setting directly.
  config.locales = ApiCore.config.available_locales

  config.jwt_private_key = ENV.fetch('JWT_PRIVATE_KEY')
  config.jwt_public_key = ENV.fetch('JWT_PUBLIC_KEY')
  config.jwt_validation = true

  config.encrypt_request = false
  config.encrypt_response = false
end
```

`JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` must contain PEM-encoded RSA keys. For
multiline keys stored with escaped newlines, normalize them before assigning:

```ruby
config.jwt_private_key = ENV.fetch('JWT_PRIVATE_KEY').gsub('\n', "\n")
config.jwt_public_key = ENV.fetch('JWT_PUBLIC_KEY').gsub('\n', "\n")
```

Locale metadata is loaded from `config/i18n.yml` in the gem:

```ruby
ApiCore.config.default_locale
ApiCore.config.available_locales
ApiCore.config.languages
ApiCore.config.time_zone
ApiCore.config.encoding
```

Configuration is backed by `OpenStruct`, so applications can add their own
settings.

## Rails endpoints

Loading the engine adds these routes:

- `GET /` returns configured API metadata.
- `POST /graphql` executes a request with `DefaultApiSchema`.
- `GET /graphiql` opens GraphiQL in development.

Example root response:

```json
{
  "name": "Offers API",
  "git_tag": "v1.4.0",
  "app_version": "1.4.0",
  "platform": "production"
}
```

`git_tag`, `app_version`, and `platform` come from the `GIT_TAG`,
`APP_VERSION`, and `PLATFORM` environment variables. Missing values are
reported as `"Unknown"`.

## GraphQL setup

The controller expects the host application to define `DefaultApiSchema`.
Register the supplied API information resolver in the application's query
type:

```ruby
# app/graphql/types/query_type.rb
module Types
  class QueryType < Types::BaseObject
    field :info, resolver: Queries::InfoQuery
  end
end
```

```ruby
# app/graphql/default_api_schema.rb
class DefaultApiSchema < GraphQL::Schema
  query Types::QueryType
end
```

Query the endpoint with:

```graphql
query ApiInfo {
  info {
    name
    version
    core
    deliveredAt
    locales
    encoding
    timeZone
    defaultLocale
    organization
    encryptRequest
    encryptResponse
  }
}
```

The gem also provides reusable GraphQL foundations:

- `Types::BaseObject`, `Types::BaseField`, and `Types::BaseArgument`
- `Types::BaseInputObject`, `Types::BaseConnection`, and `Types::BaseEdge`
- `Queries::BaseQuery`
- `Mutations::BaseMutation`

Authentication and authorization are application responsibilities. Extend the
GraphQL controller or resolvers to add the current principal to GraphQL
context and enforce access rules.

## JWT usage

JWTs use the RS256 algorithm and the keys configured in the initializer:

```ruby
payload = {
  sub: current_user.id.to_s,
  exp: 1.hour.from_now.to_i
}

token = ApiCore::JWT.encode(payload)
decoded_payload = ApiCore::JWT.decode(token)

if decoded_payload
  user_id = decoded_payload.fetch('sub')
else
  # Invalid, malformed, or expired token.
end
```

`encode` returns `nil` when encoding fails. `decode` returns `nil` for invalid
or expired tokens; it does not render an HTTP or GraphQL error automatically.

## Payload encryption

Create a keychain for two-way client/server encryption:

```ruby
keychain = ApiCore::Keychain.new(
  size: 2048,
  pattern: 'des3'
)

# Send these keys to the client over a trusted channel.
client_keys = keychain.client_keys

# Keep these keys on the server.
server_keys = keychain.server_keys
```

Encrypt a client payload and decrypt it on the server:

```ruby
encryptor = ApiCore::Encryptor.new(
  server_keys.fetch(:prv),
  client_keys.fetch(:pub),
  keychain.signature,
  'json'
)

encrypted = encryptor.encrypt(
  action: 'create_offer',
  amount: 125
)

decrypted = encryptor.decrypt(encrypted)
# => { action: "create_offer", amount: 125 }
```

Encrypt a server response and decrypt it with the client key pair:

```ruby
encryptor = ApiCore::Encryptor.new(
  client_keys.fetch(:prv),
  server_keys.fetch(:pub),
  keychain.signature,
  'json'
)
```

The encrypted value is Base64-encoded. RSA can only encrypt payloads smaller
than the selected key size permits, so this helper is intended for small
payloads or key exchange rather than large documents.

Key hashes can be serialized for transport or storage:

```ruby
encoded = ApiCore::Keychain.encode_keys(client_keys)
decoded = ApiCore::Keychain.decode_keys(encoded)
```

## Persisting keychains with Mongoid

Configure Mongoid in the host Rails application, then generate and save a
keychain:

```ruby
keychain = ApiCore::Models::Keychain.generate!(
  size: 2048,
  pattern: 'des3',
  signature: SecureRandom.uuid
)

keychain.decoded_client_keys
keychain.decoded_server_keys
keychain.expire_at
```

Stored keychains expire after 72 hours by default:

```ruby
ApiCore::Models::Keychain.active

keychain.prolong
keychain.prolong(24.hours)
keychain.expire
```

## Development

Install dependencies and run the test suite:

```bash
bundle install
bundle exec rake
```

The default Rake task runs the RSpec suite.

## License

The gem is available under the
[MIT License](https://opensource.org/licenses/MIT).
