import { describe, expect, it } from 'vitest'
import { getAuthCode } from './auth-redirect'

describe('auth redirect helpers', () => {
  it('reads the PKCE authorization code from the redirect query', () => {
    expect(getAuthCode('?code=recovery-code')).toBe('recovery-code')
  })

  it('returns null when the redirect has no authorization code', () => {
    expect(getAuthCode('')).toBeNull()
  })
})
