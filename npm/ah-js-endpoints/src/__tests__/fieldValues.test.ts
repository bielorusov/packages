import { describe, expect, it } from 'vitest'
import { fromFieldValueEntries, toFieldValueEntries } from '../fieldValues'

describe('fieldValues', () => {
  it('converts FieldValuesMap to OfferFieldValueInput entries', () => {
    const entries = toFieldValueEntries({
      offer_title: 'Product inquiry',
      tags: ['urgent', 'enterprise'],
    })

    expect(entries).toEqual([
      { label: 'offer_title', value: 'Product inquiry' },
      { label: 'tags', values: ['urgent', 'enterprise'] },
    ])
  })

  it('converts OfferFieldValueInput entries back to FieldValuesMap', () => {
    const values = fromFieldValueEntries([
      { label: 'offer_title', value: 'Product inquiry' },
      { label: 'tags', values: ['urgent'] },
    ])

    expect(values).toEqual({
      offer_title: 'Product inquiry',
      tags: ['urgent'],
    })
  })
})

