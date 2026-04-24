#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

const DATASET = process.env.HF_FIPEX_DATASET || 'alanwgt/fipex-veiculos-brasil'
const CONFIG = process.env.HF_FIPEX_CONFIG || 'default'
const SPLIT = process.env.HF_FIPEX_SPLIT || 'train'
const HF_DATASETS_SERVER = process.env.HF_DATASETS_SERVER || 'https://datasets-server.huggingface.co'
const USE_FILTER = process.env.USE_FILTER !== '0'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const OFFSET = Math.max(0, Number(process.env.OFFSET || 0))
const LIMIT_ROWS = Math.max(0, Number(process.env.LIMIT_ROWS || 0))
const PAGE_SIZE = Math.min(100, Math.max(1, Number(process.env.PAGE_SIZE || 100)))
const MIN_YEAR = Number(process.env.MIN_YEAR || 2019)
const VEHICLE_TYPES = (process.env.VEHICLE_TYPES || 'carro')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)
const BRANDS = (process.env.BRANDS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)

const REQUEST_TIMEOUT_MS = Math.max(4000, Number(process.env.REQUEST_TIMEOUT_MS || 60000))
const REQUEST_RETRIES = Math.max(0, Number(process.env.REQUEST_RETRIES || 2))
const REQUEST_DELAY_MS = Math.max(0, Number(process.env.REQUEST_DELAY_MS || 220))
const RATE_LIMIT_BACKOFF_MS = Math.max(500, Number(process.env.RATE_LIMIT_BACKOFF_MS || 1500))
const DRY_RUN = process.env.DRY_RUN === '1'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON key).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

let lastRequestAt = 0

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseReferenceMonth(month, year) {
  const m = Number(month)
  const y = Number(year)
  if (!Number.isFinite(m) || !Number.isFinite(y)) return null
  return `${String(m).padStart(2, '0')}/${y}`
}

async function throttle() {
  if (REQUEST_DELAY_MS <= 0) return
  const now = Date.now()
  const elapsed = now - lastRequestAt
  const waitMs = REQUEST_DELAY_MS - elapsed
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs))
  lastRequestAt = Date.now()
}

