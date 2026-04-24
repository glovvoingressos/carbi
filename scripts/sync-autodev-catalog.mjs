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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
const AUTODEV_API_KEY = process.env.AUTODEV_API_KEY || process.env.AUTO_DEV_API_KEY || ''
const AUTODEV_BASE_URL = (process.env.AUTODEV_BASE_URL || process.env.AUTO_DEV_BASE_URL || 'https://api.auto.dev').replace(/\/+$/, '')

const MIN_YEAR = Math.max(1990, Number(process.env.MIN_YEAR || 2019))
const LIMIT_GROUPS = Math.max(0, Number(process.env.LIMIT_GROUPS || 0))
const LIMIT_ROWS = Math.max(0, Number(process.env.LIMIT_ROWS || 2000))
const LIMIT_PER_REQUEST = Math.min(3, Math.max(1, Number(process.env.LIMIT_PER_REQUEST || 1)))
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 4))
const REQUEST_TIMEOUT_MS = Math.max(4000, Number(process.env.REQUEST_TIMEOUT_MS || 20000))
const REQUEST_RETRIES = Math.max(0, Number(process.env.REQUEST_RETRIES || 2))
const REQUEST_DELAY_MS = Math.max(0, Number(process.env.REQUEST_DELAY_MS || 250))
const RATE_LIMIT_BACKOFF_MS = Math.max(500, Number(process.env.RATE_LIMIT_BACKOFF_MS || 1400))
const ALLOW_YEAR_FALLBACK = process.env.ALLOW_YEAR_FALLBACK !== '0'
const FORCE = process.env.FORCE === '1'
const DRY_RUN = process.env.DRY_RUN === '1'

const BRANDS = (process.env.BRANDS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON key).')
  process.exit(1)
}

