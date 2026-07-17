import { Socket } from 'phoenix'
import { normalizeFlags } from './normalize'
import type { FeatureFlag, FeatureFlagWire, ResolvedAhFfConfig } from './types'

export type SocketClientHandlers = {
  onConnected: () => void
  onDisconnected: () => void
  onError: (message: string) => void
  onFlags: (flags: FeatureFlag[]) => void
}


export type FeatureFlagsSocketClient = {
  connect: () => void
  disconnect: () => void
}

type SocketLike = {
  connect: () => void
  disconnect: () => void
  channel: (topic: string, params?: object) => ChannelLike
  onClose?: (callback: () => void) => void
  onError?: (callback: () => void) => void
}

type ChannelLike = {
  join: () => {
    receive: (status: string, callback: (resp?: unknown) => void) => {
      receive: (status: string, callback: (resp?: unknown) => void) => unknown
    }
  }
  on: (event: string, callback: (payload: { flags?: FeatureFlagWire[] }) => void) => void
  leave: () => void
}

export type SocketFactory = (
  endPoint: string,
  opts: { params: Record<string, string> },
) => SocketLike

function defaultSocketFactory(
  endPoint: string,
  opts: { params: Record<string, string> },
): SocketLike {
  return new Socket(endPoint, opts) as unknown as SocketLike
}

export function createFeatureFlagsSocketClient(
  config: Pick<ResolvedAhFfConfig, 'socketUrl' | 'clientKey' | 'env'>,
  handlers: SocketClientHandlers,
  socketFactory: SocketFactory = defaultSocketFactory,
): FeatureFlagsSocketClient {
  let socket: SocketLike | null = null
  let channel: ChannelLike | null = null

  const handleFlagsPayload = (payload: { flags?: FeatureFlagWire[] }) => {
    handlers.onFlags(normalizeFlags(payload.flags))
  }

  const joinChannel = (activeSocket: SocketLike) => {
    channel = activeSocket.channel('flags', {}) as ChannelLike

    channel
      .join()
      .receive('ok', () => {
        handlers.onConnected()
      })
      .receive('error', (resp) => {
        handlers.onError(
          typeof resp === 'string' ? resp : JSON.stringify(resp ?? 'join failed'),
        )
        handlers.onDisconnected()
      })

    channel.on('flags_snapshot', handleFlagsPayload)
    channel.on('flags_updated', handleFlagsPayload)
  }

  return {
    connect() {
      if (socket) {
        return
      }

      socket = socketFactory(config.socketUrl, {
        params: {
          client_key: config.clientKey,
          env: config.env,
        },
      })

      if (typeof socket.onClose === 'function') {
        socket.onClose(() => {
          handlers.onDisconnected()
        })
      }

      if (typeof socket.onError === 'function') {
        socket.onError(() => {
          handlers.onError('socket error')
        })
      }

      socket.connect()
      joinChannel(socket)
    },
    disconnect() {
      if (channel) {
        channel.leave()
        channel = null
      }
      if (socket) {
        socket.disconnect()
        socket = null
      }
    },
  }
}
