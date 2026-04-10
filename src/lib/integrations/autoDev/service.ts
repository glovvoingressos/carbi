import {
  decodeVin,
  getVehicleBuildByVin,
  getVehiclePhotosByVin,
  getVehicleRecallsByVin,
  getVehicleSpecsByVin,
  AutoDevError,
} from '@/lib/integrations/autoDev/client'
import { fromVehicleEnrichmentRow, toVehicleEnrichmentUpsertPayload, VehicleEnrichmentRow } from '@/lib/integrations/autoDev/mappers'
import { normalizeVehicleEnrichment } from '@/lib/integrations/autoDev/normalizers'
import { AutoDevRefreshResult, VehicleEnrichment } from '@/lib/integrations/autoDev/types'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

const ENRICHMENT_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface VehicleRow {
  id: string
  owner_user_id: string
  brand: string
  model: string
  version: string | null
  year_model: number
  vin: string | null
}

function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase()
}

export function isVinFormatValid(vin: string): boolean {
  const normalized = normalizeVin(vin)
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)
}

export function isAutoDevConfigured(): boolean {
  return Boolean(process.env.AUTODEV_API_KEY || process.env.AUTO_DEV_API_KEY)
}

function isFresh(fetchedAt: string, ttlMs = ENRICHMENT_TTL_MS): boolean {
  const ts = new Date(fetchedAt).getTime()
  if (!Number.isFinite(ts)) return false
  return Date.now() - ts <= ttlMs
}

function stringSimilarity(a: string, b: string): boolean {
  const left = a.trim().toLowerCase()
  const right = b.trim().toLowerCase()
  return left.includes(right) || right.includes(left)
}

function validateAgainstVehicle(vehicle: VehicleRow, enrichment: VehicleEnrichment): string[] {
  const errors: string[] = []

  const make = enrichment.identity.make
  const model = enrichment.identity.model
  const year = enrichment.identity.year

  if (make && !stringSimilarity(make, vehicle.brand)) {
    errors.push('Marca do VIN não corresponde ao veículo interno.')
  }

  if (model && !stringSimilarity(model, vehicle.model)) {
    errors.push('Modelo do VIN não corresponde ao veículo interno.')
  }

  if (year && Math.abs(year - vehicle.year_model) > 1) {
    errors.push('Ano do VIN está inconsistente com o ano/modelo do veículo.')
  }

  return errors
}

async function safeInsertSyncJob(input: {
  accessToken: string
  vehicleId: string
  jobType: string
  status: 'pending' | 'running' | 'success' | 'failed'
  requestedBy: string
  meta?: Record<string, unknown>
}): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient(input.accessToken)
    const { data } = await supabase
      .from('vehicle_sync_jobs')
      .insert({
        vehicle_id: input.vehicleId,
        provider: 'auto_dev',
        job_type: input.jobType,
        status: input.status,
        requested_by: input.requestedBy,
        started_at: input.status === 'running' ? new Date().toISOString() : null,
        meta: input.meta || {},
      })
      .select('id')
      .maybeSingle()

    return data?.id || null
  } catch {
    return null
  }
}

async function safeFinishSyncJob(input: {
  accessToken: string
  jobId: string | null
  status: 'success' | 'failed'
  errorMessage?: string | null
}): Promise<void> {
  if (!input.jobId) return

  try {
    const supabase = getSupabaseServerClient(input.accessToken)
    await supabase
      .from('vehicle_sync_jobs')
      .update({
        status: input.status,
        finished_at: new Date().toISOString(),
        error_message: input.errorMessage || null,
      })
      .eq('id', input.jobId)
  } catch {
    // no-op
  }
}

