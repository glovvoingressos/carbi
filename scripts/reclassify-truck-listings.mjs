#!/usr/bin/env node
/**
 * Reclassifica anúncios que foram publicados pelo formulário de carro mas são
 * caminhões (`vehicle_type = 'car'` na base). Sem isso eles continuam ativos,
 * porém invisíveis em /caminhoes.
 *
 * Uso:
 *   node --experimental-strip-types scripts/reclassify-truck-listings.mjs          # simulação
 *   node --experimental-strip-types scripts/reclassify-truck-listings.mjs --apply  # grava
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { isTruckListing } from '../src/lib/truck-classification.ts'

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
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const apply = process.argv.includes('--apply')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase
  .from('vehicle_listings')
  .select('id, title, brand, model, body_type, vehicle_type, truck_type, truck_body_type, axles, load_capacity, status')
  .neq('vehicle_type', 'truck')
  .order('created_at', { ascending: false })
  .range(0, 999)

if (error) {
  console.error('Falha ao consultar anúncios:', error.message)
  process.exit(1)
}

const candidates = (data || []).filter((listing) => isTruckListing(listing))

if (candidates.length === 0) {
  console.log('Nenhum anúncio de caminhão fora do tipo truck. Nada a fazer.')
  process.exit(0)
}

console.log(`${candidates.length} anúncio(s) de caminhão encontrados fora de vehicle_type = 'truck':`)
for (const listing of candidates) {
  console.log(`- ${listing.status} | ${listing.brand} ${listing.model} | ${listing.title} (${listing.id})`)
}

if (!apply) {
  console.log('\nSimulação apenas. Rode com --apply para gravar.')
  process.exit(0)
}

let updated = 0
for (const listing of candidates) {
  const { error: updateError } = await supabase
    .from('vehicle_listings')
    .update({ vehicle_type: 'truck', body_type: 'Caminhão' })
    .eq('id', listing.id)

  if (updateError) {
    console.error(`Falha ao atualizar ${listing.id}:`, updateError.message)
    continue
  }
  updated += 1
}

console.log(`\n${updated} anúncio(s) reclassificado(s) como caminhão.`)
