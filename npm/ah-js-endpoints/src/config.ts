import type { EndpointsConfigInput, ResolvedEndpointsConfig } from './types'

const GRAPHQL_PATH = '/api/v1/external/graphql'
export const DEFAULT_BASE_URL = 'https://cms.assistshub.com'

function resolveOrigin(inputOrigin: string | undefined): string {
  if (inputOrigin !== undefined) {
    return inputOrigin
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  throw new Error(
    'ah-js-endpoints: origin is required outside browser environments',
  )
}

export function buildGraphqlUrl(baseUrl: string): string {
  const origin = baseUrl.replace(/\/$/, '')
  return `${origin}${GRAPHQL_PATH}`
}

export function createConfig(input: EndpointsConfigInput): ResolvedEndpointsConfig {
  if (!input.clientKey || typeof input.clientKey !== 'string') {
    throw new Error('ah-js-endpoints: clientKey is required')
  }

  const baseUrl =
    input.baseUrl === undefined ? DEFAULT_BASE_URL : input.baseUrl
  const origin = resolveOrigin(input.origin)

  return {
    clientKey: input.clientKey,
    baseUrl,
    graphqlUrl: buildGraphqlUrl(baseUrl),
    origin,
  }
}
