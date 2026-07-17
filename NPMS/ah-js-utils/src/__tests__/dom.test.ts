import { describe, expect, it } from 'vitest'
import { isBrowser } from '../dom'

describe('isBrowser', () => {
  it('returns true in jsdom', () => {
    expect(isBrowser()).toBe(true)
  })
})
