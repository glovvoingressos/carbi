import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSupabaseAdminClient, lookupPlate, savePrivateVehicleFipeRefreshState } = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
  lookupPlate: vi.fn(),
  savePrivateVehicleFipeRefreshState: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({ getSupabaseAdminClient }))
vi.mock('@/lib/integrations/placaapi/service', () => ({ lookupPlate }))
vi.mock('@/lib/vehicle-private-data', () => ({ savePrivateVehicleFipeRefreshState }))

import { runFipeRefreshBatch } from './fipe-refresh-worker'

function createQuery(data: unknown, error: unknown = null) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    not: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    update: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data, error })),
    then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve),
  }
  return query
}

type ActiveListingMock = { vehicle_id: string | null; fipe_price?: number | null; fipe_reference_month?: string | null }
type PrivateLookupMock = {
  vehicle_id: string
  plate: string
  brand: string
  model: string
  year_model: number
  fipe_last_refresh_attempt_at: string | null
  fipe_next_refresh_at: string
  fipe_refresh_attempt_count: number
  fipe_refresh_attempt_month: string | null
  fipe_reference_month?: string | null
}

function setupDb({
  active = [],
  privateLookup = [],
  vehicleSnapshots = [],
  vehiclesUpdateError = null,
  applySnapshotResult = true,
}: {
  active?: ActiveListingMock[]
  privateLookup?: PrivateLookupMock[]
  vehicleSnapshots?: Array<{ id: string; fipe_price: number | null; fipe_reference_month: string | null }>
  vehiclesUpdateError?: unknown
  applySnapshotResult?: boolean
} = {}) {
  const queries: Array<{ table: string; query: ReturnType<typeof createQuery> }> = []
  const canonicalVehicleSnapshots = vehicleSnapshots.length > 0
    ? vehicleSnapshots
    : [...new Map(active.filter(row => row.vehicle_id).map(row => [row.vehicle_id, {
      id: row.vehicle_id as string,
      fipe_price: row.fipe_price ?? null,
      fipe_reference_month: row.fipe_reference_month ?? null,
    }])).values()]
  let claimed = false
  const admin = {
    from: vi.fn((table: string) => {
      let data: unknown = []
      let error: unknown = null
      if (table === 'vehicles') {
        data = canonicalVehicleSnapshots
      }
      const query = createQuery(data, error)
      queries.push({ table, query })
      return query
    }),
    rpc: vi.fn(async (name: string) => {
      if (name === 'claim_due_private_vehicle_fipe_refreshes') {
        if (claimed) return { data: [], error: null }
        claimed = true
        return { data: privateLookup.filter(row => active.some(listing => listing.vehicle_id === row.vehicle_id)), error: null }
      }
      return { data: applySnapshotResult, error: vehiclesUpdateError }
    }),
  }
  getSupabaseAdminClient.mockReturnValue(admin)
  return { admin, queries }
}

const now = new Date('2026-09-24T10:00:00.000Z')
const dueLookup = (vehicle_id: string, overrides: Record<string, unknown> = {}) => ({
  vehicle_id, plate: 'ABC1D23', brand: 'Fiat', model: 'Bravo', year_model: 2013,
  fipe_last_refresh_attempt_at: null,
  fipe_next_refresh_at: '2026-09-01T10:00:00.000Z',
  fipe_refresh_attempt_count: 0,
  fipe_refresh_attempt_month: null,
  ...overrides,
})

