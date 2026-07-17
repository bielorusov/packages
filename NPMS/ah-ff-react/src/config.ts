import type {
  AhFfConfigInput,
  CacheOptions,
  FeatureFlagEnv,
  ResolvedAhFfConfig,
} from './types'

export const DEFAULT_BASE_URL = 'https://cms.assistshub.com'
export const DEFAULT_POLLING_INTERVAL_MS = 30_000
export const DEFAULT_CACHE_STORAGE_KEY = 'ah-ff-react:flags'
export const VALID_ENVS: readonly FeatureFlagEnv[] = [
  'development',
  'test',
  'production',
] as const

const GRAPHQL_PATH = '/api/v1/external/feature-flags/graphql'
const SOCKET_PATH = '/api/v1/external/feature-flags/socket'

export function toWebSocketOrigin(httpOrigin: string): string {
  if (!httpOrigin) {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}`
    }
    return 'wss://cms.assistshub.com'
  }

  if (httpOrigin.startsWith('https://')) {
    return `wss://${httpOrigin.slice('https://'.length)}`
  }
  if (httpOrigin.startsWith('http://')) {
    return `ws://${httpOrigin.slice('http://'.length)}`
  }
  if (httpOrigin.startsWith('wss://') || httpOrigin.startsWith('ws://')) {
    return httpOrigin
  }
  return httpOrigin
}

export function buildGraphqlUrl(baseUrl: string): string {
  const origin = baseUrl.replace(/\/$/, '')
  return `${origin}${GRAPHQL_PATH}`
}

export function buildSocketUrl(baseUrl: string, socketUrl?: string): string {
  if (socketUrl) {
    return socketUrl.replace(/\/$/, '')
  }
  const wsOrigin = toWebSocketOrigin(baseUrl.replace(/\/$/, ''))
  return `${wsOrigin}${SOCKET_PATH}`
}

function resolveCache(
  cache: boolean | CacheOptions | undefined,
): { enabled: boolean; storageKey: string } {
  if (!cache) {
    return { enabled: false, storageKey: DEFAULT_CACHE_STORAGE_KEY }
  }
  if (cache === true) {
    return { enabled: true, storageKey: DEFAULT_CACHE_STORAGE_KEY }
  }
  return {
    enabled: true,
    storageKey: cache.storageKey ?? DEFAULT_CACHE_STORAGE_KEY,
  }
}

export function createConfig(input: AhFfConfigInput): ResolvedAhFfConfig {
  if (!input.clientKey || typeof input.clientKey !== 'string') {
    throw new Error('ah-ff-react: clientKey is required')
  }
  if (!VALID_ENVS.includes(input.env)) {
    throw new Error(
      `ah-ff-react: env must be one of ${VALID_ENVS.join(', ')}`,
    )
  }

  const baseUrl =
    input.baseUrl === undefined ? DEFAULT_BASE_URL : input.baseUrl
  const cache = resolveCache(input.cache)

  return {
    clientKey: input.clientKey,
    env: input.env,
    baseUrl,
    graphqlUrl: buildGraphqlUrl(baseUrl),
    socketUrl: buildSocketUrl(baseUrl, input.socketUrl),
    autoConnect: input.autoConnect ?? true,
    pollingIntervalMs: input.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS,
    enablePollingFallback: input.enablePollingFallback ?? true,
    cacheEnabled: cache.enabled,
    cacheStorageKey: cache.storageKey,
  }
}
