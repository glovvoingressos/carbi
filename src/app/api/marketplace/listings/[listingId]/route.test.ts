import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getAuthContext, getSupabaseServerClient, isSupabaseConfigured, runAutoDevSync } = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  runAutoDevSync: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({ getAuthContext }))
vi.mock('@/lib/supabase-server', () => ({ getSupabaseServerClient, isSupabaseConfigured }))
vi.mock('@/lib/integrations/autoDev/service', () => ({ runAutoDevSync }))
vi.mock('@/lib/email', () => ({
  sendListingDeletedEmail: vi.fn(),
  sendListingStatusChangedEmail: vi.fn(),
}))

import { PATCH } from './route'

describe('PATCH listing VIN response', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupabaseConfigured.mockReturnValue(true)
    getAuthContext.mockResolvedValue({ userId: 'owner-1', accessToken: 'access-token' })
    runAutoDevSync.mockResolvedValue(undefined)
  })

  it('stores VIN for the listing, linked vehicle, and AutoDev without returning it', async () => {
    const listing = {
      id: 'listing-1', user_id: 'owner-1', vehicle_id: 'vehicle-1', vehicle_type: 'car',
      title: 'Honda Civic', vin: null as string | null,
    }
    const vehicle = { id: 'vehicle-1', vin: null as string | null }
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'vehicle_listings') return {
          select: () => ({ eq: () => ({ single: async () => ({ data: { ...listing }, error: null }) }) }),
          update: (values: Record<string, unknown>) => {
            Object.assign(listing, values)
            return { eq: () => ({ select: () => ({ single: async () => ({ data: { ...listing }, error: null }) }) }) }
          },
        }
        if (table === 'vehicles') return {
          update: (values: Record<string, unknown>) => {
            Object.assign(vehicle, values)
            return { eq: async () => ({ error: null }) }
          },
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const request = new NextRequest('http://localhost/api/marketplace/listings/listing-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vin: '1hgcm82633a004352' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ listingId: 'listing-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(listing.vin).toBe('1HGCM82633A004352')
    expect(vehicle.vin).toBe('1HGCM82633A004352')
    expect(runAutoDevSync).toHaveBeenCalledWith({
      vehicleId: 'vehicle-1', requesterId: 'owner-1', accessToken: 'access-token',
      vinOverride: '1HGCM82633A004352', force: true,
    })
    expect(body).toMatchObject({ id: 'listing-1', title: 'Honda Civic' })
    expect(body).not.toHaveProperty('vin')
    expect(JSON.stringify(body)).not.toContain('1HGCM82633A004352')
  })

  it('redacts existing private vehicle data from a price-only PATCH response while preserving storage', async () => {
    const listing = {
      id: 'listing-1', user_id: 'owner-1', vehicle_id: null, vehicle_type: 'car',
      title: 'Honda Civic', price: 80000,
      vin: '1HGCM82633A004352', chassis: 'PRIVATE-CHASSIS', plate_final: 'PRIVATE-PLATE',
      structured_data: {
        color: 'silver',
        inspection: { vin: 'NESTED-VIN', owner: 'PRIVATE-OWNER' },
        history: [{ plate_number: 'NESTED-PLATE', note: 'serviced' }],
      },
      technical_data: {
        engine: '2.0',
        identifiers: { chassi: 'NESTED-CHASSIS', renavam: 'PRIVATE-RENAVAM' },
      },
    }
    const originalStructuredData = structuredClone(listing.structured_data)
    const originalTechnicalData = structuredClone(listing.technical_data)
    const storedUpdates: Record<string, unknown>[] = []
    getSupabaseServerClient.mockReturnValue({
      from: (table: string) => {
        if (table !== 'vehicle_listings') throw new Error(`Unexpected table: ${table}`)
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: { ...listing }, error: null }) }) }),
          update: (values: Record<string, unknown>) => {
            storedUpdates.push(values)
            Object.assign(listing, values)
            return { eq: () => ({ select: () => ({ single: async () => ({ data: { ...listing }, error: null }) }) }) }
          },
        }
      },
    })

    const request = new NextRequest('http://localhost/api/marketplace/listings/listing-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ price: 79000 }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ listingId: 'listing-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(storedUpdates).toEqual([{ price: 79000 }])
    expect(listing).toMatchObject({
      price: 79000, vin: '1HGCM82633A004352', chassis: 'PRIVATE-CHASSIS', plate_final: 'PRIVATE-PLATE',
    })
    expect(listing.structured_data).toEqual(originalStructuredData)
    expect(listing.technical_data).toEqual(originalTechnicalData)
    expect(body).toMatchObject({ id: 'listing-1', title: 'Honda Civic', price: 79000 })
    expect(body.structured_data).toEqual({
      color: 'silver', inspection: {}, history: [{ note: 'serviced' }],
    })
    expect(body.technical_data).toEqual({ engine: '2.0', identifiers: {} })
    expect(body).not.toHaveProperty('vin')
    expect(body).not.toHaveProperty('chassis')
    expect(body).not.toHaveProperty('plate_final')
    for (const value of [
      '1HGCM82633A004352', 'PRIVATE-CHASSIS', 'PRIVATE-PLATE', 'NESTED-VIN',
      'PRIVATE-OWNER', 'NESTED-PLATE', 'NESTED-CHASSIS', 'PRIVATE-RENAVAM',
    ]) {
      expect(JSON.stringify(body)).not.toContain(value)
    }
    expect(runAutoDevSync).not.toHaveBeenCalled()
  })
})
