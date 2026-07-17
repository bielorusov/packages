import { normalizeFlags } from './normalize'
import type { FeatureFlag, FeatureFlagWire, ResolvedAhFfConfig } from './types'

export const FEATURE_FLAGS_QUERY = `query FeatureFlags {
  featureFlags {
    name
    valueType
    value
  }
}`

export type GraphqlSnapshotResult = {
  flags: FeatureFlag[]
}

export class FeatureFlagsFetchError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = 'FeatureFlagsFetchError'
    this.code = options?.code
    this.status = options?.status
  }
}

type GraphqlResponse = {
  data?: {
    featureFlags?: FeatureFlagWire[]
  }
  errors?: Array<{
    message?: string
    extensions?: { code?: string }
  }>
}

export async function fetchFeatureFlagsSnapshot(
  config: Pick<ResolvedAhFfConfig, 'graphqlUrl' | 'clientKey' | 'env'>,
  fetchImpl: typeof fetch = fetch,
): Promise<GraphqlSnapshotResult> {
  let response: Response
  try {
    response = await fetchImpl(config.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FF-Client-Key': config.clientKey,
        'X-FF-Client-Env': config.env,
      },
      body: JSON.stringify({
        query: FEATURE_FLAGS_QUERY,
        variables: {},
      }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new FeatureFlagsFetchError(`Network error: ${message}`)
  }

  let body: GraphqlResponse
  try {
    body = (await response.json()) as GraphqlResponse
  } catch {
    throw new FeatureFlagsFetchError('Invalid JSON response from GraphQL', {
      status: response.status,
    })
  }

  if (!response.ok) {
    const message = body.errors?.[0]?.message ?? `HTTP ${response.status}`
    const code = body.errors?.[0]?.extensions?.code
    throw new FeatureFlagsFetchError(message, {
      code,
      status: response.status,
    })
  }

  if (body.errors?.length) {
    const first = body.errors[0]
    throw new FeatureFlagsFetchError(first.message ?? 'GraphQL error', {
      code: first.extensions?.code,
      status: response.status,
    })
  }

  return {
    flags: normalizeFlags(body.data?.featureFlags),
  }
}
