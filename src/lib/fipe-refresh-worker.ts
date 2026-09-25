import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { lookupPlate } from '@/lib/integrations/placaapi/service'
import { compareFipeReferences, getFipeRetryAt, parseFipeReferenceMonth } from '@/lib/fipe-refresh'
import { savePrivateVehicleFipeRefreshState, type PrivateVehicleFipeRefreshState, type PrivateVehicleLookup } from '@/lib/vehicle-private-data'

type DuePrivateVehicle = Pick<PrivateVehicleLookup,
  'plate' | 'fipe_last_refresh_attempt_at' | 'fipe_next_refresh_at' | 'fipe_refresh_attempt_count' | 'fipe_refresh_attempt_month'
> & { vehicle_id: string }
type VehicleSnapshot = { id: string; fipe_price: number | string | null; fipe_reference_month: string | null }
type RefreshResult = { scanned: number; updatedVehicles: number; unchanged: number; skipped: number; retried: number; failed: number }

function emptyResult(): RefreshResult {
  return { scanned: 0, updatedVehicles: 0, unchanged: 0, skipped: 0, retried: 0, failed: 0 }
}

function getNextMonthAt(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 10)).toISOString()
}

function getSafeAttemptCount(lookup: Pick<PrivateVehicleLookup, 'fipe_refresh_attempt_count' | 'fipe_refresh_attempt_month'>, monthKey: string): number {
  return lookup.fipe_refresh_attempt_month === monthKey
    ? Math.max(0, Math.min(5, Math.floor(lookup.fipe_refresh_attempt_count || 0)))
    : 0
}

async function saveAttempt(
  vehicleId: string,
  lookup: Pick<PrivateVehicleLookup, 'fipe_last_refresh_attempt_at' | 'fipe_refresh_attempt_count' | 'fipe_refresh_attempt_month'>,
  now: Date,
  failureKind: 'not-updated' | 'provider-error' | 'rate-limited',
): Promise<void> {
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const attempts = Math.min(5, getSafeAttemptCount(lookup, monthKey) + 1)
  const state: PrivateVehicleFipeRefreshState = {
    fipe_last_refresh_attempt_at: now.toISOString(),
    fipe_next_refresh_at: getFipeRetryAt(now, attempts, failureKind).toISOString(),
    fipe_refresh_attempt_count: attempts,
    fipe_refresh_attempt_month: monthKey,
  }
  await savePrivateVehicleFipeRefreshState(vehicleId, state)
}

async function saveUnchangedReference(
  vehicleId: string,
  lookup: Pick<PrivateVehicleLookup, 'fipe_refresh_attempt_month'>,
  now: Date,
): Promise<void> {
  const nextMonth = new Date(getNextMonthAt(now))
  const nextWeeklyCheck = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  await savePrivateVehicleFipeRefreshState(vehicleId, {
    fipe_last_refresh_attempt_at: now.toISOString(),
    fipe_next_refresh_at: (nextWeeklyCheck < nextMonth ? nextWeeklyCheck : nextMonth).toISOString(),
    fipe_refresh_attempt_count: 0,
    fipe_refresh_attempt_month: lookup.fipe_refresh_attempt_month
      ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
  })
}

function storedPrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const price = Number(value)
  return Number.isFinite(price) ? price : null
}

function positivePrice(value: number | string | null | undefined): number | null {
  const price = storedPrice(value)
  return price !== null && price > 0 ? price : null
}

async function applySnapshot(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  vehicleId: string,
  current: VehicleSnapshot,
  price: number,
  reference: string,
  allowSameReference: boolean,
): Promise<boolean> {
  const { data, error } = await admin.rpc('apply_monthly_fipe_snapshot', {
    p_vehicle_id: vehicleId,
    p_expected_vehicle_price: storedPrice(current.fipe_price),
    p_expected_vehicle_reference: current.fipe_reference_month,
    p_fipe_price: price,
    p_fipe_reference_month: reference,
    p_allow_same_reference: allowSameReference,
  })
  return !error && data === true
}

