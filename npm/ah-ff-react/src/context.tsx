import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { clearFlagCache, readFlagCache, writeFlagCache } from './cache'
import { createConfig } from './config'
import { fetchFeatureFlagsSnapshot } from './graphqlClient'
import { flagsByNameMap } from './normalize'
import { createPollingController } from './polling'
import {
  createFeatureFlagsSocketClient,
  type SocketFactory,
} from './socketClient'
import type {
  AhFfConfigInput,
  ConnectionStatus,
  FeatureFlag,
  FeatureFlagsContextValue,
  ResolvedAhFfConfig,
} from './types'

export const FeatureFlagsContext =
  createContext<FeatureFlagsContextValue | null>(null)

export type FeatureFlagsProviderProps = {
  config: AhFfConfigInput | ResolvedAhFfConfig
  children: ReactNode
  /** @internal test seam */
  fetchImpl?: typeof fetch
  /** @internal test seam */
  socketFactory?: SocketFactory
}

function isResolvedConfig(
  config: AhFfConfigInput | ResolvedAhFfConfig,
): config is ResolvedAhFfConfig {
  return (
    'graphqlUrl' in config &&
    'socketUrl' in config &&
    'cacheEnabled' in config
  )
}

export function FeatureFlagsProvider({
  config: configInput,
  children,
  fetchImpl,
  socketFactory,
}: FeatureFlagsProviderProps) {
  const config = useMemo(
    () => (isResolvedConfig(configInput) ? configInput : createConfig(configInput)),
    [configInput],
  )

  const initialCache = useMemo(() => {
    if (!config.cacheEnabled) {
      return null
    }
    return readFlagCache(config.cacheStorageKey)
  }, [config.cacheEnabled, config.cacheStorageKey])

  const [flags, setFlags] = useState<FeatureFlag[]>(
    () => initialCache?.flags ?? [],
  )
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const applyFlags = useCallback(
    (next: FeatureFlag[]) => {
      if (!mountedRef.current) {
        return
      }
      setFlags(next)
      if (config.cacheEnabled) {
        writeFlagCache(config.cacheStorageKey, next)
      }
    },
    [config.cacheEnabled, config.cacheStorageKey],
  )

  const refresh = useCallback(async () => {
    try {
      const result = await fetchFeatureFlagsSnapshot(config, fetchImpl)
      if (!mountedRef.current) {
        return
      }
      applyFlags(result.flags)
      setError(null)
      setLoading(false)
    } catch (err) {
      if (!mountedRef.current) {
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setLoading(false)
    }
  }, [applyFlags, config, fetchImpl])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!config.autoConnect) {
      setLoading(false)
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('connecting')
    setLoading(true)

    const polling = createPollingController({
      intervalMs: config.pollingIntervalMs,
      onTick: () => refresh(),
    })

    const syncPolling = (connected: boolean) => {
      if (!config.enablePollingFallback) {
        polling.stop()
        return
      }
      if (connected) {
        polling.stop()
      } else {
        polling.start()
      }
    }

    const socket = createFeatureFlagsSocketClient(
      config,
      {
        onConnected: () => {
          if (cancelled) {
            return
          }
          setStatus('connected')
          setError(null)
          syncPolling(true)
        },
        onDisconnected: () => {
          if (cancelled) {
            return
          }
          setStatus('disconnected')
          syncPolling(false)
        },
        onError: (message) => {
          if (cancelled) {
            return
          }
          setError(message)
          setStatus('error')
          syncPolling(false)
        },
        onFlags: (nextFlags) => {
          if (cancelled) {
            return
          }
          applyFlags(nextFlags)
          setLoading(false)
        },
      },
      socketFactory,
    )

    void (async () => {
      await refresh()
      if (cancelled) {
        return
      }
      socket.connect()
      // Until WS joins, poll if enabled
      syncPolling(false)
    })()

    return () => {
      cancelled = true
      polling.stop()
      socket.disconnect()
    }
  }, [
    applyFlags,
    config,
    fetchImpl,
    refresh,
    socketFactory,
  ])

  const flagsByName = useMemo(() => flagsByNameMap(flags), [flags])

  const value = useMemo<FeatureFlagsContextValue>(
    () => ({
      flags,
      flagsByName,
      connected: status === 'connected',
      status,
      error,
      loading,
      refresh,
      config,
    }),
    [flags, flagsByName, status, error, loading, refresh, config],
  )

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

/** Clears the configured localStorage cache key. Useful in tests. */
export function clearFeatureFlagsCache(storageKey?: string): void {
  clearFlagCache(storageKey ?? 'ah-ff-react:flags')
}
