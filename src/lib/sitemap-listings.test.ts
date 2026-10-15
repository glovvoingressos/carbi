import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchPublicSitemapListingsPage = vi.hoisted(() => vi.fn())

vi.mock('@/lib/marketplace-server', () => ({ fetchPublicSitemapListingsPage }))

import { getAllPublicSitemapListings } from '@/lib/sitemap-listings'

describe('getAllPublicSitemapListings', () => {
  beforeEach(() => fetchPublicSitemapListingsPage.mockReset())

  it('propagates inventory query failures instead of returning an empty sitemap', async () => {
    fetchPublicSitemapListingsPage.mockRejectedValueOnce(new Error('database unavailable'))

    await expect(getAllPublicSitemapListings()).rejects.toThrow('database unavailable')
  })

  it('distinguishes a valid empty inventory from a failed query', async () => {
    fetchPublicSitemapListingsPage.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 500 })

    await expect(getAllPublicSitemapListings()).resolves.toEqual({ cars: [], trucks: [] })
  })

  it('collects and de-duplicates all pages separately for cars and trucks', async () => {
    fetchPublicSitemapListingsPage.mockImplementation(async (input = {}) => {
      const { vehicleType, page = 1 } = input as { vehicleType?: string; page?: number }
      if (vehicleType === 'car' && page === 1) {
        return { items: [{ slug: 'car-a' }], total: 501, page, pageSize: 500 }
      }
      if (vehicleType === 'car') {
        return { items: [{ slug: 'car-a' }, { slug: 'car-b' }], total: 501, page, pageSize: 500 }
      }
      return { items: [{ slug: 'truck-a' }], total: 1, page, pageSize: 500 }
    })

    await expect(getAllPublicSitemapListings()).resolves.toEqual({
      cars: [{ slug: 'car-a' }, { slug: 'car-b' }],
      trucks: [{ slug: 'truck-a' }],
    })
    expect(fetchPublicSitemapListingsPage).toHaveBeenCalledTimes(3)
    expect(fetchPublicSitemapListingsPage).toHaveBeenNthCalledWith(1, { vehicleType: 'car', page: 1, includeImages: false })
    expect(fetchPublicSitemapListingsPage).toHaveBeenNthCalledWith(2, { vehicleType: 'truck', page: 1, includeImages: false })
    expect(fetchPublicSitemapListingsPage).toHaveBeenNthCalledWith(3, { vehicleType: 'car', page: 2, includeImages: false })
  })
})
