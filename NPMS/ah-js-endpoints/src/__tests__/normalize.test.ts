import { describe, expect, it } from 'vitest'
import {
  normalizeCustomField,
  normalizeEndpointFormConfig,
  normalizeOffer,
} from '../normalize'

describe('normalizeCustomField', () => {
  it('normalizes camelCase GraphQL fields', () => {
    const normalized = normalizeCustomField({
      name: 'Title',
      label: 'offer_title',
      fieldType: 'input',
      fieldOptionType: 'string',
      fieldOptions: [],
      isRequired: true,
    })

    expect(normalized).toEqual({
      name: 'Title',
      label: 'offer_title',
      fieldType: 'INPUT',
      fieldOptionType: 'STRING',
      fieldOptions: [],
      isRequired: true,
    })
  })

  it('normalizes snake_case wire fields', () => {
    const normalized = normalizeCustomField({
      name: 'Email',
      label: 'email',
      field_type: 'input',
      field_option_type: 'email',
      field_options: [],
      is_required: true,
    })

    expect(normalized.fieldType).toBe('INPUT')
    expect(normalized.fieldOptionType).toBe('EMAIL')
    expect(normalized.isRequired).toBe(true)
  })
})

describe('normalizeEndpointFormConfig', () => {
  it('normalizes config', () => {
    const normalized = normalizeEndpointFormConfig({
      endpoint_type: 'offer',
      domains: ['example.com'],
      custom_fields: [
        {
          name: 'Email',
          label: 'email',
          field_type: 'input',
          field_option_type: 'email',
          field_options: [],
          is_required: true,
        },
      ],
    })

    expect(normalized.endpointType).toBe('offer')
    expect(normalized.domains).toEqual(['example.com'])
    expect(normalized.customFields).toHaveLength(1)
    expect(normalized.customFields[0]).toMatchObject({
      label: 'email',
      fieldType: 'INPUT',
      fieldOptionType: 'EMAIL',
    })
  })
})

describe('normalizeOffer', () => {
  it('normalizes offer wire data', () => {
    const offer = normalizeOffer({
      id: 'uuid',
      domain: 'example.com',
      archived: false,
      user_id: 'user-id',
      endpoint_id: 'endpoint-id',
      endpoint_type: 'offer',
      created_at: '2026-01-01T00:00:00',
      field_values: { email: 'jane@example.com' },
      display_fields: [
        { name: 'Email', label: 'email', value: 'jane@example.com' },
      ],
    })

    expect(offer.id).toBe('uuid')
    expect(offer.domain).toBe('example.com')
    expect(offer.userId).toBe('user-id')
    expect(offer.endpointId).toBe('endpoint-id')
    expect(offer.displayFields).toEqual([
      { name: 'Email', label: 'email', value: 'jane@example.com' },
    ])
  })
})

