import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCookieStorage } from '../useCookieStorage'

const cookiesStore = new Map<string, string>()

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn((key: string) => cookiesStore.get(key)),
    set: vi.fn((key: string, value: string) => {
      cookiesStore.set(key, value)
    }),
    remove: vi.fn((key: string) => {
      cookiesStore.delete(key)
    }),
  },
}))

describe('useCookieStorage', () => {
  beforeEach(() => {
    cookiesStore.clear()
    vi.clearAllMocks()
  })

  it('uses initialValue when cookie is missing', () => {
    const { result } = renderHook(() => useCookieStorage('session', { token: null }))
    expect(result.current.value).toEqual({ token: null })
  })

  it('reads existing cookie value', () => {
    cookiesStore.set('session', JSON.stringify({ token: 'abc' }))
    const { result } = renderHook(() => useCookieStorage('session', { token: null }))
    expect(result.current.value).toEqual({ token: 'abc' })
  })

  it('falls back when cookie JSON is invalid', () => {
    cookiesStore.set('session', '{broken')
    const { result } = renderHook(() => useCookieStorage('session', { token: null }))
    expect(result.current.value).toEqual({ token: null })
  })

  it('persists setValue and supports updater', async () => {
    const Cookies = (await import('js-cookie')).default
    const options = { secure: true, path: '/', expires: 30 }
    const { result } = renderHook(() => useCookieStorage('session', { n: 0 }, options))

    act(() => {
      result.current.setValue({ n: 1 })
    })
    expect(result.current.value).toEqual({ n: 1 })
    expect(Cookies.set).toHaveBeenCalledWith('session', '{"n":1}', options)

    act(() => {
      result.current.setValue(prev => ({ n: prev.n + 1 }))
    })
    expect(result.current.value).toEqual({ n: 2 })
  })

  it('reset restores initialValue and removes the cookie', async () => {
    const Cookies = (await import('js-cookie')).default
    const { result } = renderHook(() =>
      useCookieStorage('session', { token: null }, { path: '/app', secure: true }),
    )

    act(() => {
      result.current.setValue({ token: 'x' })
    })

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toEqual({ token: null })
    expect(Cookies.remove).toHaveBeenCalledWith('session', { path: '/app' })
    expect(cookiesStore.has('session')).toBe(false)
  })

  it('uses default path / when removing without path option', async () => {
    const Cookies = (await import('js-cookie')).default
    const { result } = renderHook(() =>
      useCookieStorage('session', 'a', { secure: false, expires: 1 }),
    )

    act(() => {
      result.current.reset()
    })
    expect(Cookies.remove).toHaveBeenCalledWith('session', { path: '/' })
  })
})
