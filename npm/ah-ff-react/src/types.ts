export type FeatureFlagEnv = 'development' | 'test' | 'production'

export type FeatureFlagValueType = 'boolean' | 'text' | 'number'

export type FeatureFlagValue = boolean | string | number

export type FeatureFlag = {
  name: string
  valueType: FeatureFlagValueType
  value: FeatureFlagValue
}

/** Wire shape from GraphQL (camelCase) or Phoenix channel (snake_case). */
export type FeatureFlagWire = {
  name: string
  valueType?: FeatureFlagValueType | string
  value_type?: FeatureFlagValueType | string
  value: FeatureFlagValue
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export type CacheOptions = {
  storageKey?: string
}

export type AhFfConfigInput = {
  clientKey: string
  env: FeatureFlagEnv
  /** HTTP(S) origin, e.g. https://cms.assistshub.com or '' for same-origin. */
  baseUrl?: string
  /** Full Phoenix socket path without /websocket suffix. */
  socketUrl?: string
  autoConnect?: boolean
  pollingIntervalMs?: number
  enablePollingFallback?: boolean
  cache?: boolean | CacheOptions
}

export type ResolvedAhFfConfig = {
  clientKey: string
  env: FeatureFlagEnv
  baseUrl: string
  graphqlUrl: string
  socketUrl: string
  autoConnect: boolean
  pollingIntervalMs: number
  enablePollingFallback: boolean
  cacheEnabled: boolean
  cacheStorageKey: string
}

export type FeatureFlagsContextValue = {
  flags: FeatureFlag[]
  flagsByName: Record<string, FeatureFlag>
  connected: boolean
  status: ConnectionStatus
  error: string | null
  loading: boolean
  refresh: () => Promise<void>
  config: ResolvedAhFfConfig
}
