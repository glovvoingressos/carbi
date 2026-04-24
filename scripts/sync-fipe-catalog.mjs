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

const BASE_URL = process.env.FIPE_BASE_URL || 'https://fipe.parallelum.com.br/api/v2'
const FIPE_TOKEN = process.env.FIPE_API_TOKEN || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const BRAND_FILTER = (process.env.BRANDS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)
const LIMIT_BRANDS = Number(process.env.LIMIT_BRANDS || 0)
const LIMIT_MODELS_PER_BRAND = Number(process.env.LIMIT_MODELS_PER_BRAND || 0)
const LIMIT_YEARS_PER_MODEL = Number(process.env.LIMIT_YEARS_PER_MODEL || 0)
const MIN_YEAR = Number(process.env.MIN_YEAR || new Date().getFullYear() - 8)
const DRY_RUN = process.env.DRY_RUN === '1'
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 5))
const REQUEST_TIMEOUT_MS = Math.max(5000, Number(process.env.REQUEST_TIMEOUT_MS || 20000))
const REQUEST_RETRIES = Math.max(0, Number(process.env.REQUEST_RETRIES || 2))
const RATE_LIMIT_BACKOFF_MS = Math.max(500, Number(process.env.RATE_LIMIT_BACKOFF_MS || 1500))
const REQUEST_DELAY_MS = Math.max(0, Number(process.env.REQUEST_DELAY_MS || 220))
const REQUEST_JITTER_MS = Math.max(0, Number(process.env.REQUEST_JITTER_MS || 120))

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON key) are required.')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[sync-fipe-catalog] SUPABASE_SERVICE_ROLE_KEY not found. Falling back to anon key; writes may fail by RLS.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

let lastRequestAt = 0

async function throttleRequest() {
  if (REQUEST_DELAY_MS <= 0) return
  const now = Date.now()
  const elapsed = now - lastRequestAt
  const jitter = REQUEST_JITTER_MS > 0 ? Math.floor(Math.random() * REQUEST_JITTER_MS) : 0
  const waitMs = REQUEST_DELAY_MS + jitter - elapsed
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  lastRequestAt = Date.now()
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePriceBrl(price) {
  const only = String(price || '')
    .replace(/[^\d,]/g, '')
    .replace('.', '')
    .replace(',', '.')
  const n = Number(only)
  return Number.isFinite(n) ? n : null
}

function parseYearCode(code) {
  const [yearPart, fuelCodePart] = String(code || '').split('-')
  const year = Number(yearPart)
  return {
    year: Number.isFinite(year) ? year : null,
    fuelCode: fuelCodePart || null,
  }
}

function extractVersionName(detailModel, modelName, fallbackFuel) {
  const full = String(detailModel || '').trim()
  const base = String(modelName || '').trim()
  if (!full) return fallbackFuel || 'Não informado'

  const normalizedFull = normalizeText(full)
  const normalizedBase = normalizeText(base)

  if (normalizedFull === normalizedBase) {
    return fallbackFuel || 'Não informado'
  }

  if (normalizedFull.startsWith(`${normalizedBase} `)) {
    const suffix = full.slice(base.length).trim()
    return suffix || fallbackFuel || 'Não informado'
  }

  return full || fallbackFuel || 'Não informado'
}

async function fipeGet(path) {
  const url = `${BASE_URL}${path}`
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
  }
  if (FIPE_TOKEN) headers['X-Subscription-Token'] = FIPE_TOKEN

  let lastError = null
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    await throttleRequest()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, { headers, signal: controller.signal })
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`FIPE_429:${path}`)
        }
        throw new Error(`FIPE ${response.status} on ${path}`)
      }
      const data = await response.json()
      clearTimeout(timeout)
      return data
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < REQUEST_RETRIES) {
        const message = error instanceof Error ? error.message : String(error)
        const backoff = message.startsWith('FIPE_429:')
          ? RATE_LIMIT_BACKOFF_MS * Math.pow(2, attempt + 1)
          : 350 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`FIPE request failed on ${path}`)
}

async function poolMap(items, limit, fn) {
  const out = []
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index
      index += 1
      out[current] = await fn(items[current], current)
    }
  })
  await Promise.all(workers)
  return out
}

