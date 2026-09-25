import { describe, expect, it } from 'vitest'
import { compareFipeReferences, getFipeRetryAt, parseFipeReferenceMonth } from './fipe-refresh'

describe('parseFipeReferenceMonth', () => {
  it.each([
    ['setembro/2026', '2026-09'],
    ['  MARÇO   de   2026  ', '2026-03'],
    ['marco/2026', '2026-03'],
    ['maio de 2022 ', '2022-05'],
    ['AGOSTO / 2026', '2026-08'],
    ['01/2027', '2027-01'],
    ['12/2026', '2026-12'],
    ['2026-09', '2026-09'],
    [' 2026 - 09 ', '2026-09'],
  ])('parses %s as %s', (input, key) => {
    expect(parseFipeReferenceMonth(input)?.key).toBe(key)
  })

  it.each(['', 'referência inválida', '13/2026', '00/2026', '2026-00', '2026-13', '2026-9', '1/2026', '2026-09-extra', 'setembro/0000', 'janeiro/2026/extra'])('rejects invalid reference %s', (input) => {
    expect(parseFipeReferenceMonth(input)).toBeNull()
  })

  it('returns null for missing references and parsed numeric fields for valid ones', () => {
    expect(parseFipeReferenceMonth(null)).toBeNull()
    expect(parseFipeReferenceMonth(undefined)).toBeNull()
    expect(parseFipeReferenceMonth('março/2026')).toEqual({ year: 2026, month: 3, key: '2026-03' })
  })
})

describe('compareFipeReferences', () => {
  it.each([
    ['outubro/2026', 'setembro/2026', 'newer'],
    ['janeiro/2027', 'dezembro/2026', 'newer'],
    ['2026-09', 'setembro/2026', 'same'],
    ['agosto/2026', 'setembro/2026', 'older'],
    ['dezembro/2025', 'janeiro/2026', 'older'],
    ['outubro/2026', null, 'unknown'],
    ['referência inválida', 'setembro/2026', 'unknown'],
    ['outubro/2026', 'referência inválida', 'unknown'],
    [null, null, 'unknown'],
  ] as const)('compares %s with %s as %s', (next, current, expected) => {
    expect(compareFipeReferences(next, current)).toBe(expected)
  })
})

describe('getFipeRetryAt', () => {
  const now = new Date('2026-09-10T12:00:00.000Z')

  it.each([
    ['not-updated', 1, '2026-09-12T12:00:00.000Z'],
    ['not-updated', 2, '2026-09-14T12:00:00.000Z'],
    ['not-updated', 4, '2026-09-20T12:00:00.000Z'],
    ['provider-error', 1, '2026-09-11T12:00:00.000Z'],
    ['provider-error', 2, '2026-09-12T12:00:00.000Z'],
    ['provider-error', 4, '2026-09-17T12:00:00.000Z'],
    ['rate-limited', 1, '2026-09-13T12:00:00.000Z'],
    ['rate-limited', 2, '2026-09-15T12:00:00.000Z'],
    ['rate-limited', 4, '2026-09-20T12:00:00.000Z'],
  ] as const)('schedules %s attempt %s at %s', (kind, attempts, expected) => {
    expect(getFipeRetryAt(now, attempts, kind).toISOString()).toBe(expected)
  })

  it.each(['not-updated', 'provider-error', 'rate-limited'] as const)('caps %s after five monthly attempts', (kind) => {
    expect(getFipeRetryAt(now, 5, kind).toISOString()).toBe('2026-10-01T10:00:00.000Z')
    expect(getFipeRetryAt(now, 50, kind).toISOString()).toBe('2026-10-01T10:00:00.000Z')
  })

  it('moves a retry that would cross the month boundary to the next cycle', () => {
    expect(getFipeRetryAt(new Date('2026-09-29T12:00:00.000Z'), 2, 'rate-limited').toISOString()).toBe('2026-10-01T10:00:00.000Z')
    expect(getFipeRetryAt(new Date('2026-12-30T12:00:00.000Z'), 1, 'not-updated').toISOString()).toBe('2027-01-01T10:00:00.000Z')
  })
})
