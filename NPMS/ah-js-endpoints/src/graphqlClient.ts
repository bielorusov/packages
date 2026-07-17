import { normalizeEndpointFormConfig, normalizeOffer } from './normalize'
import type {
  CreateOfferInput,
  EndpointFormConfig,
  EndpointFormConfigWire,
  Offer,
  OfferWire,
  ResolvedEndpointsConfig,
} from './types'

export const ENDPOINT_FORM_CONFIG_QUERY = `query EndpointFormConfig {
  endpointFormConfig {
    endpointType
    domains
    customFields {
      name
      label
      fieldType
      fieldOptionType
      fieldOptions
      isRequired
    }
  }
}`

export const CREATE_OFFER_MUTATION = `mutation CreateOffer($input: CreateExternalOfferInput!) {
  createOffer(input: $input) {
    id
    domain
    createdAt
    displayFields {
      name
      label
      value
    }
    endpointType
    archived
  }
}`

export class EndpointsFetchError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = 'EndpointsFetchError'
    this.code = options?.code
    this.status = options?.status
  }
}

type GraphqlResponse<T> = {
  data?: T
  errors?: Array<{
    message?: string
    extensions?: { code?: string }
  }>
}

async function postGraphql<TData>(
  config: Pick<ResolvedEndpointsConfig, 'graphqlUrl' | 'clientKey' | 'origin'>,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<TData> {
  let response: Response
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Key': config.clientKey,
    }

    // Browsers set the `Origin` header automatically for CORS requests and forbid
    // setting it from user-land fetch. Only set it for SSR/Node where it is absent.
    if (typeof window === 'undefined') {
      headers.Origin = config.origin
    }

    response = await fetchImpl(config.graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new EndpointsFetchError(`Network error: ${message}`)
  }

  let body: GraphqlResponse<TData>
  try {
    body = (await response.json()) as GraphqlResponse<TData>
  } catch {
    throw new EndpointsFetchError('Invalid JSON response from GraphQL', {
      status: response.status,
    })
  }

  if (!response.ok) {
    const message = body.errors?.[0]?.message ?? `HTTP ${response.status}`
    const code = body.errors?.[0]?.extensions?.code
    throw new EndpointsFetchError(message, { code, status: response.status })
  }

  if (body.errors?.length) {
    const first = body.errors[0]
    throw new EndpointsFetchError(first.message ?? 'GraphQL error', {
      code: first.extensions?.code,
      status: response.status,
    })
  }

  if (!body.data) {
    throw new EndpointsFetchError('GraphQL response is missing data', {
      status: response.status,
    })
  }

  return body.data
}

export async function fetchEndpointFormConfig(
  config: Pick<ResolvedEndpointsConfig, 'graphqlUrl' | 'clientKey' | 'origin'>,
  fetchImpl: typeof fetch = fetch,
): Promise<EndpointFormConfig> {
  const data = await postGraphql<{ endpointFormConfig: EndpointFormConfigWire }>(
    config,
    ENDPOINT_FORM_CONFIG_QUERY,
    {},
    fetchImpl,
  )

  return normalizeEndpointFormConfig(data.endpointFormConfig ?? {})
}

export async function submitCreateOffer(
  config: Pick<ResolvedEndpointsConfig, 'graphqlUrl' | 'clientKey' | 'origin'>,
  input: CreateOfferInput,
  fetchImpl: typeof fetch = fetch,
): Promise<Offer> {
  const data = await postGraphql<{ createOffer: OfferWire }>(
    config,
    CREATE_OFFER_MUTATION,
    { input },
    fetchImpl,
  )

  return normalizeOffer(data.createOffer ?? {})
}

