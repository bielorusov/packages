import { afterEach, describe, expect, it } from 'vitest'
import { clearFlagCache, readFlagCache, writeFlagCache } from '../cache'

const KEY = 'ah-ff-test-cache'

afterEach(() => {
  clearFlagCache(KEY)
})

describe('cache', () => {
  it('writes and reads flags', () => {
    writeFlagCache(KEY, [
      { name: 'FF_A', valueType: 'boolean', value: true },
    ])
    const cached = readFlagCache(KEY)
    expect(cached?.flags).toHaveLength(1)
    expect(cached?.flags[0].name).toBe('FF_A')
    expect(cached?.updatedAt).toBeTypeOf('number')
  })

  it('returns null for missing key', () => {
    expect(readFlagCache('missing-key')).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    window.localStorage.setItem(KEY, '{not-json')
    expect(readFlagCache(KEY)).toBeNull()
  })

  it('returns null for invalid payload shape', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ flags: 'nope' }))
    expect(readFlagCache(KEY)).toBeNull()
  })

  it('clears cache', () => {
    writeFlagCache(KEY, [])
    clearFlagCache(KEY)
    expect(readFlagCache(KEY)).toBeNull()
  })

  it('is a no-op when localStorage throws', () => {
    const original = window.localStorage.setItem
    window.localStorage.setItem = () => {
      throw new Error('quota')
    }
    expect(() =>
      writeFlagCache(KEY, [{ name: 'A', valueType: 'text', value: 'x' }]),
    ).not.toThrow()
    window.localStorage.setItem = original
  })

  it('returns null / no-ops when localStorage is unavailable', () => {
    const original = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => undefined,
    })
    expect(readFlagCache(KEY)).toBeNull()
    expect(() => writeFlagCache(KEY, [])).not.toThrow()
    expect(() => clearFlagCache(KEY)).not.toThrow()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: original,
    })
  })

  it('clearFlagCache swallows removeItem errors', () => {
    writeFlagCache(KEY, [])
    const original = window.localStorage.removeItem
    window.localStorage.removeItem = () => {
      throw new Error('blocked')
    }
    expect(() => clearFlagCache(KEY)).not.toThrow()
    window.localStorage.removeItem = original
  })
})
