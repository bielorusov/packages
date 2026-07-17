import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStorage } from '../useSessionStorage'

describe('useSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('uses initialValue when key is missing', () => {
    const { result } = renderHook(() => useSessionStorage('sidebar', true))
    expect(result.current.value).toBe(true)
  })

  it('reads existing value from sessionStorage', () => {
    sessionStorage.setItem('sidebar', JSON.stringify(false))
    const { result } = renderHook(() => useSessionStorage('sidebar', true))
    expect(result.current.value).toBe(false)
  })

  it('falls back when stored JSON is invalid', () => {
    sessionStorage.setItem('sidebar', 'not-json')
    const { result } = renderHook(() => useSessionStorage('sidebar', true))
    expect(result.current.value).toBe(true)
  })

  it('persists setValue and supports updater', () => {
    const { result } = renderHook(() =>
      useSessionStorage('prefs', { open: true, tab: 'a' }),
    )

    act(() => {
      result.current.setValue({ open: false, tab: 'a' })
    })
    expect(result.current.value).toEqual({ open: false, tab: 'a' })
    expect(JSON.parse(sessionStorage.getItem('prefs')!)).toEqual({ open: false, tab: 'a' })

    act(() => {
      result.current.setValue(prev => ({ ...prev, tab: 'b' }))
    })
    expect(result.current.value).toEqual({ open: false, tab: 'b' })
  })

  it('reset restores initialValue and removes the key', () => {
    const { result } = renderHook(() => useSessionStorage('sidebar', true))

    act(() => {
      result.current.setValue(false)
    })
    expect(sessionStorage.getItem('sidebar')).toBe('false')

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe(true)
    expect(sessionStorage.getItem('sidebar')).toBeNull()
  })
})
