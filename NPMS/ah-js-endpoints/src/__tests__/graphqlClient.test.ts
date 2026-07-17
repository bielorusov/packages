import { describe, expect, it, vi } from 'vitest'
import {
  CREATE_OFFER_MUTATION,
  ENDPOINT_FORM_CONFIG_QUERY,
  EndpointsFetchError,
  fetchEndpointFormConfig,
  submitCreateOffer,
} from '../graphqlClient'

const config = {
  graphqlUrl: 'https://cms.assistshub.com/api/v1/external/graphql',
  clientKey: 'endpoint-key',
  origin: 'https://example.com',
}

describe('fetchEndpointFormConfig', () => {
  it('fetches and normalizes endpoint form config', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          endpointFormConfig: {
            endpointType: 'offer',
            domains: ['example.com'],
            customFields: [
              {
                name: 'Title',
                label: 'offer_title',
                fieldType: 'input',
                fieldOptionType: 'string',
                fieldOptions: [],
                isRequired: true,
              },
            ],
          },
        },
      }),
    })

    const result = await fetchEndpointFormConfig(config, fetchImpl)

    expect(result).toEqual({
      endpointType: 'offer',
      domains: ['example.com'],
      customFields: [
        {
          name: 'Title',
          label: 'offer_title',
          fieldType: 'INPUT',
          fieldOptionType: 'STRING',
          fieldOptions: [],
          isRequired: true,
        },
      ],
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      config.graphqlUrl,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Key': config.clientKey,
        },
      }),
    )

    const body = JSON.parse(
      (fetchImpl.mock.calls[0][1] as RequestInit).body as string,
    )
    expect(body.query).toBe(ENDPOINT_FORM_CONFIG_QUERY)
  })

  it('throws on GraphQL errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errors: [
          { message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } },
        ],
      }),
    })

    await expect(fetchEndpointFormConfig(config, fetchImpl)).rejects.toMatchObject(
      {
        name: 'EndpointsFetchError',
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    )
  })

  it('throws on HTTP errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        errors: [
          { message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } },
        ],
      }),
    })

    await expect(fetchEndpointFormConfig(config, fetchImpl)).rejects.toBeInstanceOf(
      EndpointsFetchError,
    )
  })

  it('throws on network failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue('boom')
    await expect(fetchEndpointFormConfig(config, fetchImpl)).rejects.toThrow(
      /Network error: boom/,
    )
  })

  it('throws on invalid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json')
      },
    })

    await expect(fetchEndpointFormConfig(config, fetchImpl)).rejects.toThrow(
      /Invalid JSON/,
    )
  })
})

describe('submitCreateOffer', () => {
  it('submits createOffer mutation and normalizes offer', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          createOffer: {
            id: 'uuid',
            domain: 'example.com',
            archived: false,
            endpointType: 'offer',
            createdAt: '2026-01-01T00:00:00',
            displayFields: [
              { name: 'Email', label: 'email', value: 'jane@example.com' },
            ],
          },
        },
      }),
    })

    const result = await submitCreateOffer(
      config,
      {
        fieldValues: [
          { label: 'email', value: 'jane@example.com' },
          { label: 'offer', value: '99.99' },
        ],
      },
      fetchImpl,
    )

    expect(result.id).toBe('uuid')
    expect(result.domain).toBe('example.com')
    expect(result.displayFields).toEqual([
      { name: 'Email', label: 'email', value: 'jane@example.com' },
    ])

    const body = JSON.parse(
      (fetchImpl.mock.calls[0][1] as RequestInit).body as string,
    )
    expect(body.query).toBe(CREATE_OFFER_MUTATION)
    expect(body.variables.input.fieldValues).toEqual([
      { label: 'email', value: 'jane@example.com' },
      { label: 'offer', value: '99.99' },
    ])
  })
})

