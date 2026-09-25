import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getFipeComparison,
  getFipePrice,
  getListingVehicleId,
  getPublicListingBySlug,
  getRelatedListings,
  getSellerInfo,
  getVehicleEnrichmentForPublic,
} = vi.hoisted(() => ({
  getFipeComparison: vi.fn(),
  getFipePrice: vi.fn(),
  getListingVehicleId: vi.fn(),
  getPublicListingBySlug: vi.fn(),
  getRelatedListings: vi.fn(),
  getSellerInfo: vi.fn(),
  getVehicleEnrichmentForPublic: vi.fn(),
}))

vi.mock('next/navigation', () => ({ notFound: vi.fn() }))
vi.mock('@/lib/fipe-api', () => ({ getFipePrice }))
vi.mock('@/lib/marketplace', () => ({ getFipeComparison, parseFipePriceToNumber: (price: string) => Number(price) }))
vi.mock('@/lib/marketplace-server', () => ({
  getListingVehicleId,
  getPublicListingBySlug,
  getRelatedListings,
  getSellerInfo,
}))
vi.mock('@/lib/vehicle-enrichment-server', () => ({ getVehicleEnrichmentForPublic }))

import ListingDetailPage from './page'

describe('ListingDetailPage FIPE comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPublicListingBySlug.mockResolvedValue({
      id: 'listing-1',
      user_id: 'seller-1',
      slug: 'fiat-bravo',
      title: 'Fiat Bravo',
      brand: 'Fiat',
      model: 'Bravo',
      year_model: 2013,
      version: 'Essence',
      price: 42000,
      fipe_price: 39000,
      city: 'São Paulo',
      state: 'SP',
      images: [],
    })
    getRelatedListings.mockResolvedValue([])
    getListingVehicleId.mockResolvedValue(null)
    getSellerInfo.mockResolvedValue(null)
    getVehicleEnrichmentForPublic.mockResolvedValue(null)
  })

  it('uses the persisted FIPE price without making a live FIPE API request', async () => {
    await ListingDetailPage({ params: Promise.resolve({ slug: 'fiat-bravo' }) })

    expect(getFipeComparison).toHaveBeenCalledWith(42000, 39000)
    expect(getFipePrice).not.toHaveBeenCalled()
  })
})
