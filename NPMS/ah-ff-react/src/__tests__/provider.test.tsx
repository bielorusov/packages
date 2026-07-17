import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FeatureFlagsProvider,
  clearFeatureFlagsCache,
} from '../context'
import {
  useBooleanFlag,
  useFeatureFlag,
  useFeatureFlagValue,
  useFeatureFlags,
  useNumberFlag,
  useStringFlag,
} from '../hooks'
import type { SocketFactory } from '../socketClient'
import { writeFlagCache } from '../cache'

const CACHE_KEY = 'ah-ff-provider-test'

function createMockSocketFactory(options?: {
  joinStatus?: 'ok' | 'error'
}): {
  factory: SocketFactory
  emitUpdated: (flags: unknown[]) => void
  triggerClose: () => void
} {
  let updatedHandler: ((payload: { flags?: unknown[] }) => void) | null = null
  let onClose: (() => void) | null = null

  const factory: SocketFactory = () => {
    const channel = {
      join: () => {
        const chain = {
          receive: (status: string, cb: (resp?: unknown) => void) => {
            if (status === (options?.joinStatus ?? 'ok')) {
              queueMicrotask(() => cb())
            }
            return chain
          },
        }
        return chain
      },
      on: (event: string, cb: (payload: { flags?: unknown[] }) => void) => {
        if (event === 'flags_updated') updatedHandler = cb
      },
      leave: vi.fn(),
    }

    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      channel: () => channel,
      onClose: (cb: () => void) => {
        onClose = cb
      },
      onError: vi.fn(),
    }
  }

  return {
    factory,
    emitUpdated: (flags) => updatedHandler?.({ flags }),
    triggerClose: () => onClose?.(),
  }
}

function FlagsProbe() {
  const { flags, connected, status, error, loading } = useFeatureFlags()
  const { flag } = useFeatureFlag('FF_A')
  const value = useFeatureFlagValue('FF_A', false)
  const bool = useBooleanFlag('FF_A')
  const num = useNumberFlag('FF_NUM', 0)
  const text = useStringFlag('FF_TEXT', '')

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="connected">{String(connected)}</div>
      <div data-testid="status">{status}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="count">{flags.length}</div>
      <div data-testid="flag">{flag ? String(flag.value) : 'missing'}</div>
      <div data-testid="value">{String(value)}</div>
      <div data-testid="bool">{String(bool)}</div>
      <div data-testid="num">{String(num)}</div>
      <div data-testid="text">{text}</div>
    </div>
  )
}

afterEach(() => {
  cleanup()
  clearFeatureFlagsCache(CACHE_KEY)
  vi.useRealTimers()
})

