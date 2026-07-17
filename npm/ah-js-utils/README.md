# ah-js-utils

React storage hooks and small JSON helpers for AssistsHub (and any React) apps: **localStorage**, **sessionStorage**, and **cookies**, with a shared `{ value, setValue, reset }` API.

Published as `@assistshub/ah-js-utils`.

## Install

```bash
npm install @assistshub/ah-js-utils
```

### Peer dependencies

| Package     | Version |
|-------------|---------|
| `react`     | `>=18`  |
| `react-dom` | `>=18`  |

Compatible with React 18 and React 19.

`js-cookie` is a runtime dependency of this package (used by `useCookieStorage`).

## Quick start

```tsx
import {
  useLocalStorage,
  useSessionStorage,
  useCookieStorage,
} from '@assistshub/ah-js-utils'

function ThemeToggle() {
  const { value: theme, setValue, reset } = useLocalStorage<'dark' | 'light'>('theme', 'dark')

  return (
    <div>
      <p>Theme: {theme}</p>
      <button type="button" onClick={() => setValue(t => (t === 'dark' ? 'light' : 'dark'))}>
        Toggle
      </button>
      <button type="button" onClick={() => reset()}>
        Reset
      </button>
    </div>
  )
}

function SidebarState() {
  const { value: open, setValue } = useSessionStorage('sidebar_open', true)
  return (
    <button type="button" onClick={() => setValue(v => !v)}>
      Sidebar {open ? 'open' : 'closed'}
    </button>
  )
}

function SessionCookie() {
  const { value, setValue, reset } = useCookieStorage(
    '__APP_SESSION__',
    { token: null as string | null },
    { secure: true, expires: 365, path: '/' },
  )

  return (
    <div>
      <pre>{JSON.stringify(value)}</pre>
      <button type="button" onClick={() => setValue({ token: 'demo' })}>
        Sign in
      </button>
      <button type="button" onClick={() => reset()}>
        Sign out
      </button>
    </div>
  )
}
```

## API

All three storage hooks share the same return shape:

```ts
{
  value: T
  setValue: (next: T | ((prev: T) => T)) => void
  reset: () => void
}
```

- Values are **JSON-encoded** in storage.
- Missing / empty / invalid JSON falls back to `initialValue`.
- `typeof window === 'undefined'` returns `initialValue` and skips storage I/O (SSR-safe reads).

### `useLocalStorage(key, initialValue)`

Persists to `window.localStorage`.

```tsx
const { value, setValue, reset } = useLocalStorage('user_prefs', {
  theme: 'dark',
  lang: 'en',
})

setValue(prev => ({ ...prev, theme: 'light' }))
reset() // restores initialValue and removes the key
```

### `useSessionStorage(key, initialValue)`

Persists to `window.sessionStorage` (cleared when the tab/session ends).

```tsx
const { value: filter, setValue } = useSessionStorage<string>('offers_filter', '')
setValue('graphql')
```

### `useCookieStorage(key, initialValue, options?)`

Persists via [`js-cookie`](https://github.com/js-cookie/js-cookie). Default options:

```ts
{ secure: true, expires: 365, path: '/' }
```

```tsx
import type { CookieOptions } from '@assistshub/ah-js-utils'

const cookieOpts: CookieOptions = { secure: true, path: '/', expires: 30 }

const { value, setValue, reset } = useCookieStorage('prefs', { n: 0 }, cookieOpts)
```

`reset()` removes the cookie using `options.path` (or `'/'` if omitted).

### `encodeJson` / `decodeJson`

Small helpers used by the hooks; exported for reuse:

```ts
import { encodeJson, decodeJson } from '@assistshub/ah-js-utils'

const raw = encodeJson({ a: 1 }) // '{"a":1}'
const value = decodeJson(raw, { a: 0 }) // { a: 1 }
const fallback = decodeJson('{broken', { a: 0 }) // { a: 0 }
```

## Scripts

```bash
npm test
npm run test:coverage
npm run build
npm run typecheck
```

## Publishing (manual)

This package is prepared for a public npm release under the `@assistshub` scope. Suggested steps:

1. Create GitHub repo: [https://github.com/bielorusov/ah-js-utils](https://github.com/bielorusov/ah-js-utils)
2. Push the contents of this folder (or split from the monorepo)
3. `npm login`
4. `npm publish` (uses `"publishConfig": { "access": "public" }`)

Until published, consumers in this monorepo can install via:

```json
"@assistshub/ah-js-utils": "file:../ah-js-utils"
```

## License

MIT