describe('runFipeRefreshBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSupabaseAdminClient.mockReturnValue(null)
    lookupPlate.mockResolvedValue({ success: true, data: { fipe_price: 100000, fipe_reference_month: 'setembro/2026' } })
    savePrivateVehicleFipeRefreshState.mockResolvedValue(undefined)
  })

  it('returns empty aggregate counts when no active listing has a vehicle', async () => {
    setupDb({ active: [{ vehicle_id: null }, { vehicle_id: null }] })

    await expect(runFipeRefreshBatch({ limit: 5, now })).resolves.toEqual({
      scanned: 0, updatedVehicles: 0, unchanged: 0, skipped: 0, retried: 0, failed: 0,
    })
    expect(lookupPlate).not.toHaveBeenCalled()
  })

  it('does not query private identifiers when there are no active listings', async () => {
    setupDb({ active: [], privateLookup: [dueLookup('inactive-vehicle')] })

    const result = await runFipeRefreshBatch({ limit: 5, now })

    expect(result).toMatchObject({ scanned: 0, skipped: 0 })
    expect(lookupPlate).not.toHaveBeenCalled()
    expect(savePrivateVehicleFipeRefreshState).not.toHaveBeenCalled()
  })

  it('deduplicates a vehicle and updates its active listings only for a newer snapshot', async () => {
    const { queries } = setupDb({
      active: [
        { vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' },
        { vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' },
        { vehicle_id: 'vehicle-2', fipe_price: null, fipe_reference_month: null },
      ],
      privateLookup: [dueLookup('vehicle-1', { fipe_reference_month: 'agosto/2026' })],
    })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ scanned: 1, updatedVehicles: 1, skipped: 0 })
    expect(lookupPlate).toHaveBeenCalledTimes(1)
    expect(lookupPlate).toHaveBeenCalledWith('ABC1D23')
    expect(vi.mocked(getSupabaseAdminClient).mock.results[0]?.value.rpc).toHaveBeenCalledWith('apply_monthly_fipe_snapshot', expect.objectContaining({
      p_vehicle_id: 'vehicle-1',
      p_fipe_price: 100000,
      p_fipe_reference_month: 'setembro/2026',
      p_allow_same_reference: false,
    }))
  })

  it.each(['setembro/2026', 'outubro/2026', 'invalid'])('does not overwrite an existing snapshot when stored reference is %s', async (currentMonth) => {
    setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: currentMonth }],
      privateLookup: [dueLookup('vehicle-1', { fipe_reference_month: currentMonth })],
    })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result.updatedVehicles).toBe(0)
    expect(result.unchanged).toBe(1)
    expect(vi.mocked(getSupabaseAdminClient).mock.results[0]?.value.rpc.mock.calls.some(([name]: [string]) => name === 'apply_monthly_fipe_snapshot')).toBe(currentMonth !== 'invalid')
  })

  it('accepts a valid first snapshot when no prior month exists', async () => {
    setupDb({ active: [{ vehicle_id: 'vehicle-1', fipe_price: null, fipe_reference_month: null }], privateLookup: [dueLookup('vehicle-1')] })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result.updatedVehicles).toBe(1)
    expect(vi.mocked(getSupabaseAdminClient).mock.results[0]?.value.rpc).toHaveBeenCalledWith('apply_monthly_fipe_snapshot', expect.objectContaining({ p_fipe_price: 100000 }))
  })

  it('refreshes a legacy zero-price snapshot while comparing against its exact stored value', async () => {
    const { admin } = setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 0, fipe_reference_month: null }],
      privateLookup: [dueLookup('vehicle-1')],
    })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result.updatedVehicles).toBe(1)
    expect(admin.rpc).toHaveBeenCalledWith('apply_monthly_fipe_snapshot', expect.objectContaining({
      p_expected_vehicle_price: 0,
      p_fipe_price: 100000,
    }))
  })

  it('keeps checking an unchanged valid reference weekly without consuming failure retries', async () => {
    setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'setembro/2026' }],
      privateLookup: [dueLookup('vehicle-1', { fipe_refresh_attempt_count: 4, fipe_refresh_attempt_month: '2026-09' })],
    })
    lookupPlate.mockResolvedValue({ success: true, data: { fipe_price: 91000, fipe_reference_month: 'setembro/2026' } })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ unchanged: 1, retried: 0, updatedVehicles: 0 })
    expect(savePrivateVehicleFipeRefreshState).toHaveBeenCalledWith('vehicle-1', expect.objectContaining({
      fipe_refresh_attempt_count: 0,
      fipe_refresh_attempt_month: '2026-09',
      fipe_next_refresh_at: '2026-10-01T10:00:00.000Z',
    }))
  })

  it('repairs a stale listing from the newer canonical snapshot without overwriting it', async () => {
    const { admin } = setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 80000, fipe_reference_month: 'agosto/2026' }],
      privateLookup: [dueLookup('vehicle-1')],
      vehicleSnapshots: [{ id: 'vehicle-1', fipe_price: 100000, fipe_reference_month: 'setembro/2026' }],
    })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ updatedVehicles: 0, unchanged: 1 })
    expect(admin.rpc).toHaveBeenCalledWith('apply_monthly_fipe_snapshot', expect.objectContaining({
      p_fipe_price: 100000,
      p_fipe_reference_month: 'setembro/2026',
      p_allow_same_reference: true,
    }))
  })

  it('preserves snapshots and schedules a bounded retry for rate limits', async () => {
    const { admin } = setupDb({ active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' }], privateLookup: [dueLookup('vehicle-1')] })
    lookupPlate.mockResolvedValue({ success: false, failureKind: 'rate-limited', error: 'generic' })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ retried: 1, updatedVehicles: 0 })
    expect(admin.rpc).toHaveBeenCalledTimes(1)
    expect(savePrivateVehicleFipeRefreshState).toHaveBeenCalledWith('vehicle-1', expect.objectContaining({
      fipe_refresh_attempt_count: 1,
      fipe_refresh_attempt_month: '2026-09',
      fipe_next_refresh_at: '2026-09-27T10:00:00.000Z',
    }))
  })

  it('treats a successful vehicle lookup without a valid FIPE snapshot as retryable without listing writes', async () => {
    const { admin } = setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' }],
      privateLookup: [dueLookup('vehicle-1')],
    })
    lookupPlate.mockResolvedValue({ success: true, data: { fipe_price: null, fipe_reference_month: 'setembro/2026' } })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ updatedVehicles: 0, retried: 1 })
    expect(admin.rpc.mock.calls.some(([name]: [string]) => name === 'apply_monthly_fipe_snapshot')).toBe(false)
  })

  it('does not exceed the requested provider batch size', async () => {
    setupDb({
      active: ['vehicle-1', 'vehicle-2', 'vehicle-3'].map(vehicle_id => ({ vehicle_id, fipe_price: null, fipe_reference_month: null })),
      privateLookup: ['vehicle-1', 'vehicle-2', 'vehicle-3'].map(vehicle_id => dueLookup(vehicle_id)),
    })

    const result = await runFipeRefreshBatch({ limit: 1, now })

    expect(result.scanned).toBe(1)
    expect(lookupPlate).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getSupabaseAdminClient).mock.results[0]?.value.rpc).toHaveBeenCalledWith('claim_due_private_vehicle_fipe_refreshes', { p_limit: 1 })
  })

  it('does not count an update when the atomic database write fails', async () => {
    setupDb({ active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' }], privateLookup: [dueLookup('vehicle-1', { fipe_reference_month: 'agosto/2026' })], vehiclesUpdateError: { message: 'db failure' } })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result.updatedVehicles).toBe(0)
    expect(result.retried).toBe(1)
  })

  it('does not update listings when the canonical vehicle snapshot update fails', async () => {
    const { admin } = setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' }],
      privateLookup: [dueLookup('vehicle-1')],
      vehiclesUpdateError: { message: 'db failure' },
    })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ updatedVehicles: 0, retried: 1 })
    expect(admin.rpc.mock.calls.filter(([name]: [string]) => name === 'apply_monthly_fipe_snapshot')).toHaveLength(1)
  })

  it('does not report a stale concurrent snapshot as applied', async () => {
    const { admin } = setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' }],
      privateLookup: [dueLookup('vehicle-1')],
      applySnapshotResult: false,
    })

    const result = await runFipeRefreshBatch({ limit: 10, now })

    expect(result).toMatchObject({ updatedVehicles: 0, retried: 1 })
    expect(admin.rpc.mock.calls.filter(([name]: [string]) => name === 'apply_monthly_fipe_snapshot')).toHaveLength(1)
    expect(savePrivateVehicleFipeRefreshState).toHaveBeenCalledWith('vehicle-1', expect.objectContaining({
      fipe_refresh_attempt_count: 1,
      fipe_next_refresh_at: '2026-09-26T10:00:00.000Z',
    }))
  })

  it('does not call the provider twice when two batches overlap on the same due vehicle', async () => {
    setupDb({
      active: [{ vehicle_id: 'vehicle-1', fipe_price: 90000, fipe_reference_month: 'agosto/2026' }],
      privateLookup: [dueLookup('vehicle-1')],
    })

    const results = await Promise.all([
      runFipeRefreshBatch({ limit: 10, now }),
      runFipeRefreshBatch({ limit: 10, now }),
    ])

    expect(results.reduce((count, result) => count + result.scanned, 0)).toBe(1)
    expect(lookupPlate).toHaveBeenCalledTimes(1)
  })
})
