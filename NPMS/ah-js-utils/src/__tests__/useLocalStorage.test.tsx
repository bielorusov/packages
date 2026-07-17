import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses initialValue when key is missing', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))
    expect(result.current.value).toBe('dark')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('theme', JSON.stringify('light'))
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))
    expect(result.current.value).toBe('light')
  })

  it('falls back when stored JSON is invalid', () => {
    localStorage.setItem('theme', '{broken')
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))
    expect(result.current.value).toBe('dark')
  })

  it('persists setValue and supports updater', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))

    act(() => {
      result.current.setValue(1)
    })
    expect(result.current.value).toBe(1)
    expect(localStorage.getItem('count')).toBe('1')

    act(() => {
      result.current.setValue(prev => prev + 1)
    })
    expect(result.current.value).toBe(2)
    expect(localStorage.getItem('count')).toBe('2')
  })

  it('reset restores initialValue and removes the key', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))

    act(() => {
      result.current.setValue('light')
    })
    expect(localStorage.getItem('theme')).toBe('"light"')

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe('dark')
    expect(localStorage.getItem('theme')).toBeNull()
  })
})
