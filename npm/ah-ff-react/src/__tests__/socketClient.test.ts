import { describe, expect, it, vi } from 'vitest'
import { createFeatureFlagsSocketClient } from '../socketClient'
import type { SocketFactory } from '../socketClient'

function createMockSocketFactory(options?: {
  joinStatus?: 'ok' | 'error'
  joinError?: unknown
}): {
  factory: SocketFactory
  emitSnapshot: (flags: unknown[]) => void
  emitUpdated: (flags: unknown[]) => void
  triggerClose: () => void
  triggerError: () => void
  leave: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
} {
  const leave = vi.fn()
  const disconnect = vi.fn()
  let snapshotHandler: ((payload: { flags?: unknown[] }) => void) | null = null
  let updatedHandler: ((payload: { flags?: unknown[] }) => void) | null = null
  let onClose: (() => void) | null = null
  let onError: (() => void) | null = null

  const factory: SocketFactory = () => {
    const channel = {
      join: () => {
        const chain = {
          receive: (status: string, cb: (resp?: unknown) => void) => {
            if (status === (options?.joinStatus ?? 'ok')) {
              queueMicrotask(() => cb(options?.joinError))
            }
            return chain
          },
        }
        return chain
      },
      on: (event: string, cb: (payload: { flags?: unknown[] }) => void) => {
        if (event === 'flags_snapshot') snapshotHandler = cb
        if (event === 'flags_updated') updatedHandler = cb
      },
      leave,
    }

    return {
      connect: vi.fn(),
      disconnect,
      channel: () => channel,
      onClose: (cb: () => void) => {
        onClose = cb
      },
      onError: (cb: () => void) => {
        onError = cb
      },
    }
  }

  return {
    factory,
    emitSnapshot: (flags) => snapshotHandler?.({ flags }),
    emitUpdated: (flags) => updatedHandler?.({ flags }),
    triggerClose: () => onClose?.(),
    triggerError: () => onError?.(),
    leave,
    disconnect,
  }
}

describe('createFeatureFlagsSocketClient', () => {
  it('connects, joins, and forwards flag events', async () => {
    const mock = createMockSocketFactory()
    const handlers = {
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onFlags: vi.fn(),
    }

    const client = createFeatureFlagsSocketClient(
      {
        socketUrl: 'wss://example/socket',
        clientKey: 'ff-key',
        env: 'development',
      },
      handlers,
      mock.factory,
    )

    client.connect()
    client.connect() // idempotent
    await Promise.resolve()
    await Promise.resolve()

    expect(handlers.onConnected).toHaveBeenCalled()

    mock.emitSnapshot([
      { name: 'FF_A', value_type: 'boolean', value: true },
    ])
    expect(handlers.onFlags).toHaveBeenCalledWith([
      { name: 'FF_A', valueType: 'boolean', value: true },
    ])

    mock.emitUpdated([
      { name: 'FF_A', value_type: 'boolean', value: false },
    ])
    expect(handlers.onFlags).toHaveBeenLastCalledWith([
      { name: 'FF_A', valueType: 'boolean', value: false },
    ])

    mock.triggerError()
    expect(handlers.onError).toHaveBeenCalledWith('socket error')

    mock.triggerClose()
    expect(handlers.onDisconnected).toHaveBeenCalled()

    client.disconnect()
    expect(mock.leave).toHaveBeenCalled()
    expect(mock.disconnect).toHaveBeenCalled()
  })

  it('reports join errors', async () => {
    const mock = createMockSocketFactory({
      joinStatus: 'error',
      joinError: { reason: 'unauthorized' },
    })
    const handlers = {
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onFlags: vi.fn(),
    }

    const client = createFeatureFlagsSocketClient(
      {
        socketUrl: 'wss://example/socket',
        clientKey: 'bad',
        env: 'development',
      },
      handlers,
      mock.factory,
    )
    client.connect()
    await Promise.resolve()
    await Promise.resolve()

    expect(handlers.onError).toHaveBeenCalled()
    expect(handlers.onDisconnected).toHaveBeenCalled()
    expect(handlers.onConnected).not.toHaveBeenCalled()
  })

  it('uses the default Phoenix socket factory', () => {
    const handlers = {
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onFlags: vi.fn(),
    }

    const client = createFeatureFlagsSocketClient(
      {
        socketUrl: 'wss://example.test/api/v1/external/feature-flags/socket',
        clientKey: 'ff-key',
        env: 'development',
      },
      handlers,
    )

    expect(() => {
      client.connect()
      client.disconnect()
    }).not.toThrow()
  })
})
