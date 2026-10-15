import { describe, expect, it } from 'vitest'
import { cars } from '@/data/cars'
import { groupCarsByModel, isTiggoFamilyRoute } from '@/lib/data-fetcher'

describe('groupCarsByModel', () => {
  it('keeps numbered Tiggo generations in separate canonical model slugs', () => {
    const tiggoCars = cars.filter((car) => /^Tiggo [78]$/.test(car.model))

    const groups = groupCarsByModel(tiggoCars)
    const slugs = groups.map((group) => group.modelSlug)

    expect(slugs).toEqual(expect.arrayContaining(['tiggo-7', 'tiggo-8']))
    expect(slugs).not.toContain('tiggo')
  })

  it('recognizes the legacy CAOA Chery Tiggo family route', () => {
    expect(isTiggoFamilyRoute('caoa-chery', 'tiggo')).toBe(true)
    expect(isTiggoFamilyRoute('caoa-chery', 'tiggo-7')).toBe(false)
    expect(isTiggoFamilyRoute('fiat', 'tiggo')).toBe(false)
  })
})
