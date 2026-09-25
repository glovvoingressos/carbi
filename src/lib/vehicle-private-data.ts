import { getSupabaseAdminClient } from '@/lib/supabase-server'

export type PrivateVehicleLookupInput = {
  plate: string
  brand: string
  model: string
  version?: string | null
  year_model: number
  fipe_model_name?: string | null
  fipe_code?: string | null
}

export type PrivateVehicleLookup = PrivateVehicleLookupInput & {
  fipe_history?: { month: string; price: string; priceNum: number }[] | null
  fipe_last_refresh_attempt_at: string | null
  fipe_next_refresh_at: string
  fipe_refresh_attempt_count: number
  fipe_refresh_attempt_month: string | null
}

export type PrivateVehicleFipeRefreshState = Pick<
  PrivateVehicleLookup,
  'fipe_last_refresh_attempt_at' | 'fipe_next_refresh_at' | 'fipe_refresh_attempt_count' | 'fipe_refresh_attempt_month'
>

export async function savePrivateVehicleLookup(
  vehicleId: string,
  ownerUserId: string,
  lookup: PrivateVehicleLookupInput,
): Promise<void> {
  const plate = lookup.plate.replace(/[^a-z0-9]/gi, '').toUpperCase()
  if (!/^[A-Z0-9]{7}$/.test(plate)) throw new Error('A placa consultada é inválida.')

  const admin = getSupabaseAdminClient()
  if (!admin) throw new Error('Armazenamento privado do veículo não configurado.')

  const { error } = await admin.from('vehicle_private_identifiers').upsert({
    vehicle_id: vehicleId,
    owner_user_id: ownerUserId,
    plate,
    brand: lookup.brand.trim(),
    model: lookup.model.trim(),
    version: lookup.version?.trim() || null,
    year_model: lookup.year_model,
    fipe_model_name: lookup.fipe_model_name?.trim() || null,
    fipe_code: lookup.fipe_code?.trim() || null,
  }, { onConflict: 'vehicle_id' })

  if (error) throw new Error(error.message || 'Falha ao salvar dados privados do veículo.')
}

export async function getPrivateVehicleLookup(vehicleId: string): Promise<PrivateVehicleLookup | null> {
  const admin = getSupabaseAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('vehicle_private_identifiers')
    .select('plate, brand, model, version, year_model, fipe_model_name, fipe_code, fipe_history, fipe_last_refresh_attempt_at, fipe_next_refresh_at, fipe_refresh_attempt_count, fipe_refresh_attempt_month')
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Falha ao consultar dados privados do veículo.')
  return data as PrivateVehicleLookup | null
}

export async function savePrivateVehicleFipeRefreshState(
  vehicleId: string,
  state: PrivateVehicleFipeRefreshState,
): Promise<void> {
  const admin = getSupabaseAdminClient()
  if (!admin) throw new Error('Armazenamento privado do veículo não configurado.')

  const { data, error } = await admin.from('vehicle_private_identifiers').update({
    fipe_last_refresh_attempt_at: state.fipe_last_refresh_attempt_at,
    fipe_next_refresh_at: state.fipe_next_refresh_at,
    fipe_refresh_attempt_count: state.fipe_refresh_attempt_count,
    fipe_refresh_attempt_month: state.fipe_refresh_attempt_month,
  }).eq('vehicle_id', vehicleId).select('vehicle_id').maybeSingle()

  if (error) throw new Error(error.message || 'Falha ao salvar agendamento FIPE do veículo.')
  if (!data) throw new Error('Falha ao salvar agendamento FIPE do veículo.')
}

export async function savePrivateVehicleFipeHistory(
  vehicleId: string,
  history: NonNullable<PrivateVehicleLookup['fipe_history']>,
): Promise<void> {
  if (history.length === 0) return
  const admin = getSupabaseAdminClient()
  if (!admin) return

  await admin.from('vehicle_private_identifiers').update({ fipe_history: history }).eq('vehicle_id', vehicleId)
}

export async function savePrivateVehicleFipeIdentity(
  vehicleId: string,
  identity: { brand?: string; model?: string; year_model?: number; fipe_model_name?: string | null; fipe_code?: string | null },
): Promise<void> {
  const admin = getSupabaseAdminClient()
  if (!admin) return
  await admin.from('vehicle_private_identifiers').update({
    ...(identity.brand ? { brand: identity.brand } : {}),
    ...(identity.model ? { model: identity.model } : {}),
    ...(identity.year_model ? { year_model: identity.year_model } : {}),
    ...(identity.fipe_model_name ? { fipe_model_name: identity.fipe_model_name } : {}),
    ...(identity.fipe_code ? { fipe_code: identity.fipe_code } : {}),
  }).eq('vehicle_id', vehicleId)
}