export async function runFipeRefreshBatch({
  limit,
  now = new Date(),
}: {
  limit: number
  now?: Date
}): Promise<RefreshResult> {
  const result = emptyResult()
  const admin = getSupabaseAdminClient()
  if (!admin || !Number.isInteger(limit) || limit < 1) {
    result.failed = 1
    return result
  }
  limit = Math.min(limit, 100)

  try {
    // The database claims due private identifiers through an EXISTS on active
    // listings. SKIP LOCKED prevents overlapping jobs from spending API quota twice.
    const privateResponse = await admin.rpc('claim_due_private_vehicle_fipe_refreshes', { p_limit: limit })
    if (privateResponse.error || !Array.isArray(privateResponse.data)) {
      result.failed = 1
      return result
    }
    const dueLookups = (privateResponse.data as DuePrivateVehicle[]).slice(0, limit)
    if (!dueLookups.length) return result

    const vehicleIds = [...new Set(dueLookups.map(({ vehicle_id }) => vehicle_id))]
    const vehicleResponse = await admin.from('vehicles')
      .select('id, fipe_price, fipe_reference_month')
      .in('id', vehicleIds)
      .limit(100)
    if (vehicleResponse.error || !Array.isArray(vehicleResponse.data)) {
      result.failed = 1
      return result
    }

    const vehicleSnapshots = vehicleResponse.data as VehicleSnapshot[]
    const vehicleSnapshotById = new Map(vehicleSnapshots.map(snapshot => [snapshot.id, snapshot]))
    result.scanned = dueLookups.length

    for (const lookup of dueLookups) {
      const vehicleId = lookup.vehicle_id
      if (!lookup.plate) {
        result.skipped += 1
        continue
      }

      try {
        const vehicleSnapshot = vehicleSnapshotById.get(vehicleId)
        const lookupResult = await lookupPlate(lookup.plate)
        const fipePrice = lookupResult.success ? lookupResult.data.fipe_price : null
        const nextReference = lookupResult.success ? lookupResult.data.fipe_reference_month : null
        const parsedReference = parseFipeReferenceMonth(nextReference)
        const hasValidSnapshot = typeof fipePrice === 'number' && Number.isFinite(fipePrice) && fipePrice > 0 && parsedReference
        const currentReference = vehicleSnapshot?.fipe_reference_month
        const currentPrice = positivePrice(vehicleSnapshot?.fipe_price)
        const comparison = compareFipeReferences(nextReference, currentReference)
        const shouldUpdate = Boolean(hasValidSnapshot
          && (comparison === 'newer' || (!currentPrice && comparison === 'unknown')))

        if (!shouldUpdate) {
          if (lookupResult.success && hasValidSnapshot) {
            try {
              // Repair listings left behind by an older interrupted two-step write,
              // provided the canonical vehicle still matches the observed value.
              if (vehicleSnapshot && currentPrice && currentReference && parseFipeReferenceMonth(currentReference)) {
                const reconciled = await applySnapshot(admin, vehicleId, vehicleSnapshot, currentPrice, currentReference, true)
                if (!reconciled) {
                  await saveAttempt(vehicleId, lookup, now, 'not-updated')
                  result.retried += 1
                  continue
                }
              }
              await saveUnchangedReference(vehicleId, lookup, now)
              result.unchanged += 1
            } catch {
              result.failed += 1
            }
            continue
          }

          const failureKind = !lookupResult.success && lookupResult.failureKind === 'rate-limited'
            ? 'rate-limited'
            : !lookupResult.success && (lookupResult.failureKind === 'provider-error' || lookupResult.failureKind === 'network-error')
              ? 'provider-error'
              : 'not-updated'
          try {
            await saveAttempt(vehicleId, lookup, now, failureKind)
            result.retried += 1
          } catch {
            result.failed += 1
          }
          continue
        }

        if (!vehicleSnapshot || typeof fipePrice !== 'number' || typeof nextReference !== 'string' || !parsedReference) {
          await saveAttempt(vehicleId, lookup, now, 'not-updated')
          result.retried += 1
          continue
        }

        const applied = await applySnapshot(admin, vehicleId, vehicleSnapshot, fipePrice, nextReference, false)
        if (!applied) {
          await saveAttempt(vehicleId, lookup, now, 'not-updated')
          result.retried += 1
          continue
        }

        try {
          await savePrivateVehicleFipeRefreshState(vehicleId, {
            fipe_last_refresh_attempt_at: now.toISOString(),
            fipe_next_refresh_at: getNextMonthAt(now),
            fipe_refresh_attempt_count: 0,
            fipe_refresh_attempt_month: parsedReference.key,
          })
        } catch {
          result.failed += 1
          continue
        }
        result.updatedVehicles += 1
      } catch {
        result.failed += 1
      }
    }
  } catch {
    result.failed += 1
  }

  return result
}
