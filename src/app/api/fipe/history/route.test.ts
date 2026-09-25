import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getFipeMonthlyHistory, getFipeHistory, isFipeRateLimited, getPrivateVehicleLookup, getSupabaseServerClient, isSupabaseConfigured, savePrivateVehicleFipeHistory, savePrivateVehicleFipeIdentity, lookupPlate } = vi.hoisted(() => ({
  getFipeMonthlyHistory: vi.fn(),
  getFipeHistory: vi.fn(),
  isFipeRateLimited: vi.fn(),
  getPrivateVehicleLookup: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  savePrivateVehicleFipeHistory: vi.fn(),
  savePrivateVehicleFipeIdentity: vi.fn(),
  lookupPlate: vi.fn(),
}))

vi.mock('@/lib/fipe-api', () => ({
  getFipeMonthlyHistory,
  getFipeHistory,
  isFipeRateLimited,
}))

vi.mock('@/lib/vehicle-private-data', () => ({ getPrivateVehicleLookup, savePrivateVehicleFipeHistory, savePrivateVehicleFipeIdentity }))
vi.mock('@/lib/integrations/placaapi/service', () => ({ lookupPlate }))
vi.mock('@/lib/supabase-server', () => ({ getSupabaseServerClient, isSupabaseConfigured }))

