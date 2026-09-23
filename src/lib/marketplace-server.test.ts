import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getFipePrice, getSupabaseServerClient } = vi.hoisted(() => ({
  getFipePrice: vi.fn(),
  getSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/fipe-api', () => ({ getFipePrice }))
vi.mock('@/lib/supabase-server', () => ({ getSupabaseServerClient }))

import { enrichListingSignals } from './marketplace-server'

describe('enrichListingSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          in: () => ({ order: async () => ({ data: [], error: null }) }),
        }),
      }),
    })
    getFipePrice.mockResolvedValue(null)
  })

  it('can skip optional FIPE lookups while preserving persisted listing data', async () => {
    const listing = {
      id: 'listing-1',
      brand: 'Fiat',
      model: 'Argo',
      version: 'Drive',
      year_model: 2022,
      price: 60000,
      mileage: 30000,
      created_at: new Date().toISOString(),
      fipe_price: null,
      fipe_difference_percent: null,
    } as any

    const [result] = await enrichListingSignals([listing], { hydrateFipe: false })

    expect(getFipePrice).not.toHaveBeenCalled()
    expect(result).toMatchObject({ id: 'listing-1', price: 60000 })
  })
})
