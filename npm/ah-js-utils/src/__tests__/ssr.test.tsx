import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../dom', () => ({
  isBrowser: () => false,
}))

import { useLocalStorage } from '../useLocalStorage'
import { useSessionStorage } from '../useSessionStorage'
import { useCookieStorage } from '../useCookieStorage'

describe('storage hooks without browser (SSR)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('useLocalStorage stays on initialValue and reset is safe', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))
    expect(result.current.value).toBe('dark')

    act(() => {
      result.current.setValue('light')
    })
    expect(result.current.value).toBe('light')

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe('dark')
  })

  it('useSessionStorage stays on initialValue and reset is safe', () => {
    const { result } = renderHook(() => useSessionStorage('sidebar', true))
    expect(result.current.value).toBe(true)

    act(() => {
      result.current.setValue(false)
    })
    expect(result.current.value).toBe(false)

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe(true)
  })

  it('useCookieStorage stays on initialValue and reset is safe', () => {
    const { result } = renderHook(() => useCookieStorage('session', 'init'))
    expect(result.current.value).toBe('init')

    act(() => {
      result.current.setValue('next')
    })
    expect(result.current.value).toBe('next')

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe('init')
  })
})
