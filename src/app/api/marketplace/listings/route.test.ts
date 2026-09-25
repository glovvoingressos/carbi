import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getAuthContext, getSupabaseServerClient, isSupabaseConfigured } = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({ getAuthContext }))
vi.mock('@/lib/supabase-server', () => ({ getSupabaseServerClient, isSupabaseConfigured }))
vi.mock('@/lib/email', () => ({
  sendListingCreatedEmail: vi.fn(),
  sendAdminNewListingEmail: vi.fn(),
  sendListingDeletedEmail: vi.fn(),
  sendListingStatusChangedEmail: vi.fn(),
}))
vi.mock('@/lib/integrations/autoDev/service', () => ({ runAutoDevSync: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notifyListingPublished: vi.fn() }))
vi.mock('@/lib/vehicle-private-data', () => ({ savePrivateVehicleLookup: vi.fn() }))

const request = (method: 'POST' | 'PATCH', body: Record<string, unknown>) => new NextRequest(
  'http://localhost/api/marketplace/listings/listing-1',
  { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
)

describe('listing structured data writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupabaseConfigured.mockReturnValue(true)
    getAuthContext.mockResolvedValue({ userId: 'owner-1', accessToken: 'access-token' })
  })

  it('creates a truck with safe specs in both records and no normalized private identifiers', async () => {
    const writes: Record<string, Record<string, unknown>> = {}
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'vehicles') return {
          insert: (values: Record<string, unknown>) => {
            writes.vehicle = values
            return { select: () => ({ single: async () => ({ data: { id: 'vehicle-1' }, error: null }) }) }
          },
        }
        if (table === 'vehicle_listings') return {
          select: () => ({ eq: () => ({ eq: async () => ({ count: 0, error: null }) }) }),
          insert: (values: Record<string, unknown>) => {
            writes.listing = values
            return { select: () => ({ single: async () => ({ data: { id: 'listing-1', slug: 'truck-1', created_at: '2026-09-24' }, error: null }) }) }
          },
        }
        if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { email: null, full_name: 'Owner' }, error: null }) }) }) }
        throw new Error(`Unexpected table: ${table}`)
      },
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    })
    const { POST } = await import('./route')

    const response = await POST(request('POST', {
      vehicle_type: 'truck', brand: 'Volvo', model: 'FH', year: 2024, year_model: 2024,
      mileage: 12000, price: 350000, transmission: 'Automático', fuel: 'Diesel',
      color: 'Branco', body_type: 'Caminhão', city: 'São Paulo', state: 'SP',
      optional_items: [], chassis: 'PRIVATE-CHASSIS', cabin_type: 'Leito', pbt: 23000,
      structured_data: {
        origin: 'manual', renavam: 'PRIVATE-RENAVAM', details: { axles: 3, ownerCpf: 'PRIVATE-CPF' },
      },
    }))

    expect(response.status).toBe(201)
    for (const stored of [writes.listing.structured_data, writes.vehicle.technical_data]) {
      expect(stored).toEqual({ origin: 'manual', details: { axles: 3 }, cabin_type: 'Leito', pbt: 23000 })
      expect(JSON.stringify(stored)).not.toMatch(/PRIVATE-CHASSIS|PRIVATE-RENAVAM|PRIVATE-CPF/)
    }
    expect(writes.listing).toMatchObject({ vehicle_type: 'truck', pbt: 23000 })
  })

  it('patches truck specs and an unrelated price without storing normalized private identifiers', async () => {
    const writes: Record<string, Record<string, unknown>> = {}
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'vehicle_listings') return {
          select: () => ({ eq: () => ({ single: async () => ({ data: {
            id: 'listing-1', user_id: 'owner-1', vehicle_id: 'vehicle-1', vehicle_type: 'truck',
            structured_data: { origin: 'old' }, price: 300000,
          }, error: null }) }) }),
          update: (values: Record<string, unknown>) => {
            writes.listing = values
            return { eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'listing-1', ...values }, error: null }) }) }) }
          },
        }
        if (table === 'vehicles') return {
          update: (values: Record<string, unknown>) => {
            writes.vehicle = values
            return { eq: async () => ({ error: null }) }
          },
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })
    const { PATCH } = await import('./[listingId]/route')

    const response = await PATCH(request('PATCH', {
      price: 340000, chassis: 'PRIVATE-CHASSIS', pbt: 24000, cabin_type: 'Leito',
      structured_data: { origin: 'edited', details: { axles: 4, plate_number: 'PRIVATE-PLATE' } },
    }), { params: Promise.resolve({ listingId: 'listing-1' }) })

    expect(response.status).toBe(200)
    for (const stored of [writes.listing.structured_data, writes.vehicle.technical_data]) {
      expect(stored).toEqual({ origin: 'edited', details: { axles: 4 }, pbt: 24000, cabin_type: 'Leito' })
      expect(JSON.stringify(stored)).not.toMatch(/PRIVATE-CHASSIS|PRIVATE-PLATE/)
    }
    expect(writes.listing).toMatchObject({ price: 340000, pbt: 24000, cabin_type: 'Leito' })
  })
})

describe('POST /api/marketplace/listings FIPE snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupabaseConfigured.mockReturnValue(true)
    getAuthContext.mockResolvedValue({ userId: 'owner-1', accessToken: 'access-token' })
  })

  async function createWithSnapshot(fipe_price: number, fipe_reference_month: string) {
    const writes: Record<string, Record<string, unknown>> = {}
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'vehicles') return {
          insert: (values: Record<string, unknown>) => {
            writes.vehicle = values
            return { select: () => ({ single: async () => ({ data: { id: 'vehicle-1' }, error: null }) }) }
          },
        }
        if (table === 'vehicle_listings') return {
          select: () => ({ eq: () => ({ eq: async () => ({ count: 0, error: null }) }) }),
          insert: (values: Record<string, unknown>) => {
            writes.listing = values
            return { select: () => ({ single: async () => ({ data: { id: 'listing-1', slug: 'car-1', created_at: '2026-09-24' }, error: null }) }) }
          },
        }
        if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { email: null, full_name: 'Owner' }, error: null }) }) }) }
        throw new Error(`Unexpected table: ${table}`)
      },
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    })
    const { POST } = await import('./route')
    const response = await POST(request('POST', {
      vehicle_type: 'car', brand: 'Fiat', model: 'Bravo', year: 2012, year_model: 2013,
      mileage: 12000, price: 40000, transmission: 'Manual', fuel: 'Flex',
      color: 'Prata', body_type: 'Hatch', city: 'São Paulo', state: 'SP',
      optional_items: [], fipe_price, fipe_reference_month,
    }))
    expect(response.status).toBe(201)
    return writes
  }

  it('suppresses both FIPE fields in both records when the reference month is invalid', async () => {
    const writes = await createWithSnapshot(38950, 'referência inválida')

    for (const stored of [writes.vehicle, writes.listing]) {
      expect(stored).toMatchObject({ fipe_price: null, fipe_reference_month: null })
    }
  })

  it('keeps a positive FIPE snapshot with a parseable reference month in both records', async () => {
    const writes = await createWithSnapshot(38950, 'setembro/2026')

    for (const stored of [writes.vehicle, writes.listing]) {
      expect(stored).toMatchObject({ fipe_price: 38950, fipe_reference_month: 'setembro/2026' })
    }
  })

  it('suppresses both FIPE fields when the price is not positive', async () => {
    const writes = await createWithSnapshot(0, 'setembro/2026')

    for (const stored of [writes.vehicle, writes.listing]) {
      expect(stored).toMatchObject({ fipe_price: null, fipe_reference_month: null })
    }
  })
})
