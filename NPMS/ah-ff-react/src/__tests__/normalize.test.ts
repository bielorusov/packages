import { describe, expect, it } from 'vitest'
import { flagsByNameMap, normalizeFlag, normalizeFlags } from '../normalize'

describe('normalize', () => {
  it('normalizes camelCase GraphQL shape', () => {
    expect(
      normalizeFlag({
        name: 'FF_A',
        valueType: 'boolean',
        value: true,
      }),
    ).toEqual({ name: 'FF_A', valueType: 'boolean', value: true })
  })

  it('normalizes snake_case WebSocket shape', () => {
    expect(
      normalizeFlag({
        name: 'FF_B',
        value_type: 'number',
        value: 3,
      }),
    ).toEqual({ name: 'FF_B', valueType: 'number', value: 3 })
  })

  it('defaults unknown value types to text', () => {
    expect(
      normalizeFlag({
        name: 'FF_C',
        value_type: 'unknown',
        value: 'x',
      }).valueType,
    ).toBe('text')
  })

  it('handles empty or invalid arrays', () => {
    expect(normalizeFlags(null)).toEqual([])
    expect(normalizeFlags(undefined)).toEqual([])
    expect(normalizeFlags([])).toEqual([])
  })

  it('builds name map', () => {
    const map = flagsByNameMap([
      { name: 'A', valueType: 'text', value: '1' },
      { name: 'B', valueType: 'boolean', value: false },
    ])
    expect(map.A.value).toBe('1')
    expect(map.B.value).toBe(false)
  })
})
