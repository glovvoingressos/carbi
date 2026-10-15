import { describe, expect, it } from 'vitest'

import {
  buildFipeResultFromPlateLookup,
  getListingPriceReview,
  getListingImageRejection,
  normalizePlateFinal,
} from './marketplace'

describe('marketplace listing helpers', () => {
  it('keeps only the final plate character for a listing', () => {
    expect(normalizePlateFinal('abc1d23')).toBe('3')
    expect(normalizePlateFinal('  7  ')).toBe('7')
    expect(normalizePlateFinal('')).toBeNull()
  })

  it('builds a FIPE result from a successful plate lookup', () => {
    expect(buildFipeResultFromPlateLookup({
      brand: 'PEUGEOT',
      model: '2008 GT T200',
      yearModel: 2024,
      fuel: 'Flex',
      fipePrice: 123456,
      fipeReference: 'Julho/2026',
      plate: 'ABC1D23',
    })).toMatchObject({
      brand: 'PEUGEOT',
      model: '2008 GT T200',
      modelYear: 2024,
      fuel: 'Flex',
      referenceMonth: 'Julho/2026',
      codeFipe: 'plate-3',
    })
  })

  it('rejects unsupported or oversized listing images with a recovery message', () => {
    expect(getListingImageRejection(new File(['x'], 'manual.pdf', { type: 'application/pdf' }), 0)).toContain('JPG')
    expect(getListingImageRejection({ type: 'image/jpeg', size: 11 * 1024 * 1024 }, 0)).toContain('10 MB')
    expect(getListingImageRejection(new File(['x'], 'last.jpg', { type: 'image/jpeg' }), 10)).toContain('10 imagens')
    expect(getListingImageRejection(new File(['x'], 'ok.jpg', { type: 'image/jpeg' }), 0)).toBeNull()
  })

  it('flags an extreme Ford Ka-style price and explains why it needs review', () => {
    const review = getListingPriceReview(1_600_000, 18_500)
    expect(review?.direction).toBe('above')
    expect(review?.differencePercent).toBeGreaterThan(8_000)
    expect(review?.reason).toContain('ocultado para revisão')
  })

  it('allows ordinary negotiation ranges and the review boundaries', () => {
    expect(getListingPriceReview(80_000, 100_000)).toBeNull()
    expect(getListingPriceReview(120_000, 100_000)).toBeNull()
    expect(getListingPriceReview(20_000, 100_000)).toBeNull()
    expect(getListingPriceReview(500_000, 100_000)).toBeNull()
  })

  it('does not infer a review without valid FIPE and catches very low outliers', () => {
    expect(getListingPriceReview(1_600_000, null)).toBeNull()
    expect(getListingPriceReview('invalid', 100_000)).toBeNull()
    expect(getListingPriceReview(10_000, 100_000)?.direction).toBe('below')
  })
})