describe('GET /api/fipe/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupabaseConfigured.mockReturnValue(true)
    getFipeHistory.mockResolvedValue([])
    getPrivateVehicleLookup.mockResolvedValue(null)
    savePrivateVehicleFipeHistory.mockResolvedValue(undefined)
    savePrivateVehicleFipeIdentity.mockResolvedValue(undefined)
    lookupPlate.mockResolvedValue({ success: false })
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    })
  })

  it('does not run the expensive annual fallback while FIPE is rate limited', async () => {
    getFipeMonthlyHistory.mockResolvedValue([])
    isFipeRateLimited.mockReturnValue(true)
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/fipe/history?brand=Fiat&model=Bravo&year=2013')

    const response = await GET(request as never)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
    expect(getFipeHistory).not.toHaveBeenCalled()
  })

  it('returns the saved Placa API FIPE snapshot when the history provider is rate limited', async () => {
    getFipeMonthlyHistory.mockResolvedValue([])
    isFipeRateLimited.mockReturnValue(true)
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: {
            vehicle_id: 'vehicle-123', brand: 'Fiat', model: 'Bravo', version: 'Essence 1.8', year_model: 2013,
            fipe_price: 38950, fipe_reference_month: 'setembro/2026',
          }, error: null }) }),
        }),
      }),
    })
    const { GET } = await import('./route')

    const response = await GET(new Request('http://localhost/api/fipe/history?listingId=listing-123') as never)

    expect(await response.json()).toEqual([{ month: 'setembro/2026', price: 'R$ 38.950', priceNum: 38950 }])
    expect(response.headers.get('x-fipe-history-source')).toBe('current-snapshot')
  })

  it('returns the public listing snapshot when the private lookup throws', async () => {
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: {
            vehicle_id: 'vehicle-123', brand: 'Fiat', model: 'Bravo', version: 'Essence 1.8', year_model: 2013,
            fipe_price: 38950, fipe_reference_month: 'setembro/2026',
          }, error: null }) }),
        }),
      }),
    })
    getPrivateVehicleLookup.mockRejectedValue(new Error('private lookup database error'))
    const { GET } = await import('./route')

    const response = await GET(new Request('http://localhost/api/fipe/history?listingId=listing-123') as never)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ month: 'setembro/2026', price: 'R$ 38.950', priceNum: 38950 }])
    expect(response.headers.get('x-fipe-history-source')).toBe('current-snapshot')
    expect(getFipeMonthlyHistory).not.toHaveBeenCalled()
    expect(getFipeHistory).not.toHaveBeenCalled()
    expect(lookupPlate).not.toHaveBeenCalled()
  })

  it('sets a shared cache for successful FIPE history results', async () => {
    const points = [
      { month: 'agosto/2026', price: 'R$ 32.800,00', priceNum: 32800 },
      { month: 'setembro/2026', price: 'R$ 32.984,00', priceNum: 32984 },
    ]
    getFipeMonthlyHistory.mockResolvedValue(points)
    isFipeRateLimited.mockReturnValue(false)
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/fipe/history?brand=Fiat&model=Bravo&year=2013')

    const response = await GET(request as never)

    expect(await response.json()).toEqual(points)
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400')
    expect(getFipeHistory).not.toHaveBeenCalled()
  })

  it('resolves history identity from the private plate lookup linked to the public listing', async () => {
    const points = [
      { month: 'agosto/2026', price: 'R$ 37.000,00', priceNum: 37000 },
      { month: 'setembro/2026', price: 'R$ 38.000,00', priceNum: 38000 },
    ]
    getFipeMonthlyHistory.mockResolvedValue(points)
    isFipeRateLimited.mockReturnValue(false)
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: {
            vehicle_id: 'vehicle-123', brand: 'Fiat', model: 'Bravo', version: 'Essence 1.8', year_model: 2013,
          }, error: null }) }),
        }),
      }),
    })
    getPrivateVehicleLookup.mockResolvedValue({
      plate: 'ABC1D23',
      brand: 'Fiat',
      model: 'Bravo',
      year_model: 2013,
      fipe_model_name: 'Bravo ESSENCE 1.8 16V Flex',
    })
    const { GET } = await import('./route')

    const response = await GET(new Request('http://localhost/api/fipe/history?listingId=listing-123') as never)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual(points)
    expect(getPrivateVehicleLookup).toHaveBeenCalledWith('vehicle-123')
    expect(getFipeMonthlyHistory).toHaveBeenCalledWith('Fiat', 'Bravo', 2013, 'Bravo ESSENCE 1.8 16V Flex', 2)
    expect(JSON.stringify(payload)).not.toContain('ABC1D23')
  })

  it('serves persisted FIPE history without requesting the rate-limited provider again', async () => {
    const points = [{ month: 'setembro/2026', price: 'R$ 38.000,00', priceNum: 38000 }]
    getSupabaseServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { vehicle_id: 'vehicle-123' }, error: null }) }),
        }),
      }),
    })
    getPrivateVehicleLookup.mockResolvedValue({ plate: 'ABC1D23', fipe_history: points })
    const { GET } = await import('./route')

    const response = await GET(new Request('http://localhost/api/fipe/history?listingId=listing-123') as never)

    expect(await response.json()).toEqual(points)
    expect(getFipeMonthlyHistory).not.toHaveBeenCalled()
    expect(getFipeHistory).not.toHaveBeenCalled()
  })

  it('uses a stored plate to recover the precise FIPE model when older private data lacks it', async () => {
    getFipeMonthlyHistory.mockResolvedValue([{ month: 'setembro/2026', price: 'R$ 38.000,00', priceNum: 38000 }])
    getSupabaseServerClient.mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: { vehicle_id: 'vehicle-123', brand: 'Fiat', model: 'Bravo', version: 'Essence 1.8', year_model: 2013 },
        error: null,
      }) }) }) }),
    })
    getPrivateVehicleLookup.mockResolvedValue({ plate: 'ABC1D23', brand: 'Fiat', model: 'Bravo', year_model: 2013 })
    lookupPlate.mockResolvedValue({ success: true, data: {
      marca: 'Fiat', modelo: 'BRAVO', versao: 'Essence 1.8', anoModelo: 2013,
      fipe_model_name: 'BRAVO ESSENCE 1.8 16V Flex', fipe_code: '001234-5',
    } })
    const { GET } = await import('./route')

    const response = await GET(new Request('http://localhost/api/fipe/history?listingId=listing-123') as never)

    expect(lookupPlate).toHaveBeenCalledWith('ABC1D23')
    expect(getFipeMonthlyHistory).toHaveBeenCalledWith('Fiat', 'BRAVO', 2013, 'BRAVO ESSENCE 1.8 16V Flex', 2)
    expect(savePrivateVehicleFipeIdentity).toHaveBeenCalledWith('vehicle-123', expect.objectContaining({ fipe_code: '001234-5' }))
    expect(response.status).toBe(200)
  })
})
