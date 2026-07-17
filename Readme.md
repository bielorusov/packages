# AssistsHub Packages

Shared npm packages and Ruby gems used by AssistsHub applications.

## npm packages

### `@assistshub/ah-js-endpoints`

SDK for loading external endpoint form configuration, validating field values,
and submitting offers. It also provides a React provider and hooks.

```bash
npm install @assistshub/ah-js-endpoints
```

See the [package documentation](npm/ah-js-endpoints/README.md) for configuration
and usage examples.

### `@assistshub/ah-js-utils`

React hooks for local storage, session storage, and cookies, plus JSON utility
functions.

```bash
npm install @assistshub/ah-js-utils
```

See the [package documentation](npm/ah-js-utils/README.md) for its API and usage
examples.

### `@assistshub/ah-ff-react`

React SDK for AssistsHub feature flags with GraphQL bootstrap, Phoenix
WebSocket updates, polling fallback, and optional local storage caching.

```bash
npm install @assistshub/ah-ff-react phoenix
```

See the [package documentation](npm/ah-ff-react/README.md) for provider setup,
configuration, and available hooks.

All npm packages require React 18 or newer. `ah-ff-react` additionally requires
Phoenix 1.7.

## Testing npm packages

Run commands from the `npm` directory:

```bash
cd npm
make test ah-js-endpoints
make test ah-js-utils
make test ah-ff-react
```

## Publishing npm packages

1. Set the desired package version in [`npm/versions.yml`](npm/versions.yml).
2. Log in to npm with `npm login`.
3. Publish the selected package:

```bash
cd npm
make publish ah-js-endpoints
```

Publishing first runs the selected package's tests. If any test fails,
publishing stops before the package version is changed or uploaded. A successful
test run updates `package.json` and `package-lock.json`, builds the package
through `prepublishOnly`, and publishes it publicly.

Run `make help` from the `npm` directory to list the available commands and
packages.

## Ruby gem

### `api-core`

Rails API core functionality shared by AssistsHub services.

```ruby
gem 'api-core'
```

See the [gem documentation](gem/rails_api_core/README.md) for installation
details.
