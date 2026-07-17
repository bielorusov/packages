# ah-ff-react

React SDK for AssistsHub CMS **feature flags**: GraphQL snapshot bootstrap + Phoenix WebSocket live updates, with reconnect-aware GraphQL polling fallback and optional `localStorage` cache.

## Install

```bash
npm install ah-ff-react phoenix
```

### Peer dependencies

| Package     | Version   |
|-------------|-----------|
| `react`     | `>=18`    |
| `react-dom` | `>=18`    |
| `phoenix`   | `^1.7.0`  |

Compatible with React 18 and React 19.

## Quick start

```tsx
import { FeatureFlagsProvider, useFeatureFlags, useBooleanFlag } from 'ah-ff-react'

function App() {
  return (
    <FeatureFlagsProvider
      config={{
        clientKey: import.meta.env.VITE_AH_FF_CLIENT_KEY,
        env: import.meta.env.VITE_AH_FF_CLIENT_ENV ?? 'development',
        // CMS host (open CORS on external feature-flags API) or '' for same-origin / Vite proxy:
        baseUrl: '',
        cache: true,
      }}
    >
      <FlagsBanner />
    </FeatureFlagsProvider>
  )
}

function FlagsBanner() {
  const { flags, connected, status, error, loading, refresh } = useFeatureFlags()
  const emailSignupEnabled = useBooleanFlag('FF_SIGN_UP_BY_EMAIL_ENABLED')

  if (loading) return <p>Loading flags…</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <p>WS: {connected ? 'connected' : status}</p>
      <p>Email signup: {emailSignupEnabled ? 'on' : 'off'}</p>
      <ul>
        {flags.map((flag) => (
          <li key={flag.name}>
            {flag.name}: {String(flag.value)} ({flag.valueType})
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
    </div>
  )
}
```

### Env vars (example)

```bash
VITE_AH_FF_CLIENT_KEY=ff-your-client-key
VITE_AH_FF_CLIENT_ENV=development
```

## Configuration

```ts
import { createConfig, FeatureFlagsProvider } from 'ah-ff-react'

const config = createConfig({
  clientKey: 'ff-…',
  env: 'development', // 'development' | 'test' | 'production'
  baseUrl: 'https://cms.assistshub.com', // or '' for same-origin
  socketUrl: undefined, // derived from baseUrl when omitted
  autoConnect: true,
  pollingIntervalMs: 30_000,
  enablePollingFallback: true,
  cache: true, // or { storageKey: 'my-app:ff' }
})

;<FeatureFlagsProvider config={config}>{/* … */}</FeatureFlagsProvider>
```

| Option | Default | Description |
|--------|---------|-------------|
| `clientKey` | — | Required `X-FF-Client-Key` / socket `client_key` |
| `env` | — | `development` \| `test` \| `production` |
| `baseUrl` | `https://cms.assistshub.com` | HTTP origin used for GraphQL (`…/api/v1/external/feature-flags/graphql`) |
| `socketUrl` | derived (`http→ws`, `https→wss`) | Phoenix endpoint **without** `/websocket` suffix |
| `autoConnect` | `true` | Fetch snapshot + open WS on mount |
| `pollingIntervalMs` | `30000` | GraphQL poll interval while WS is not connected |
| `enablePollingFallback` | `true` | Poll GraphQL when socket is down |
| `cache` | `false` | Persist flags in `localStorage` |

## Hooks

| Hook | Returns |
|------|---------|
| `useFeatureFlags()` | `{ flags, flagsByName, connected, status, error, loading, refresh, config }` |
| `useFeatureFlag(name)` | `{ flag, loading, error }` |
| `useFeatureFlagValue(name, default?)` | flag value or default |
| `useBooleanFlag(name, default?)` | `boolean` |
| `useNumberFlag(name, default?)` | `number` |
| `useStringFlag(name, default?)` | `string` |

## Utilities (non-hook)

```ts
import {
  isFlagEnabled,
  getFlagValue,
  getBooleanFlag,
  getNumberFlag,
  getStringFlag,
} from 'ah-ff-react'

isFlagEnabled(flags, 'FF_SIGN_UP_BY_EMAIL_ENABLED')
getNumberFlag(flags, 'FF_MAX_ITEMS', 0)
getStringFlag(flags, 'FF_BANNER_TEXT', '')
```

Public flag shape is always camelCase (`valueType`), whether data came from GraphQL or WebSocket (`value_type` is normalized).

## How it works

1. Optional cache hydrate from `localStorage`
2. `POST` GraphQL `featureFlags { name valueType value }`
3. Connect Phoenix socket → channel `flags`
4. Apply `flags_snapshot` / `flags_updated` events
5. If the socket is not connected and polling fallback is enabled, poll GraphQL on an interval until the socket rejoins

```
GraphQL POST  {baseUrl}/api/v1/external/feature-flags/graphql
  Headers: X-FF-Client-Key, X-FF-Client-Env

WebSocket     {wsOrigin}/api/v1/external/feature-flags/socket
  params: { client_key, env }
  channel: "flags"
  events: flags_snapshot, flags_updated
```

## CORS / browser access

The cms-api **external feature-flags API** allows any browser origin:

- HTTP: `Access-Control-Allow-Origin: *` on `/api/v1/external/feature-flags/*` (including OPTIONS preflight)
- WebSocket: origin checks disabled for `/api/v1/external/feature-flags/socket` only

Auth is still `X-FF-Client-Key` + `X-FF-Client-Env` (treat the client key like a public/publishable key). Other CMS GraphQL routes are unchanged and do not enable CORS.

You can therefore point `baseUrl` at the CMS host from any frontend:

```ts
baseUrl: 'https://cms.assistshub.com'
```

Same-origin / proxy setups remain valid if you prefer not to call the CMS host directly:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      ws: true,
    },
  },
}
```

Then use `baseUrl: ''` so requests go to `/api/v1/external/feature-flags/...`.

## Equivalent curl

```bash
curl -X POST 'https://cms.assistshub.com/api/v1/external/feature-flags/graphql' \
  -H 'Content-Type: application/json' \
  -H 'X-FF-Client-Key: ff-…' \
  -H 'X-FF-Client-Env: production' \
  -d '{"query":"query FeatureFlags { featureFlags { name valueType value } }","variables":{}}'
```

## Scripts

```bash
npm test
npm run test:coverage
npm run build
npm run typecheck
```

## Publishing (manual)

This package is prepared for a public npm release under your account. Suggested steps:

1. Create GitHub repo: [https://github.com/bielorusov/ah-ff-react](https://github.com/bielorusov/ah-ff-react)
2. Push the contents of this folder (or split from the monorepo)
3. `npm login`
4. `npm publish` (uses `"publishConfig": { "access": "public" }`)

## License

MIT
