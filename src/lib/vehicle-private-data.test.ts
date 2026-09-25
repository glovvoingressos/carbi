import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSupabaseAdminClient } = vi.hoisted(() => ({ getSupabaseAdminClient: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ getSupabaseAdminClient }))

import { getPrivateVehicleLookup, savePrivateVehicleFipeIdentity, savePrivateVehicleFipeRefreshState, savePrivateVehicleLookup } from './vehicle-private-data'

describe('private vehicle lookup storage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stores a normalized plate and FIPE identity only in the private lookup table', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ upsert }) })

    await savePrivateVehicleLookup('vehicle-1', 'owner-1', {
      plate: 'abc-1d23',
      brand: 'Fiat',
      model: 'Bravo',
      version: 'Essence 1.8',
      year_model: 2013,
      fipe_model_name: 'Bravo ESSENCE 1.8 16V Flex',
      fipe_code: '001234-5',
    })

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      vehicle_id: 'vehicle-1',
      owner_user_id: 'owner-1',
      plate: 'ABC1D23',
      fipe_code: '001234-5',
      fipe_model_name: 'Bravo ESSENCE 1.8 16V Flex',
    }), { onConflict: 'vehicle_id' })
  })

  it('reads only the private lookup fields for server-side FIPE history resolution', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: {
      plate: 'ABC1D23',
      fipe_model_name: 'Bravo Essence',
      fipe_last_refresh_attempt_at: null,
      fipe_next_refresh_at: '2026-09-25T10:00:00Z',
      fipe_refresh_attempt_count: 0,
      fipe_refresh_attempt_month: null,
    }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) })

    const result = await getPrivateVehicleLookup('vehicle-1')

    expect(select).toHaveBeenCalledWith('plate, brand, model, version, year_model, fipe_model_name, fipe_code, fipe_history, fipe_last_refresh_attempt_at, fipe_next_refresh_at, fipe_refresh_attempt_count, fipe_refresh_attempt_month')
    expect(eq).toHaveBeenCalledWith('vehicle_id', 'vehicle-1')
    expect(result?.plate).toBe('ABC1D23')
    expect(result?.fipe_next_refresh_at).toBe('2026-09-25T10:00:00Z')
    expect(result?.fipe_refresh_attempt_count).toBe(0)
  })

  it('propagates a private lookup query error instead of reporting a missing vehicle', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'lookup failed' } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) })

    await expect(getPrivateVehicleLookup('vehicle-1')).rejects.toThrow('lookup failed')
  })

  it('saves only refresh scheduling metadata for the requested vehicle', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { vehicle_id: 'vehicle-1' }, error: null })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    getSupabaseAdminClient.mockReturnValue({ from })

    await savePrivateVehicleFipeRefreshState('vehicle-1', {
      fipe_last_refresh_attempt_at: '2026-09-24T10:00:00Z',
      fipe_next_refresh_at: '2026-09-27T10:00:00Z',
      fipe_refresh_attempt_count: 2,
      fipe_refresh_attempt_month: '2026-09',
    })

    expect(from).toHaveBeenCalledWith('vehicle_private_identifiers')
    expect(update).toHaveBeenCalledWith({
      fipe_last_refresh_attempt_at: '2026-09-24T10:00:00Z',
      fipe_next_refresh_at: '2026-09-27T10:00:00Z',
      fipe_refresh_attempt_count: 2,
      fipe_refresh_attempt_month: '2026-09',
    })
    expect(eq).toHaveBeenCalledWith('vehicle_id', 'vehicle-1')
    expect(select).toHaveBeenCalledWith('vehicle_id')
  })

  it('rejects a refresh-state update when no private vehicle row matched', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) }) })

    await expect(savePrivateVehicleFipeRefreshState('missing-vehicle', {
      fipe_last_refresh_attempt_at: '2026-09-24T10:00:00Z',
      fipe_next_refresh_at: '2026-09-27T10:00:00Z',
      fipe_refresh_attempt_count: 2,
      fipe_refresh_attempt_month: '2026-09',
    })).rejects.toThrow('Falha ao salvar agendamento FIPE do veículo.')
  })

  it('caches non-empty history in the private vehicle record', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ update }) })
    const history = [{ month: 'setembro/2026', price: 'R$ 38.000,00', priceNum: 38000 }]

    const { savePrivateVehicleFipeHistory } = await import('./vehicle-private-data')
    await savePrivateVehicleFipeHistory('vehicle-1', history)

    expect(update).toHaveBeenCalledWith({ fipe_history: history })
    expect(eq).toHaveBeenCalledWith('vehicle_id', 'vehicle-1')
  })

  it('persists the exact FIPE model identity recovered from the stored plate', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ update }) })

    await savePrivateVehicleFipeIdentity('vehicle-1', { fipe_model_name: 'Bravo Essence 1.8', fipe_code: '001234-5' })

    expect(update).toHaveBeenCalledWith({ fipe_model_name: 'Bravo Essence 1.8', fipe_code: '001234-5' })
  })
})
