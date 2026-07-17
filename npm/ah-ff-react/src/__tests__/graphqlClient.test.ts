import { describe, expect, it, vi } from 'vitest'
import {
  FEATURE_FLAGS_QUERY,
  FeatureFlagsFetchError,
  fetchFeatureFlagsSnapshot,
} from '../graphqlClient'

const config = {
  graphqlUrl: 'https://cms.assistshub.com/api/v1/external/feature-flags/graphql',
  clientKey: 'ff-key',
  env: 'development' as const,
}

describe('fetchFeatureFlagsSnapshot', () => {
  it('fetches and normalizes flags', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          featureFlags: [
            { name: 'FF_A', valueType: 'boolean', value: true },
          ],
        },
      }),
    })

    const result = await fetchFeatureFlagsSnapshot(config, fetchImpl)
    expect(result.flags).toEqual([
      { name: 'FF_A', valueType: 'boolean', value: true },
    ])
    expect(fetchImpl).toHaveBeenCalledWith(
      config.graphqlUrl,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FF-Client-Key': 'ff-key',
          'X-FF-Client-Env': 'development',
        },
      }),
    )
    const body = JSON.parse(
      (fetchImpl.mock.calls[0][1] as RequestInit).body as string,
    )
    expect(body.query).toBe(FEATURE_FLAGS_QUERY)
  })

  it('throws on GraphQL errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } }],
      }),
    })

    await expect(
      fetchFeatureFlagsSnapshot(config, fetchImpl),
    ).rejects.toMatchObject({
      name: 'FeatureFlagsFetchError',
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    })
  })

  it('throws on HTTP errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } }],
      }),
    })

    await expect(
      fetchFeatureFlagsSnapshot(config, fetchImpl),
    ).rejects.toBeInstanceOf(FeatureFlagsFetchError)
  })

  it('throws on HTTP errors without GraphQL body errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    await expect(
      fetchFeatureFlagsSnapshot(config, fetchImpl),
    ).rejects.toMatchObject({
      message: 'HTTP 500',
      status: 500,
    })
  })

  it('throws on network failure with non-Error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue('boom')
    await expect(
      fetchFeatureFlagsSnapshot(config, fetchImpl),
    ).rejects.toThrow(/Network error: boom/)
  })

  it('throws on invalid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json')
      },
    })
    await expect(
      fetchFeatureFlagsSnapshot(config, fetchImpl),
    ).rejects.toThrow(/Invalid JSON/)
  })
})