describe('FeatureFlagsProvider', () => {
  it('loads GraphQL snapshot and connects via socket', async () => {
    const mock = createMockSocketFactory()
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          featureFlags: [
            { name: 'FF_A', valueType: 'boolean', value: true },
            { name: 'FF_NUM', valueType: 'number', value: 5 },
            { name: 'FF_TEXT', valueType: 'text', value: 'hi' },
          ],
        },
      }),
    })

    render(
      <FeatureFlagsProvider
        config={{
          clientKey: 'ff-key',
          env: 'development',
          baseUrl: 'https://cms.assistshub.com',
          enablePollingFallback: false,
        }}
        fetchImpl={fetchImpl}
        socketFactory={mock.factory}
      >
        <FlagsProbe />
      </FeatureFlagsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('3')
    })
    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('true')
    })
    expect(screen.getByTestId('flag').textContent).toBe('true')
    expect(screen.getByTestId('bool').textContent).toBe('true')
    expect(screen.getByTestId('num').textContent).toBe('5')
    expect(screen.getByTestId('text').textContent).toBe('hi')
  })

  it('hydrates from cache and persists updates', async () => {
    writeFlagCache(CACHE_KEY, [
      { name: 'FF_A', valueType: 'boolean', value: false },
    ])

    const mock = createMockSocketFactory()
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          featureFlags: [
            { name: 'FF_A', valueType: 'boolean', value: true },
          ],
        },
      }),
    })

    render(
      <FeatureFlagsProvider
        config={{
          clientKey: 'ff-key',
          env: 'development',
          cache: { storageKey: CACHE_KEY },
          enablePollingFallback: false,
        }}
        fetchImpl={fetchImpl}
        socketFactory={mock.factory}
      >
        <FlagsProbe />
      </FeatureFlagsProvider>,
    )

    expect(screen.getByTestId('count').textContent).toBe('1')

    await waitFor(() => {
      expect(screen.getByTestId('flag').textContent).toBe('true')
    })

    mock.emitUpdated([
      { name: 'FF_A', value_type: 'boolean', value: false },
    ])

    await waitFor(() => {
      expect(screen.getByTestId('flag').textContent).toBe('false')
    })

    const raw = window.localStorage.getItem(CACHE_KEY)
    expect(raw).toContain('FF_A')
  })

  it('sets error on GraphQL failure and starts polling fallback', async () => {
    const mock = createMockSocketFactory({ joinStatus: 'error' })
    let calls = 0
    const fetchImpl = vi.fn().mockImplementation(async () => {
      calls += 1
      if (calls === 1) {
        throw new Error('offline')
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            featureFlags: [
              { name: 'FF_A', valueType: 'boolean', value: true },
            ],
          },
        }),
      }
    })

    render(
      <FeatureFlagsProvider
        config={{
          clientKey: 'ff-key',
          env: 'development',
          pollingIntervalMs: 50,
          enablePollingFallback: true,
        }}
        fetchImpl={fetchImpl}
        socketFactory={mock.factory}
      >
        <FlagsProbe />
      </FeatureFlagsProvider>,
    )

    await waitFor(
      () => {
        expect(screen.getByTestId('flag').textContent).toBe('true')
      },
      { timeout: 2000 },
    )

    expect(fetchImpl.mock.calls.length).toBeGreaterThan(1)
  })

  it('disconnect triggers disconnected status', async () => {
    const mock = createMockSocketFactory()
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: { featureFlags: [] },
      }),
    })

    render(
      <FeatureFlagsProvider
        config={{
          clientKey: 'ff-key',
          env: 'development',
          enablePollingFallback: false,
        }}
        fetchImpl={fetchImpl}
        socketFactory={mock.factory}
      >
        <FlagsProbe />
      </FeatureFlagsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('true')
    })

    mock.triggerClose()

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('disconnected')
    })
  })

  it('accepts resolved config and exposes refresh', async () => {
    const mock = createMockSocketFactory()
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          featureFlags: [{ name: 'FF_A', valueType: 'boolean', value: true }],
        },
      }),
    })

    function RefreshProbe() {
      const { refresh } = useFeatureFlags()
      return (
        <button type="button" onClick={() => void refresh()}>
          refresh
        </button>
      )
    }

    const { createConfig } = await import('../config')
    const config = createConfig({
      clientKey: 'ff-key',
      env: 'development',
      enablePollingFallback: false,
    })

    render(
      <FeatureFlagsProvider
        config={config}
        fetchImpl={fetchImpl}
        socketFactory={mock.factory}
      >
        <FlagsProbe />
        <RefreshProbe />
      </FeatureFlagsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('flag').textContent).toBe('true')
    })

    screen.getByRole('button', { name: 'refresh' }).click()
    await waitFor(() => {
      expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('handles unmount during in-flight refresh', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined
    const fetchImpl = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    const mock = createMockSocketFactory()

    const view = render(
      <FeatureFlagsProvider
        config={{
          clientKey: 'ff-key',
          env: 'development',
          enablePollingFallback: false,
        }}
        fetchImpl={fetchImpl as typeof fetch}
        socketFactory={mock.factory}
      >
        <FlagsProbe />
      </FeatureFlagsProvider>,
    )

    view.unmount()
    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({ data: { featureFlags: [] } }),
    })
    await Promise.resolve()
  })

  it('skips autoConnect when disabled', async () => {
    const fetchImpl = vi.fn()
    render(
      <FeatureFlagsProvider
        config={{
          clientKey: 'ff-key',
          env: 'development',
          autoConnect: false,
        }}
        fetchImpl={fetchImpl}
      >
        <FlagsProbe />
      </FeatureFlagsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(screen.getByTestId('status').textContent).toBe('idle')
  })

  it('throws when hooks used outside provider', () => {
    expect(() => render(<FlagsProbe />)).toThrow(/FeatureFlagsProvider/)
  })
})
