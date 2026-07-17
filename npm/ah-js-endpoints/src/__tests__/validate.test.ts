import { describe, expect, it } from 'vitest'
import { validateFieldValues } from '../validate'
import type { CustomFieldDefinition } from '../types'

const customFields: CustomFieldDefinition[] = [
  {
    name: 'Title',
    label: 'offer_title',
    fieldType: 'INPUT',
    fieldOptionType: 'STRING',
    fieldOptions: [],
    isRequired: true,
  },
  {
    name: 'Email',
    label: 'email',
    fieldType: 'INPUT',
    fieldOptionType: 'EMAIL',
    fieldOptions: [],
    isRequired: true,
  },
  {
    name: 'Price',
    label: 'price',
    fieldType: 'INPUT',
    fieldOptionType: 'NUMERIC',
    fieldOptions: [],
    isRequired: false,
  },
  {
    name: 'Currency',
    label: 'currency',
    fieldType: 'SELECT',
    fieldOptionType: null,
    fieldOptions: ['USD', 'USDT'],
    isRequired: true,
  },
  {
    name: 'Tags',
    label: 'tags',
    fieldType: 'MULTIPLE_SELECT',
    fieldOptionType: null,
    fieldOptions: ['urgent', 'enterprise'],
    isRequired: false,
  },
]

describe('validateFieldValues', () => {
  it('accepts valid values and normalizes email', () => {
    const result = validateFieldValues(customFields, {
      offer_title: 'Product inquiry',
      email: 'Jane@Example.com',
      price: '99.99',
      currency: 'USD',
      tags: ['urgent'],
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.normalized).toEqual({
        offer_title: 'Product inquiry',
        email: 'jane@example.com',
        price: '99.99',
        currency: 'USD',
        tags: ['urgent'],
      })
    }
  })

  it('rejects unknown labels', () => {
    const result = validateFieldValues(customFields, {
      offer_title: 'x',
      email: 'a@b.com',
      currency: 'USD',
      extra: 'nope',
    })

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          { label: 'extra', message: 'is not allowed' },
        ]),
      }),
    )
  })

  it('rejects missing required fields', () => {
    const result = validateFieldValues(customFields, {
      offer_title: 'x',
    })

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          { label: 'email', message: "can't be blank" },
          { label: 'currency', message: "can't be blank" },
        ]),
      }),
    )
  })

  it('rejects invalid email', () => {
    const result = validateFieldValues(customFields, {
      offer_title: 'x',
      email: 'bad',
      currency: 'USD',
    })

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          { label: 'email', message: 'has invalid format' },
        ]),
      }),
    )
  })

  it('rejects invalid select value', () => {
    const result = validateFieldValues(customFields, {
      offer_title: 'x',
      email: 'a@b.com',
      currency: 'EUR',
    })

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          { label: 'currency', message: 'is not included in the list' },
        ]),
      }),
    )
  })
})

