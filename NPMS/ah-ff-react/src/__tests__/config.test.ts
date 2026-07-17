import { describe, expect, it } from 'vitest'
import {
  buildGraphqlUrl,
  buildSocketUrl,
  createConfig,
  toWebSocketOrigin,
  DEFAULT_BASE_URL,
} from '../config'

describe('createConfig', () => {
  it('applies defaults', () => {
    const config = createConfig({
      clientKey: 'ff-test',
      env: 'development',
    })
    expect(config.baseUrl).toBe(DEFAULT_BASE_URL)
    expect(config.graphqlUrl).toBe(
      'https://cms.assistshub.com/api/v1/external/feature-flags/graphql',
    )
    expect(config.socketUrl).toBe(
      'wss://cms.assistshub.com/api/v1/external/feature-flags/socket',
    )
    expect(config.autoConnect).toBe(true)
    expect(config.pollingIntervalMs).toBe(30_000)
    expect(config.enablePollingFallback).toBe(true)
    expect(config.cacheEnabled).toBe(false)
  })

  it('enables cache with custom key', () => {
    const config = createConfig({
      clientKey: 'ff-test',
      env: 'production',
      cache: { storageKey: 'custom-key' },
    })
    expect(config.cacheEnabled).toBe(true)
    expect(config.cacheStorageKey).toBe('custom-key')
  })

  it('enables cache with boolean true', () => {
    const config = createConfig({
      clientKey: 'ff-test',
      env: 'test',
      cache: true,
    })
    expect(config.cacheEnabled).toBe(true)
    expect(config.cacheStorageKey).toBe('ah-ff-react:flags')
  })

  it('uses empty baseUrl for same-origin paths', () => {
    const config = createConfig({
      clientKey: 'ff-test',
      env: 'development',
      baseUrl: '',
    })
    expect(config.graphqlUrl).toBe(
      '/api/v1/external/feature-flags/graphql',
    )
  })

  it('uses custom socketUrl', () => {
    const config = createConfig({
      clientKey: 'ff-test',
      env: 'development',
      socketUrl: 'ws://localhost:4000/api/v1/external/feature-flags/socket/',
    })
    expect(config.socketUrl).toBe(
      'ws://localhost:4000/api/v1/external/feature-flags/socket',
    )
  })

  it('throws without clientKey', () => {
    expect(() =>
      createConfig({ clientKey: '', env: 'development' }),
    ).toThrow(/clientKey/)
  })

  it('throws on invalid env', () => {
    expect(() =>
      createConfig({
        clientKey: 'ff',
        env: 'staging' as 'development',
      }),
    ).toThrow(/env must be/)
  })
})

describe('URL helpers', () => {
  it('converts http origin to ws', () => {
    expect(toWebSocketOrigin('http://localhost:4000')).toBe(
      'ws://localhost:4000',
    )
    expect(toWebSocketOrigin('https://cms.assistshub.com')).toBe(
      'wss://cms.assistshub.com',
    )
    expect(toWebSocketOrigin('wss://already')).toBe('wss://already')
    expect(toWebSocketOrigin('ws://already')).toBe('ws://already')
  })

  it('builds graphql and socket urls', () => {
    expect(buildGraphqlUrl('https://example.com/')).toContain('/graphql')
    expect(buildSocketUrl('http://localhost:4000')).toBe(
      'ws://localhost:4000/api/v1/external/feature-flags/socket',
    )
  })

  it('uses window for empty origin when available', () => {
    expect(toWebSocketOrigin('')).toMatch(/^wss?:\/\//)
  })

  it('falls back to production wss when origin empty and window missing', () => {
    const originalWindow = globalThis.window
    // @ts-expect-error intentional for SSR branch
    delete globalThis.window
    expect(toWebSocketOrigin('')).toBe('wss://cms.assistshub.com')
    globalThis.window = originalWindow
  })

  it('passes through unknown origin schemes', () => {
    expect(toWebSocketOrigin('custom://host')).toBe('custom://host')
  })
})
