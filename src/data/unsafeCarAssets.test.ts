import { describe, expect, it } from 'vitest'
import { getCatalogCarImage } from '@/data/unsafeCarAssets'

describe('catalog vehicle image safety', () => {
  it('never returns the mislabeled local Tiggo 7 or Tiggo 8 photos', () => {
    expect(getCatalogCarImage(
      'CAOA Chery',
      'Tiggo 7',
      '/assets/cars/caoa-chery-tiggo-7-pro-max-drive-16t-2026.png',
    )).toBeNull()

    expect(getCatalogCarImage(
      'CAOA Chery',
      'Tiggo 8',
      '/assets/cars/caoa-chery-tiggo-8-pro-plug-in-hybrid-2026.png',
    )).toBeNull()
  })

  it('uses the curated model-specific image for Tiggo 5X', () => {
    expect(getCatalogCarImage(
      'CAOA Chery',
      'Tiggo 5X',
      '/assets/cars/caoa-chery-tiggo-5x-sport-turbo-2026.png',
    )).toBe('https://cloudfront.alpes.one/public/690/3a6/f25/6903a6f254115278708991.png')
  })
})
