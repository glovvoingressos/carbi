import { describe, expect, it } from 'vitest'

import {
  createVisitorToken,
  getOrCreateVisitorToken,
  hashVisitorToken,
} from './support-security'

describe('support visitor token security', () => {
  it('creates a 32-byte random token encoded without padding', () => {
    const first = createVisitorToken()
    const second = createVisitorToken()

    expect(first).toHaveLength(43)
    expect(second).toHaveLength(43)
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('produces a deterministic SHA-256 hex digest', async () => {
    await expect(hashVisitorToken('visitor-token')).resolves.toBe(
      'c679809e4cfde3a56ce9d207e7132a2722af3f54de41f2ef4ad99d8233b0cf09',
    )
  })

  it('rejects empty visitor tokens', async () => {
    await expect(hashVisitorToken('')).rejects.toThrow('Visitor token is required.')
  })

  it('reuses a valid visitor cookie without requesting a new token', () => {
    const request = new Request('https://carbi.com.br', {
      headers: { cookie: 'carbi_support_visitor=existing-token' },
    })

    expect(getOrCreateVisitorToken(request)).toEqual({
      token: 'existing-token',
      setCookie: false,
    })
  })

  it('creates a token when the visitor cookie is absent', () => {
    const result = getOrCreateVisitorToken(new Request('https://carbi.com.br'))

    expect(result.setCookie).toBe(true)
    expect(result.token).toHaveLength(43)
  })
})
