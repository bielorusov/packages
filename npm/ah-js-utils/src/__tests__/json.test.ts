import { describe, expect, it } from 'vitest'
import { decodeJson, encodeJson } from '../json'

describe('encodeJson', () => {
  it('stringifies primitives and objects', () => {
    expect(encodeJson('hello')).toBe('"hello"')
    expect(encodeJson(42)).toBe('42')
    expect(encodeJson(true)).toBe('true')
    expect(encodeJson({ a: 1 })).toBe('{"a":1}')
  })
})

describe('decodeJson', () => {
  it('returns fallback for null or empty string', () => {
    expect(decodeJson(null, 'fallback')).toBe('fallback')
    expect(decodeJson('', { x: 1 })).toEqual({ x: 1 })
  })

  it('parses valid JSON', () => {
    expect(decodeJson('"hi"', 'x')).toBe('hi')
    expect(decodeJson('{"a":2}', { a: 0 })).toEqual({ a: 2 })
  })

  it('returns fallback for invalid JSON', () => {
    expect(decodeJson('{broken', 'fallback')).toBe('fallback')
    expect(decodeJson('not-json', 7)).toBe(7)
  })
})