if (!AUTODEV_API_KEY) {
  console.error('Missing Auto.dev env: AUTODEV_API_KEY (or AUTO_DEV_API_KEY).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

let lastRequestAt = 0

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeModelText(value) {
  return normalizeText(value)
    .replace(/\btts\b/g, 'tt s')
    .replace(/\bttrs\b/g, 'tt rs')
    .replace(/\btt-rs\b/g, 'tt rs')
    .replace(/\bsportback\b/g, 'sportback')
}

function extractCoreModelName(modelName) {
  const tokens = String(modelName || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  if (tokens.length === 0) return ''
  const picked = []
  for (const token of tokens) {
    if (/\d/.test(token) && picked.length > 0) break
    if (picked.length >= 3) break
    picked.push(token)
  }
  return picked.join(' ')
}

function modelTokens(value) {
  return normalizeModelText(value).split(' ').filter(Boolean)
}

function tokenOverlapScore(left, right) {
  const a = new Set(modelTokens(left))
  const b = new Set(modelTokens(right))
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) {
    if (b.has(t)) inter += 1
  }
  const union = new Set([...a, ...b]).size
  return union > 0 ? inter / union : 0
}

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function shouldRefresh(row) {
  if (FORCE) return true
  return !(
    row.image_url &&
    row.engine &&
    toNumber(row.horsepower) &&
    row.transmission &&
    row.drive &&
    row.fuel_type
  )
}

async function throttle() {
  if (REQUEST_DELAY_MS <= 0) return
  const now = Date.now()
  const elapsed = now - lastRequestAt
  const waitMs = REQUEST_DELAY_MS - elapsed
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  lastRequestAt = Date.now()
}

async function fetchListings({ make, model, year }) {
  const query = new URLSearchParams({
    'vehicle.make': make,
    'vehicle.model': model,
    limit: String(LIMIT_PER_REQUEST),
    page: '1',
  })
  if (typeof year === 'number' && Number.isFinite(year)) {
    query.set('vehicle.year', String(year))
  }
  const url = `${AUTODEV_BASE_URL}/listings?${query.toString()}`

  let lastError = null
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    await throttle()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${AUTODEV_API_KEY}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`AUTODEV_429:${make}:${model}:${year}`)
        }
        throw new Error(`AUTODEV_${response.status}:${make}:${model}:${year}`)
      }

      const payload = await response.json()
      clearTimeout(timeout)
      return Array.isArray(payload?.data) ? payload.data : []
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < REQUEST_RETRIES) {
        const message = error instanceof Error ? error.message : String(error)
        const backoff = message.startsWith('AUTODEV_429:')
          ? RATE_LIMIT_BACKOFF_MS * Math.pow(2, attempt + 1)
          : 350 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Auto.dev request failed for ${make} ${model} ${year}`)
}

function pickBestListing(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return null
  return [...listings].sort((a, b) => {
    const aPhotos = Number(a?.retailListing?.photoCount || 0)
    const bPhotos = Number(b?.retailListing?.photoCount || 0)
    return bPhotos - aPhotos
  })[0]
}

function listingMatchesRow(row, listing) {
  const vehicle = listing?.vehicle || {}
  const rowBrand = normalizeText(row.brand_name)
  const listingBrand = normalizeText(vehicle.make || '')
  if (!rowBrand || !listingBrand || rowBrand !== listingBrand) return false

  const rowYear = Number(row.year_model)
  const listingYear = Number(vehicle.year)
  if (Number.isFinite(rowYear) && Number.isFinite(listingYear) && Math.abs(rowYear - listingYear) > 1) {
    return false
  }

  const rowCore = extractCoreModelName(row.model_name)
  const listingModel = String(vehicle.model || '')
  const rowCoreNorm = normalizeModelText(rowCore)
  const listingNorm = normalizeModelText(listingModel)
  if (!rowCoreNorm || !listingNorm) return false

  if (rowCoreNorm === listingNorm) return true
  if (rowCoreNorm.includes(listingNorm) || listingNorm.includes(rowCoreNorm)) return true

  const overlap = tokenOverlapScore(rowCoreNorm, listingNorm)
  return overlap >= 0.5
}

function modelQueryCandidates(modelName) {
  const cleaned = String(modelName || '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  const tokens = cleaned.split(' ')
  const two = tokens.slice(0, 2).join(' ').trim()
  const one = tokens[0]?.trim() || ''
  return Array.from(new Set([cleaned, two, one].filter(Boolean)))
}

async function fetchBestListingForModel(row) {
  const candidates = modelQueryCandidates(row.model_name)
  for (const candidateModel of candidates) {
    const exactYear = await fetchListings({
      make: row.brand_name,
      model: candidateModel,
      year: row.year_model,
    })
    const exactBest = pickBestListing(exactYear.filter((listing) => listingMatchesRow(row, listing)))
    if (exactBest) return exactBest

    if (!ALLOW_YEAR_FALLBACK) continue
    const fallbackYear = await fetchListings({
      make: row.brand_name,
      model: candidateModel,
      year: undefined,
    })
    const fallbackBest = pickBestListing(fallbackYear.filter((listing) => listingMatchesRow(row, listing)))
    if (fallbackBest) return fallbackBest
  }
  return null
}

function toPatchFromListing(listing) {
  if (!listing || typeof listing !== 'object') return null
  const vehicle = listing.vehicle || {}
  const retail = listing.retailListing || {}
  const imageUrl = typeof retail.primaryImage === 'string' && retail.primaryImage.trim().length > 0 ? retail.primaryImage : null

  const patch = {
    image_url: imageUrl,
    category: typeof vehicle.bodyStyle === 'string' && vehicle.bodyStyle.trim() ? vehicle.bodyStyle : null,
    fuel_type: typeof vehicle.fuel === 'string' && vehicle.fuel.trim() ? vehicle.fuel : null,
    engine: typeof vehicle.engine === 'string' && vehicle.engine.trim() ? vehicle.engine : null,
    cylinder_count: toNumber(vehicle.cylinders),
    horsepower: toNumber(vehicle.horsepower),
    torque: toNumber(vehicle.torque),
    transmission: typeof vehicle.transmission === 'string' && vehicle.transmission.trim() ? vehicle.transmission : null,
    drive: typeof vehicle.drivetrain === 'string' && vehicle.drivetrain.trim() ? vehicle.drivetrain : null,
    seats: toNumber(vehicle.seats),
    metadata: {
      provider: 'auto.dev',
      listing_vin: listing.vin || null,
      listing_id: listing['@id'] || null,
      listing_created_at: listing.createdAt || null,
      listing_online: listing.online ?? null,
      retail_price: toNumber(retail.price),
      retail_photo_count: toNumber(retail.photoCount),
      retail_state: retail.state || null,
      retail_city: retail.city || null,
      retail_used: retail.used ?? null,
    },
    updated_at: new Date().toISOString(),
  }

  return patch
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
  console.log('[sync-autodev-catalog] starting...')
  console.log(`[sync-autodev-catalog] dryRun=${DRY_RUN} force=${FORCE} minYear=${MIN_YEAR}`)

  let query = supabase
    .from('external_car_catalog')
    .select('id, vehicle_type, source, fipe_code, brand_name, model_name, version_name, year_model, year_label, image_url, category, fuel_type, engine, cylinder_count, horsepower, torque, transmission, drive, seats, price_brl, reference_month, status, metadata')
    .gte('year_model', MIN_YEAR)
    .in('vehicle_type', ['car', 'carro'])
    .order('updated_at', { ascending: true })

  if (LIMIT_ROWS > 0) {
    query = query.limit(LIMIT_ROWS)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to load catalog rows: ${error.message}`)
  }

  const rows = Array.isArray(data) ? data : []
  const filteredRows = rows.filter((row) => {
    if (BRANDS.length === 0) return true
    const brandNorm = normalizeText(row.brand_name)
    return BRANDS.some((b) => brandNorm.includes(b))
  })

  const grouped = new Map()
  for (const row of filteredRows) {
    if (!shouldRefresh(row)) continue
    const key = `${normalizeText(row.brand_name)}|${normalizeText(row.model_name)}|${row.year_model}`
    const group = grouped.get(key) || []
    group.push(row)
    grouped.set(key, group)
  }

  let groups = Array.from(grouped.values())
  if (LIMIT_GROUPS > 0) {
    groups = groups.slice(0, LIMIT_GROUPS)
  }

  let queried = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  await poolMap(groups, CONCURRENCY, async (group) => {
    const sample = group[0]
    try {
      const best = await fetchBestListingForModel(sample)
      queried += 1

      if (!best) {
        console.warn('[sync-autodev-catalog] no listing', sample.brand_name, sample.model_name, sample.year_model)
        skipped += group.length
        return
      }

      const patch = toPatchFromListing(best)
      if (!patch) {
        skipped += group.length
        return
      }

      if (DRY_RUN) {
        updated += group.length
        return
      }

      for (const row of group) {
        const payload = {
          vehicle_type: row.vehicle_type || 'car',
          source: row.source || 'fipe',
          brand_name: row.brand_name,
          model_name: row.model_name,
          version_name: row.version_name || row.model_name,
          year_label: row.year_label || String(row.year_model),
          year_model: row.year_model,
          fuel_type: patch.fuel_type || row.fuel_type || null,
          fipe_code: row.fipe_code || null,
          reference_month: row.reference_month || null,
          price_brl: row.price_brl ?? null,
          status: row.status || 'active',
          category: patch.category || row.category || null,
          engine: patch.engine || row.engine || null,
          cylinder_count: patch.cylinder_count ?? row.cylinder_count ?? null,
          horsepower: patch.horsepower ?? row.horsepower ?? null,
          torque: patch.torque ?? row.torque ?? null,
          transmission: patch.transmission || row.transmission || null,
          drive: patch.drive || row.drive || null,
          seats: patch.seats ?? row.seats ?? null,
          image_url: patch.image_url || row.image_url || null,
          metadata: {
            ...(row.metadata && typeof row.metadata === 'object' ? row.metadata : {}),
            ...(patch.metadata && typeof patch.metadata === 'object' ? patch.metadata : {}),
          },
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: upsertError } = await supabase.rpc('upsert_external_car_catalog_entry', { payload })

        if (upsertError) {
          errors += 1
          console.error('[sync-autodev-catalog] upsert error', row.id, upsertError.message)
          continue
        }
        updated += 1
      }
    } catch (runError) {
      errors += 1
      console.error(
        '[sync-autodev-catalog] fetch error',
        sample.brand_name,
        sample.model_name,
        sample.year_model,
        runError instanceof Error ? runError.message : String(runError),
      )
    }
  })

  console.log(`[sync-autodev-catalog] done groups=${groups.length} queried=${queried} updated=${updated} skipped=${skipped} errors=${errors}`)
}

run().catch((error) => {
  console.error('[sync-autodev-catalog] fatal', error)
  process.exit(1)
})
