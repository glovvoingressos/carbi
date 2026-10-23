#!/usr/bin/env node
/**
 * Move as placas completas legadas (que ficaram em vehicle_listings.plate_final)
 * para o cofre privado criptografado.
 *
 * O SQL operacional já copiou essas placas para
 * public.vehicle_plate_migration_staging e mascarou plate_final.
 *
 * Uso:
 *   node --experimental-strip-types scripts/secure-legacy-plates.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { decryptPlate, encryptPlate, hashPlate, normalizePlate } from '../src/lib/plate-crypto.ts'

function loadEnvFile(filename) {
  const fullPath = path.join(process.cwd(), filename)
  if (!fs.existsSync(fullPath)) return
  const content = fs.readFileSync(fullPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    if (!key || process.env[key]) continue
    process.env[key] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const MASTER_KEY = process.env.PLATE_ENCRYPTION_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
if (!MASTER_KEY) {
  console.error('Defina PLATE_ENCRYPTION_KEY (32 bytes em base64).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: rows, error } = await supabase
  .from('vehicle_plate_migration_staging')
  .select('listing_id, vehicle_id, user_id, plate')
  .order('listing_id')

if (error) {
  if (error.message.includes('does not exist') || error.message.includes('Could not find the table')) {
    console.log('Tabela de staging não existe. Nada a migrar.')
    process.exit(0)
  }
  console.error('Falha ao ler o staging:', error.message)
  process.exit(1)
}

console.log(`Placas legadas no staging: ${rows?.length || 0}`)

let migrated = 0
const migratedIds = []
for (const row of rows || []) {
  const plate = normalizePlate(row.plate)
  if (!plate || !row.vehicle_id || !row.user_id) {
    console.warn(`- ignorado (dados incompletos): ${row.listing_id}`)
    continue
  }

  const plateEncrypted = encryptPlate(plate, MASTER_KEY)
  const plateHash = hashPlate(plate, MASTER_KEY)
  if (!plateEncrypted || !plateHash || decryptPlate(plateEncrypted, MASTER_KEY) !== plate) {
    console.error(`- falha ao cifrar/validar: ${row.listing_id}`)
    process.exitCode = 1
    continue
  }

  const { error: upsertError } = await supabase
    .from('vehicle_private_identifiers')
    .upsert({
      vehicle_id: row.vehicle_id,
      listing_id: row.listing_id,
      user_id: row.user_id,
      plate_hash: plateHash,
      plate_encrypted: plateEncrypted,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'vehicle_id' })

  if (upsertError) {
    console.error(`- falha ao gravar ${row.listing_id}:`, upsertError.message)
    process.exitCode = 1
    continue
  }

  migrated += 1
  migratedIds.push(row.listing_id)
  console.log(`- ok ${row.listing_id} (final ${plate.slice(-1)})`)
}

if (migratedIds.length > 0) {
  const { error: deleteError } = await supabase
    .from('vehicle_plate_migration_staging')
    .delete()
    .in('listing_id', migratedIds)
  if (deleteError) {
    console.error('Falha ao limpar o staging:', deleteError.message)
    process.exitCode = 1
  }
}

console.log(`Migradas para o cofre privado: ${migrated}/${rows?.length || 0}`)
if (migrated === (rows?.length || 0)) {
  console.log('Staging vazio. Pode remover a tabela public.vehicle_plate_migration_staging.')
}