async function hfRows(offset, length) {
  const query = new URLSearchParams({
    dataset: DATASET,
    config: CONFIG,
    split: SPLIT,
    offset: String(offset),
    length: String(length),
  })

  if (USE_FILTER) {
    const whereParts = []
    if (VEHICLE_TYPES.length > 0) {
      const typeExpr = VEHICLE_TYPES
        .map((type) => `"tipo_veiculo" = '${type.replace(/'/g, "''")}'`)
        .join(' OR ')
      whereParts.push(`(${typeExpr})`)
    }
    if (Number.isFinite(MIN_YEAR) && MIN_YEAR > 0) {
      whereParts.push(`"ano_modelo" >= ${MIN_YEAR}`)
    }
    if (BRANDS.length > 0) {
      const brandExpr = BRANDS
        .map((brand) => `"nome_marca" = '${brand.replace(/'/g, "''")}'`)
        .join(' OR ')
      whereParts.push(`(${brandExpr})`)
    }
    if (whereParts.length > 0) {
      query.set('where', whereParts.join(' AND '))
    }
  }

  const endpoint = USE_FILTER ? 'filter' : 'rows'
  const url = `${HF_DATASETS_SERVER}/${endpoint}?${query.toString()}`

  let lastError = null
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    await throttle()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`HF_429:${offset}`)
        }
        throw new Error(`HF ${response.status} on rows offset=${offset}`)
      }
      const data = await response.json()
      if (data?.error) {
        const msg = String(data.error)
        if (msg.toLowerCase().includes('index is loading')) {
          throw new Error(`HF_INDEX_LOADING:${offset}`)
        }
        throw new Error(`HF_DATASET_ERROR:${msg}`)
      }
      clearTimeout(timeout)
      return data
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < REQUEST_RETRIES) {
        const msg = error instanceof Error ? error.message : String(error)
        const backoff = msg.startsWith('HF_429:')
          ? RATE_LIMIT_BACKOFF_MS * Math.pow(2, attempt + 1)
          : msg.startsWith('HF_INDEX_LOADING:')
            ? 4000 * (attempt + 1)
            : 350 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed rows offset=${offset}`)
}

function toExternalPayload(entry) {
  const row = entry?.row || {}
  const yearModel = Number(row.ano_modelo)
  const valueCents = Number(row.valor_centavos)
  const priceBrl = Number.isFinite(valueCents) ? valueCents / 100 : null
  const vehicleType = String(row.tipo_veiculo || '').trim()
  const brandName = String(row.nome_marca || '').trim()
  const modelName = String(row.nome_modelo || '').trim()
  const fuelName = String(row.nome_combustivel || '').trim()
  const fipeCode = String(row.codigo_fipe || '').trim()

  if (!vehicleType || !brandName || !modelName || !fipeCode || !Number.isFinite(yearModel) || yearModel <= 0) {
    return null
  }

  return {
    vehicle_type: vehicleType,
    source: 'hf_fipex',
    brand_name: brandName,
    brand_code: null,
    model_name: modelName,
    model_code: null,
    version_name: modelName,
    year_label: String(yearModel),
    year_model: yearModel,
    fuel_type: fuelName || null,
    fipe_code: fipeCode,
    reference_month: parseReferenceMonth(row.mes_referencia, row.ano_referencia),
    price_brl: Number.isFinite(priceBrl) ? priceBrl : null,
    status: 'active',
    metadata: {
      provider: 'huggingface',
      dataset: DATASET,
      config: CONFIG,
      split: SPLIT,
      row_idx: entry?.row_idx ?? null,
      sigla_combustivel: row.sigla_combustivel ?? null,
      zero_km: row.zero_km ?? null,
      valor_formatado: row.valor_formatado ?? null,
      mes_referencia: row.mes_referencia ?? null,
      ano_referencia: row.ano_referencia ?? null,
    },
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function allowRow(payload) {
  if (!payload) return false
  const typeNorm = normalizeText(payload.vehicle_type)
  const brandNorm = normalizeText(payload.brand_name)
  const isYearOk = Number(payload.year_model) >= MIN_YEAR
  const typeOk = VEHICLE_TYPES.length === 0 || VEHICLE_TYPES.some((t) => typeNorm.includes(t))
  const brandOk = BRANDS.length === 0 || BRANDS.some((b) => brandNorm.includes(b))
  return isYearOk && typeOk && brandOk
}

async function run() {
  console.log('[sync-hf-fipex] starting...')
  console.log(`[sync-hf-fipex] dataset=${DATASET} config=${CONFIG} split=${SPLIT} dryRun=${DRY_RUN}`)

  let offset = OFFSET
  let processed = 0
  let eligible = 0
  let upserted = 0
  let errors = 0
  let done = false

  while (!done) {
    if (LIMIT_ROWS > 0 && processed >= LIMIT_ROWS) break
    const pageLength = LIMIT_ROWS > 0 ? Math.min(PAGE_SIZE, LIMIT_ROWS - processed) : PAGE_SIZE
    if (pageLength <= 0) break

    const page = await hfRows(offset, pageLength)
    const rows = Array.isArray(page?.rows) ? page.rows : []
    if (rows.length === 0) break

    for (const entry of rows) {
      processed += 1
      const payload = toExternalPayload(entry)
      if (!allowRow(payload)) continue
      eligible += 1

      if (DRY_RUN) continue

      const { error } = await supabase.rpc('upsert_external_car_catalog_entry', { payload })
      if (error) {
        errors += 1
        console.error('[sync-hf-fipex] upsert error', payload.brand_name, payload.model_name, payload.year_model, error.message)
        continue
      }
      upserted += 1
    }

    offset += rows.length
    if (rows.length < pageLength) done = true
  }

  console.log(`[sync-hf-fipex] done processed=${processed} eligible=${eligible} upserted=${upserted} errors=${errors}`)
}

run().catch((error) => {
  console.error('[sync-hf-fipex] fatal', error)
  process.exit(1)
})