async function run() {
  console.log('[sync-fipe-catalog] starting...')
  console.log(`[sync-fipe-catalog] dryRun=${DRY_RUN} concurrency=${CONCURRENCY}`)

  const brandsRaw = await fipeGet('/cars/brands')
  let brands = Array.isArray(brandsRaw) ? brandsRaw : []

  if (BRAND_FILTER.length > 0) {
    brands = brands.filter((b) => BRAND_FILTER.some((target) => normalizeText(b.name).includes(target)))
  }
  if (LIMIT_BRANDS > 0) {
    brands = brands.slice(0, LIMIT_BRANDS)
  }

  let upserted = 0
  let checked = 0
  let errors = 0

  for (const brand of brands) {
    let modelsRaw = []
    try {
      modelsRaw = await fipeGet(`/cars/brands/${brand.code}/models`)
    } catch (error) {
      errors += 1
      console.error('[sync-fipe-catalog] brand fetch error', brand.name, error instanceof Error ? error.message : String(error))
      continue
    }
    let models = Array.isArray(modelsRaw) ? modelsRaw : []
    models = [...models].sort((a, b) => Number(b.code || 0) - Number(a.code || 0))
    if (LIMIT_MODELS_PER_BRAND > 0) {
      models = models.slice(0, LIMIT_MODELS_PER_BRAND)
    }

    console.log(`[sync-fipe-catalog] brand=${brand.name} models=${models.length}`)

    await poolMap(models, CONCURRENCY, async (model) => {
      try {
        const yearsRaw = await fipeGet(`/cars/brands/${brand.code}/models/${model.code}/years`)
        let years = Array.isArray(yearsRaw) ? yearsRaw : []
        years = years
          .map((item) => {
            const parsed = parseYearCode(item.code)
            return { ...item, parsedYear: parsed.year || 0 }
          })
          .filter((item) => item.parsedYear >= MIN_YEAR)
          .sort((a, b) => b.parsedYear - a.parsedYear)
        if (LIMIT_YEARS_PER_MODEL > 0) {
          years = years.slice(0, LIMIT_YEARS_PER_MODEL)
        }

        for (const yearItem of years) {
          const detail = await fipeGet(`/cars/brands/${brand.code}/models/${model.code}/years/${yearItem.code}`)
          checked += 1

          const parsed = parseYearCode(yearItem.code)
          const resolvedModelName = String(detail?.model || model?.name || '').trim()
          const versionName = extractVersionName(resolvedModelName, model?.name || '', detail?.fuel)
          const payload = {
            vehicle_type: 'car',
            source: 'fipe',
            brand_name: brand.name,
            brand_code: String(brand.code),
            model_name: resolvedModelName || model.name,
            model_code: String(model.code),
            version_name: (versionName && versionName !== detail?.fuel ? versionName : resolvedModelName) || versionName,
            year_label: yearItem.name || null,
            year_model: parsed.year,
            fuel_type: detail?.fuel || null,
            fipe_code: detail?.codeFipe || null,
            reference_month: detail?.referenceMonth || null,
            price_brl: parsePriceBrl(detail?.price),
            status: 'active',
            metadata: {
              provider: 'fipe.parallelum',
              year_code: yearItem.code,
              fuel_code: parsed.fuelCode,
              fipe_model_raw: detail?.model || null,
              model_year_raw: detail?.modelYear || null,
              fuel_acronym: detail?.fuelAcronym || null,
            },
            imported_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          if (DRY_RUN) continue

          const { error } = await supabase.rpc('upsert_external_car_catalog_entry', {
            payload,
          })

          if (error) {
            errors += 1
            console.error('[sync-fipe-catalog] upsert error', brand.name, model.name, yearItem.code, error.message)
            continue
          }
          upserted += 1
        }
      } catch (error) {
        errors += 1
        console.error('[sync-fipe-catalog] model error', brand.name, model.name, error instanceof Error ? error.message : String(error))
      }
    })
  }

  console.log(`[sync-fipe-catalog] done checked=${checked} upserted=${upserted} errors=${errors}`)
}

run().catch((error) => {
  console.error('[sync-fipe-catalog] fatal', error)
  process.exit(1)
})
