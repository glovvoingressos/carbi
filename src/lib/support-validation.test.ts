import { describe, expect, it } from 'vitest'

import {
  isValidSupportEmail,
  normalizeSupportText,
  validateSupportMessage,
} from './support-validation'

describe('support message validation', () => {
  it('trims and normalizes submitted text', () => {
    const result = validateSupportMessage({
      name: '  Ana  ',
      email: ' ana@example.com ',
      message: '  Preciso de ajuda.  ',
      honeypot: '  ',
    })

    expect(normalizeSupportText('  uma   mensagem\ncom espaços  ')).toBe(
      'uma mensagem com espaços',
    )
    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Ana',
        email: 'ana@example.com',
        message: 'Preciso de ajuda.',
      },
    })
  })

  it('rejects an empty message after trimming', () => {
    expect(validateSupportMessage({ message: ' \n\t ' })).toEqual({
      ok: false,
      error: 'Message is required.',
    })
  })

  it('accepts messages up to 2,000 characters and rejects longer messages', () => {
    expect(validateSupportMessage({ message: 'a'.repeat(2_000) }).ok).toBe(true)
    expect(validateSupportMessage({ message: 'a'.repeat(2_001) }).ok).toBe(false)
  })

  it('accepts names up to 120 characters and rejects longer names', () => {
    expect(validateSupportMessage({ name: 'a'.repeat(120), message: 'Olá' }).ok).toBe(true)
    expect(validateSupportMessage({ name: 'a'.repeat(121), message: 'Olá' })).toEqual({
      ok: false,
      error: 'Name must be 120 characters or fewer.',
    })
  })

  it('allows an omitted email', () => {
    expect(validateSupportMessage({ name: 'Ana', message: 'Olá' })).toEqual({
      ok: true,
      value: { name: 'Ana', email: undefined, message: 'Olá' },
    })
  })

  it('rejects invalid or overlong email addresses', () => {
    expect(isValidSupportEmail('not-an-email')).toBe(false)
    expect(validateSupportMessage({ email: 'not-an-email', message: 'Olá' })).toEqual({
      ok: false,
      error: 'Email must be valid.',
    })
    expect(isValidSupportEmail(`${'a'.repeat(246)}@example.com`)).toBe(false)
  })

  it('rejects a non-empty honeypot field', () => {
    expect(validateSupportMessage({ message: 'Olá', honeypot: 'bot' })).toEqual({
      ok: false,
      error: 'Invalid support message.',
    })
  })
})
