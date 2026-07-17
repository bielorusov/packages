import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { EndpointsProvider } from '../context'
import { useEndpoints } from '../hooks'
import { CREATE_OFFER_MUTATION } from '../graphqlClient'

import type { EndpointsContextValue } from '../types'

afterEach(() => {
  cleanup()
})

describe('EndpointsProvider', () => {
  it('loads endpointFormConfig and validates before submitCreateOffer', async () => {
    let api: EndpointsContextValue | null = null

    function Harness() {
      const ctx = useEndpoints()
      useEffect(() => {
        if (ctx.formConfig) {
          api = ctx
        }
      }, [ctx.formConfig])
      return null
    }

    const fetchImpl = vi.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse((init?.body as string) ?? '{}')
      if (body.query.includes('endpointFormConfig')) {
        return {
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
                  {
                    name: 'Email',
                    label: 'email',
                    fieldType: 'input',
                    fieldOptionType: 'email',
                    fieldOptions: [],
                    isRequired: true,
                  },
                  {
                    name: 'Price',
                    label: 'price',
                    fieldType: 'input',
                    fieldOptionType: 'numeric',
                    fieldOptions: [],
                    isRequired: false,
                  },
                  {
                    name: 'Currency',
                    label: 'currency',
                    fieldType: 'select',
                    fieldOptionType: null,
                    fieldOptions: ['USD', 'USDT'],
                    isRequired: true,
                  },
                  {
                    name: 'Tags',
                    label: 'tags',
                    fieldType: 'multiple_select',
                    fieldOptionType: null,
                    fieldOptions: ['urgent', 'enterprise'],
                    isRequired: false,
                  },
                ],
              },
            },
          }),
        }
      }

      if (body.query.includes('createOffer')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              createOffer: {
                id: 'offer-1',
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
        }
      }

      throw new Error('Unknown query')
    })

    render(
      <EndpointsProvider
        config={{
          clientKey: 'endpoint-key',
          baseUrl: '',
          origin: 'https://example.com',
        }}
        fetchImpl={fetchImpl}
      >
        <Harness />
      </EndpointsProvider>,
    )

    await waitFor(() => {
      expect(api).not.toBeNull()
      expect(api?.formConfig).not.toBeNull()
    })
    expect(api).not.toBeNull()

    // Invalid email should fail before hitting createOffer mutation.
    await expect(
      api!.createOffer({
        offer_title: 'Product inquiry',
        email: 'bad',
        currency: 'USD',
      }),
    ).rejects.toThrow(/email: has invalid format/)

    // Only config query should be called.
    expect(fetchImpl.mock.calls.length).toBe(1)

    const result = await api!.createOffer({
      offer_title: 'Product inquiry',
      email: 'Jane@Example.com',
      price: '99.99',
      currency: 'USD',
      tags: ['urgent'],
    })

    expect(result.id).toBe('offer-1')
    expect(fetchImpl.mock.calls.length).toBe(2)

    const createBody = JSON.parse(
      (fetchImpl.mock.calls[1][1] as RequestInit).body as string,
    )
    expect(createBody.query).toBe(CREATE_OFFER_MUTATION)
    expect(createBody.variables.input.fieldValues).toEqual(
      expect.arrayContaining([
        { label: 'email', value: 'jane@example.com' },
        { label: 'tags', values: ['urgent'] },
      ]),
    )
  })
})

