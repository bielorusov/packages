import { describe, expect, it } from 'vitest'
import {
  findFlag,
  getBooleanFlag,
  getFlagValue,
  getNumberFlag,
  getStringFlag,
  isFlagEnabled,
  toFlagsByName,
} from '../utils'
import type { FeatureFlag } from '../types'

const flags: FeatureFlag[] = [
  { name: 'FF_BOOL', valueType: 'boolean', value: true },
  { name: 'FF_NUM', valueType: 'number', value: 4 },
  { name: 'FF_TEXT', valueType: 'text', value: 'hello' },
  { name: 'FF_STR_BOOL', valueType: 'text', value: 'true' },
  { name: 'FF_STR_NUM', valueType: 'text', value: '12' },
  { name: 'FF_BAD_NUM', valueType: 'text', value: 'nope' },
]

describe('utils', () => {
  it('finds flags and reads values', () => {
    expect(findFlag(flags, 'FF_BOOL')?.value).toBe(true)
    expect(getFlagValue(flags, 'FF_TEXT')).toBe('hello')
    expect(getFlagValue(flags, 'MISSING', 'fallback')).toBe('fallback')
  })

  it('isFlagEnabled', () => {
    expect(isFlagEnabled(flags, 'FF_BOOL')).toBe(true)
    expect(isFlagEnabled(flags, 'FF_TEXT')).toBe(true)
    expect(isFlagEnabled(flags, 'MISSING')).toBe(false)
    expect(isFlagEnabled(flags, 'MISSING', true)).toBe(true)
    expect(
      isFlagEnabled(
        [{ name: 'FF_OFF', valueType: 'boolean', value: false }],
        'FF_OFF',
      ),
    ).toBe(false)
  })

  it('typed getters', () => {
    expect(getBooleanFlag(flags, 'FF_BOOL')).toBe(true)
    expect(getBooleanFlag(flags, 'FF_STR_BOOL')).toBe(true)
    expect(getBooleanFlag(flags, 'FF_NUM')).toBe(true)
    expect(getBooleanFlag(flags, 'MISSING', true)).toBe(true)
    expect(getNumberFlag(flags, 'FF_NUM')).toBe(4)
    expect(getNumberFlag(flags, 'FF_STR_NUM')).toBe(12)
    expect(getNumberFlag(flags, 'FF_BAD_NUM', 7)).toBe(7)
    expect(getNumberFlag(flags, 'FF_BOOL', 3)).toBe(3)
    expect(getNumberFlag(flags, 'MISSING', 9)).toBe(9)
    expect(getStringFlag(flags, 'FF_TEXT')).toBe('hello')
    expect(getStringFlag(flags, 'FF_NUM')).toBe('4')
    expect(getStringFlag(flags, 'MISSING', 'x')).toBe('x')
  })

  it('toFlagsByName', () => {
    expect(toFlagsByName(flags).FF_BOOL.value).toBe(true)
  })
})
