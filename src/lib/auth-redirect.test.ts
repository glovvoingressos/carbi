import { describe, expect, it } from 'vitest'
import { buildLoginRedirect, getAuthCode, getSafeRedirectPath } from './auth-redirect'

describe('auth redirect helpers', () => {
  it('reads the PKCE authorization code from the redirect query', () => {
    expect(getAuthCode('?code=recovery-code')).toBe('recovery-code')
  })

  it('returns null when the redirect has no authorization code', () => {
    expect(getAuthCode('')).toBeNull()
  })

  it('keeps internal redirect paths and rejects external ones', () => {
    expect(getSafeRedirectPath('/anunciar-carro/fluxo')).toBe('/anunciar-carro/fluxo')
    expect(getSafeRedirectPath('https://example.com')).toBe('/minha-conta')
    expect(getSafeRedirectPath('//example.com')).toBe('/minha-conta')
  })

  it('builds a login URL with the requested destination', () => {
    expect(buildLoginRedirect('/anunciar-carro/fluxo')).toBe('/entrar?redirect=%2Fanunciar-carro%2Ffluxo')
  })
})
