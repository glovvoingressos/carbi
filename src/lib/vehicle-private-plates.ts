import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { decryptPlate, encryptPlate, hashPlate, normalizePlate } from '@/lib/plate-crypto'

/**
 * Cofre privado da placa completa.
 *
 * A tabela `vehicle_private_identifiers` não tem policies para anon/authenticated
 * e só é acessível pelo service_role. A placa é gravada cifrada (AES-256-GCM) e
 * com um hash HMAC para busca/deduplicação. Nada aqui deve ser exposto ao cliente.
 */

let cachedVaultKey: string | null = null

/**
 * A chave canônica fica no Supabase Vault (acessível só por service_role).
 * PLATE_ENCRYPTION_KEY serve de fallback para ambientes locais/CI.
 */
async function getMasterKey(): Promise<string | null> {
  if (cachedVaultKey) return cachedVaultKey

  const admin = getSupabaseAdminClient()
  if (admin) {
    const { data, error } = await admin.rpc('get_plate_encryption_key')
    if (!error && typeof data === 'string' && data.trim()) {
      cachedVaultKey = data.trim()
      return cachedVaultKey
    }
  }

  const envKey = process.env.PLATE_ENCRYPTION_KEY
  return envKey && envKey.trim() ? envKey.trim() : null
}

export async function savePrivateVehiclePlate(input: {
  vehicleId: string
  listingId?: string | null
  userId: string
  plate: string | null | undefined
}): Promise<boolean> {
  const plate = normalizePlate(input.plate)
  if (!plate) return false

  const masterKey = await getMasterKey()
  if (!masterKey) {
    console.warn('[private-plates] chave do cofre não configurada; placa não foi armazenada.')
    return false
  }

  const plateEncrypted = encryptPlate(plate, masterKey)
  const plateHash = hashPlate(plate, masterKey)
  if (!plateEncrypted || !plateHash) {
    console.warn('[private-plates] não foi possível cifrar a placa; nada foi armazenado.')
    return false
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    console.warn('[private-plates] service role não configurada; placa não foi armazenada.')
    return false
  }

  const { error } = await admin
    .from('vehicle_private_identifiers')
    .upsert({
      vehicle_id: input.vehicleId,
      listing_id: input.listingId || null,
      user_id: input.userId,
      plate_hash: plateHash,
      plate_encrypted: plateEncrypted,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'vehicle_id' })

  if (error) {
    console.error('[private-plates] falha ao armazenar placa:', error.message)
    return false
  }

  return true
}

/** Uso interno (admin/serviços): recupera a placa completa para uma futura função. */
export async function getPrivateVehiclePlate(vehicleId: string): Promise<string | null> {
  const masterKey = await getMasterKey()
  if (!masterKey) return null

  const admin = getSupabaseAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('vehicle_private_identifiers')
    .select('plate_encrypted')
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (error || !data?.plate_encrypted) return null
  return decryptPlate(data.plate_encrypted, masterKey)
}
