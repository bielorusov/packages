# `@assistshub/ah-js-endpoints`

JavaScript/TypeScript SDK for AssistsHub CMS **external endpoint forms**.

It provides:
- Fetching `endpointFormConfig` (endpoint domains + custom field definitions)
- Client-side validation (`validateFieldValues`) matching the CMS rules
- Submitting `createOffer` (GraphQL) with correctly shaped `fieldValues`
- Optional React integration via `EndpointsProvider` and hooks

## Install

```bash
npm install @assistshub/ah-js-endpoints
```

Peer deps (React):
- `react` >= 18
- `react-dom` >= 18

## Quick start (React)

```tsx
import {
  EndpointsProvider,
  useEndpointFormConfig,
  useCreateOffer,
} from '@assistshub/ah-js-endpoints'

function App() {
  return (
    <EndpointsProvider
      config={{
        clientKey: import.meta.env.VITE_AH_ENDPOINTS_CLIENT_KEY,
        // '' means "call the same origin" (same-origin or Vite proxy).
        // Otherwise set the CMS host explicitly.
        baseUrl: '',
        // Optional for SSR/Node:
        // origin: 'https://your-frontend.example.com',
      }}
    >
      <OfferForm />
    </EndpointsProvider>
  )
}

function OfferForm() {
  const { formConfig, loading, error } = useEndpointFormConfig()
  const { createOffer, submitting, submitError } = useCreateOffer()

  if (loading) return <p>Loading…</p>
  if (error) return <p>Error: {error}</p>
  if (!formConfig) return null

  // Render inputs based on `formConfig.customFields`
  // Use each custom field `label` as the key in the object you pass to createOffer.
  const onSubmit = async (values: Record<string, string | string[]>) => {
    await createOffer(values)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit({
          // example
          name: 'Sample Name',
          email: 'jane@example.com',
          offer: '99.99',
        })
      }}
    >
      {submitError ? <p>{submitError}</p> : null}
      <button type="submit" disabled={submitting}>
        Submit
      </button>
    </form>
  )
}
```

## Configuration

```ts
import { createConfig } from '@assistshub/ah-js-endpoints'

const config = createConfig({
  clientKey: 'YOUR_ENDPOINT_CLIENT_KEY',
  baseUrl: '', // or 'https://cms.assistshub.com'
  // Required for SSR/Node usage:
  // origin: 'https://your-frontend.example.com',
})
```

You can pass either the object above or the input subset to `EndpointsProvider`:

```tsx
<EndpointsProvider config={config} />
```

### Header expectations

The CMS external endpoint requires:
- `X-Client-Key`: your endpoint client key
- `Origin`: a browser-generated header (or you must provide `origin` for SSR/Node)

Note: in browser environments, the SDK does **not** set `Origin` manually (browsers forbid this). The browser supplies it automatically for CORS requests.

## Equivalent curl

```bash
curl -X POST 'https://cms.assistshub.com/api/v1/external/graphql' \
  -H 'Content-Type: application/json' \
  -H 'X-Client-Key: YOUR_CLIENT_KEY' \
  -H 'Origin: https://your-frontend.example.com' \
  -d @- <<'EOF'
{
  "query": "mutation CreateOffer($input: CreateExternalOfferInput!) { createOffer(input: $input) { id domain createdAt displayFields { name label value } } }",
  "variables": {
    "input": {
      "fieldValues": [
        { "label": "name", "value": "Sample Name" },
        { "label": "email", "value": "jane@example.com" },
        { "label": "offer", "value": "99.99" }
      ]
    }
  }
}
EOF
```

## License

MIT

