import { describe, expect, it } from 'vitest'

import {
  buildFipeResultFromPlateLookup,
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
})
