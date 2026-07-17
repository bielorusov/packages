import { describe, expect, it } from 'vitest'
import { buildGraphqlUrl, createConfig, DEFAULT_BASE_URL } from '../config'

describe('buildGraphqlUrl', () => {
  it('removes trailing slash', () => {
    expect(buildGraphqlUrl('https://example.com/')).toBe(
      'https://example.com/api/v1/external/graphql',
    )
  })
})

describe('createConfig', () => {
  it('applies defaults', () => {
    const config = createConfig({
      clientKey: 'key',
      origin: 'https://external.app',
    })

    expect(config.baseUrl).toBe(DEFAULT_BASE_URL)
    expect(config.graphqlUrl).toBe(
      'https://cms.assistshub.com/api/v1/external/graphql',
    )
    expect(config.origin).toBe('https://external.app')
  })

  it('supports empty baseUrl for same-origin requests', () => {
    const config = createConfig({
      clientKey: 'key',
      baseUrl: '',
      origin: 'https://external.app',
    })

    expect(config.graphqlUrl).toBe('/api/v1/external/graphql')
  })

  it('throws without clientKey', () => {
    expect(() =>
      createConfig({
        clientKey: '',
        origin: 'https://external.app',
      }),
    ).toThrow(/clientKey/i)
  })
})

