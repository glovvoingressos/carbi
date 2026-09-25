import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getFipePrice, getSupabaseServerClient, getSupabaseAdminClient, getPrivateVehicleLookup, lookupPlate, isSupabaseConfigured } = vi.hoisted(() => ({
  getFipePrice: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  getPrivateVehicleLookup: vi.fn(),
  lookupPlate: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}))

vi.mock('@/lib/fipe-api', () => ({ getFipePrice }))
vi.mock('@/lib/vehicle-private-data', () => ({ getPrivateVehicleLookup }))
vi.mock('@/lib/integrations/placaapi/service', () => ({ lookupPlate }))
vi.mock('@/lib/supabase-server', () => ({ getSupabaseServerClient, getSupabaseAdminClient, isSupabaseConfigured }))

import { enrichListingSignals, getPublicListingBySlug, restoreListingFipeSnapshots } from './marketplace-server'

describe('enrichListingSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupabaseConfigured.mockReturnValue(true)
    getSupabaseAdminClient.mockReturnValue(null)
    getPrivateVehicleLookup.mockResolvedValue(null)
    lookupPlate.mockResolvedValue({ success: false })
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          in: () => ({ order: async () => ({ data: [], error: null }) }),
        }),
      }),
    })
    getFipePrice.mockResolvedValue(null)
  })

  it('does not fan out optional FIPE lookups for listing collections', async () => {
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

    const results = await enrichListingSignals([listing, { ...listing, id: 'listing-2' }])

    expect(getFipePrice).not.toHaveBeenCalled()
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ id: 'listing-1', price: 60000 })
  })

  it('uses the stored Placa API snapshot without exposing plate or VIN on a public listing', async () => {
    const listing = {
      id: 'listing-detail',
      user_id: 'seller-1',
      vehicle_id: 'vehicle-snapshot',
      slug: 'fiat-bravo',
      title: 'Fiat Bravo',
      brand: 'Fiat',
      model: 'Bravo',
      version: 'Essence',
      year: 2013,
      year_model: 2013,
      mileage: 80000,
      price: 42000,
      fipe_price: null,
      plate_final: 'ABC1D23',
      vin: '1HGCM82633A004352',
      structured_data: { placa: 'ABC1D23', fuel: 'Flex' },
      fipe_difference_value: 3000,
      fipe_difference_percent: 7.69,
      created_at: new Date().toISOString(),
      images: [],
    } as any

    const publicQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: listing, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const historyQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const vehicleQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: 'vehicle-snapshot', fipe_price: 39000, fipe_reference_month: '2026-08' }],
        error: null,
      }),
    }
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => table === 'vehicle_price_history' ? historyQuery : table === 'vehicles' ? vehicleQuery : publicQuery,
    })
    const result = await getPublicListingBySlug('fiat-bravo')

    expect(getFipePrice).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      id: 'listing-detail',
      fipe_price: 39000,
      fipe_reference_month: '2026-08',
      fipe_difference_value: 3000,
      fipe_difference_percent: 7.692,
      plate_final: null,
      structured_data: { fuel: 'Flex' },
    })
    expect(JSON.stringify(result)).not.toContain('ABC1D23')
    expect(result).not.toHaveProperty('vin')
    expect(JSON.stringify(result)).not.toContain('1HGCM82633A004352')
  })

  it('restores missing listing FIPE comparisons from the linked vehicle snapshot', async () => {
    const listing = {
      id: 'listing-with-vehicle-snapshot',
      vehicle_id: 'vehicle-snapshot',
      user_id: 'seller-1',
      slug: 'fiat-argo',
      title: 'Fiat Argo',
      brand: 'Fiat',
      model: 'Argo',
      version: 'Drive',
      year: 2022,
      year_model: 2022,
      mileage: 30000,
      price: 60000,
      fipe_price: null,
      fipe_reference_month: null,
      fipe_difference_value: null,
      fipe_difference_percent: null,
      created_at: new Date().toISOString(),
      images: [],
    }
    const result = restoreListingFipeSnapshots([listing] as any, [
      { id: 'vehicle-snapshot', fipe_price: 65000, fipe_reference_month: '2026-08' },
    ])

    expect(result[0]).toMatchObject({
      fipe_price: 65000,
      fipe_reference_month: '2026-08',
      fipe_difference_value: -5000,
      fipe_difference_percent: -7.692,
    })
    expect(getFipePrice).not.toHaveBeenCalled()
  })

  it('returns no FIPE snapshot and makes no external lookup or write when stored snapshots are missing', async () => {
    const listing = {
      id: 'legacy-listing',
      vehicle_id: 'legacy-vehicle',
      user_id: 'seller-1',
      slug: 'legacy-honda-civic',
      title: 'Honda Civic',
      brand: 'Honda',
      model: 'Civic',
      version: 'EXL',
      year: 2018,
      year_model: 2018,
      mileage: 70000,
      price: 100000,
      fipe_price: null,
      fipe_reference_month: null,
      fipe_difference_value: null,
      fipe_difference_percent: null,
      created_at: new Date().toISOString(),
      images: [],
    }
    const publicQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: listing, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const vehicleQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ id: 'legacy-vehicle', fipe_price: null, fipe_reference_month: null }], error: null }),
    }
    const historyQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => table === 'vehicles' ? vehicleQuery : table === 'vehicle_price_history' ? historyQuery : publicQuery,
    })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ update }) })
    getPrivateVehicleLookup.mockResolvedValue({ plate: 'ABC1D23' })
    lookupPlate.mockResolvedValue({ success: true, data: { fipe_price: 97000, fipe_reference_month: 'setembro/2026' } })
    getFipePrice.mockResolvedValue({ price: 'R$ 96.500,00', referenceMonth: 'setembro/2026' })

    const result = await getPublicListingBySlug('legacy-honda-civic')

    expect(result).toMatchObject({
      id: 'legacy-listing',
      fipe_price: null,
      fipe_reference_month: null,
      fipe_difference_value: null,
      fipe_difference_percent: null,
    })
    expect(getFipePrice).not.toHaveBeenCalled()
    expect(getPrivateVehicleLookup).not.toHaveBeenCalled()
    expect(lookupPlate).not.toHaveBeenCalled()
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
})
