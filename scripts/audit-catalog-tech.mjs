#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

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
    const rawValue = trimmed.slice(idx + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
const LIMIT = Math.max(1, Number(process.env.LIMIT || 50))

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().toLowerCase() !== 'não informado'
}

function hasNum(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}

async function run() {
  const { data, error } = await supabase
    .from('external_car_catalog')
    .select('brand_name, model_name, version_name, year_model, engine, horsepower, torque, transmission, fuel_economy_city, fuel_economy_road, price_brl, fipe_code, imported_at')
    .eq('status', 'active')
    .order('brand_name', { ascending: true })
    .order('model_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = Array.isArray(data) ? data : []
  const missing = rows.filter((row) => {
    return !hasText(row.engine)
      || !hasNum(row.horsepower)
      || !hasNum(row.torque)
      || !hasText(row.transmission)
      || (!hasNum(row.fuel_economy_city) && !hasNum(row.fuel_economy_road))
  })

  console.log(`external_car_catalog rows: ${rows.length}`)
  console.log(`rows with missing technical core: ${missing.length}`)

  if (missing.length > 0) {
    console.log(`\nTop ${Math.min(LIMIT, missing.length)} missing rows:`)
    for (const row of missing.slice(0, LIMIT)) {
      console.log(
        `- ${row.brand_name} ${row.model_name} ${row.version_name} ${row.year_model} | engine=${row.engine || '-'} hp=${row.horsepower || '-'} torque=${row.torque || '-'} trans=${row.transmission || '-'} eco_city=${row.fuel_economy_city || '-'} eco_road=${row.fuel_economy_road || '-'}`
      )
    }
  }
}

run().catch((error) => {
  console.error('[audit-catalog-tech] fatal', error)
  process.exit(1)
})