export async function getCachedVehicleEnrichment(vehicleId: string): Promise<{
  enrichment: VehicleEnrichment | null
  stale: boolean
  fetchStatus: string | null
}> {
  if (!isSupabaseConfigured()) {
    return { enrichment: null, stale: true, fetchStatus: null }
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('vehicle_enrichments')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('source', 'auto_dev')
    .maybeSingle()

  if (error || !data) {
    return { enrichment: null, stale: true, fetchStatus: null }
  }

  const enrichment = fromVehicleEnrichmentRow(data as VehicleEnrichmentRow)
  return {
    enrichment,
    stale: !isFresh(enrichment.fetchedAt),
    fetchStatus: (data as VehicleEnrichmentRow).fetch_status,
  }
}

async function getVehicleForSync(vehicleId: string, accessToken?: string): Promise<VehicleRow | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabaseServerClient(accessToken)
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, owner_user_id, brand, model, version, year_model, vin')
    .eq('id', vehicleId)
    .maybeSingle()

  if (error || !data) return null
  return data as VehicleRow
}

export async function runAutoDevSync(input: {
  vehicleId: string
  requesterId: string
  accessToken: string
  force?: boolean
  vinOverride?: string | null
}): Promise<AutoDevRefreshResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      status: 'failed',
      enrichment: null,
      errors: ['Supabase não configurado.'],
      fromCache: false,
    }
  }

  if (!isAutoDevConfigured()) {
    return {
      success: false,
      status: 'failed',
      enrichment: null,
      errors: ['Auto.dev não configurada no servidor.'],
      fromCache: false,
    }
  }

  const vehicle = await getVehicleForSync(input.vehicleId, input.accessToken)
  if (!vehicle) {
    return {
      success: false,
      status: 'failed',
      enrichment: null,
      errors: ['Veículo não encontrado.'],
      fromCache: false,
    }
  }

  if (vehicle.owner_user_id !== input.requesterId) {
    return {
      success: false,
      status: 'failed',
      enrichment: null,
      errors: ['Você não tem permissão para sincronizar este veículo.'],
      fromCache: false,
    }
  }

  const cached = await getCachedVehicleEnrichment(input.vehicleId)
  const desiredVin = input.vinOverride ? normalizeVin(input.vinOverride) : (vehicle.vin ? normalizeVin(vehicle.vin) : null)

  if (!desiredVin) {
    return {
      success: false,
      status: 'failed',
      enrichment: cached.enrichment,
      errors: ['VIN não informado. Cadastre um VIN válido para sincronizar.'],
      fromCache: Boolean(cached.enrichment),
    }
  }

  if (!isVinFormatValid(desiredVin)) {
    return {
      success: false,
      status: 'failed',
      enrichment: cached.enrichment,
      errors: ['VIN inválido. Use 17 caracteres alfanuméricos válidos.'],
      fromCache: Boolean(cached.enrichment),
    }
  }

  if (!input.force && cached.enrichment && !cached.stale && cached.enrichment.vin === desiredVin) {
    return {
      success: true,
      status: 'success',
      enrichment: cached.enrichment,
      errors: [],
      fromCache: true,
    }
  }

  const syncJobId = await safeInsertSyncJob({
    accessToken: input.accessToken,
    vehicleId: input.vehicleId,
    jobType: 'sync_full',
    status: 'running',
    requestedBy: input.requesterId,
    meta: { force: Boolean(input.force), vin: desiredVin },
  })

  const results = await Promise.allSettled([
    decodeVin(desiredVin),
    getVehicleSpecsByVin(desiredVin),
    getVehiclePhotosByVin(desiredVin),
    getVehicleBuildByVin(desiredVin),
    getVehicleRecallsByVin(desiredVin),
  ])

  const errors: string[] = []
  const decodeResult = results[0].status === 'fulfilled' ? results[0].value : null
  const specsResult = results[1].status === 'fulfilled' ? results[1].value : null
  const photosResult = results[2].status === 'fulfilled' ? results[2].value : null
  const buildResult = results[3].status === 'fulfilled' ? results[3].value : null
  const recallsResult = results[4].status === 'fulfilled' ? results[4].value : null

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const label = ['decode', 'specs', 'photos', 'build', 'recalls'][index]
      if (result.reason instanceof AutoDevError) {
        errors.push(`${label}: ${result.reason.message}`)
      } else {
        errors.push(`${label}: falha inesperada durante sincronização.`)
      }
    }
  })

  if (!decodeResult && !specsResult && !photosResult && !buildResult && !recallsResult) {
    await safeFinishSyncJob({
      accessToken: input.accessToken,
      jobId: syncJobId,
      status: 'failed',
      errorMessage: errors.join(' | ').slice(0, 500),
    })

    return {
      success: false,
      status: 'failed',
      enrichment: cached.enrichment,
      errors: errors.length > 0 ? errors : ['Falha ao consultar Auto.dev.'],
      fromCache: Boolean(cached.enrichment),
    }
  }

  const sourceVersion =
    decodeResult?.sourceVersion ||
    specsResult?.sourceVersion ||
    photosResult?.sourceVersion ||
    buildResult?.sourceVersion ||
    recallsResult?.sourceVersion ||
    null

  const normalized = normalizeVehicleEnrichment({
    vehicleId: vehicle.id,
    vin: desiredVin,
    payloads: {
      decode: decodeResult?.data || null,
      specs: specsResult?.data || null,
      photos: photosResult?.data || null,
      build: buildResult?.data || null,
      recalls: recallsResult?.data || null,
      sourceVersion,
    },
  })

  const consistencyErrors = validateAgainstVehicle(vehicle, normalized)
  errors.push(...consistencyErrors)

  const status = errors.length === 0 ? 'success' : 'partial'

  const upsertPayload = toVehicleEnrichmentUpsertPayload(
    normalized,
    status,
    errors.length > 0 ? errors.join(' | ').slice(0, 1000) : null,
  )

  const supabase = getSupabaseServerClient(input.accessToken)
  const { error: upsertError } = await supabase
    .from('vehicle_enrichments')
    .upsert(upsertPayload, {
      onConflict: 'vehicle_id,source',
      ignoreDuplicates: false,
    })

  if (input.vinOverride && input.vinOverride !== vehicle.vin) {
    await supabase
      .from('vehicles')
      .update({ vin: desiredVin, trim: normalized.identity.trim || vehicle.version || null })
      .eq('id', vehicle.id)
  }

  if (upsertError) {
    await safeFinishSyncJob({
      accessToken: input.accessToken,
      jobId: syncJobId,
      status: 'failed',
      errorMessage: upsertError.message,
    })

    return {
      success: false,
      status: 'failed',
      enrichment: cached.enrichment,
      errors: [`Falha ao persistir enriquecimento: ${upsertError.message}`],
      fromCache: Boolean(cached.enrichment),
    }
  }

  await safeFinishSyncJob({
    accessToken: input.accessToken,
    jobId: syncJobId,
    status: status === 'partial' ? 'failed' : 'success',
    errorMessage: errors.length > 0 ? errors.join(' | ').slice(0, 500) : null,
  })

  return {
    success: true,
    status,
    enrichment: normalized,
    errors,
    fromCache: false,
  }
}

export async function decodeVinForPreview(vin: string): Promise<{
  success: boolean
  data: VehicleEnrichment['identity'] | null
  error: string | null
}> {
  if (!isAutoDevConfigured()) {
    return { success: false, data: null, error: 'Auto.dev não configurada no servidor.' }
  }

  const normalizedVin = normalizeVin(vin)
  if (!isVinFormatValid(normalizedVin)) {
    return { success: false, data: null, error: 'VIN inválido. Verifique os 17 caracteres.' }
  }

  try {
    const decoded = await decodeVin(normalizedVin)
    const normalized = normalizeVehicleEnrichment({
      vehicleId: 'preview',
      vin: normalizedVin,
      payloads: {
        decode: decoded.data,
        specs: null,
        photos: null,
        build: null,
        recalls: null,
        sourceVersion: decoded.sourceVersion,
      },
    })

    return {
      success: true,
      data: normalized.identity,
      error: null,
    }
  } catch (error) {
    if (error instanceof AutoDevError) {
      return { success: false, data: null, error: error.message }
    }
    return { success: false, data: null, error: 'Falha ao validar VIN na Auto.dev.' }
  }
}
