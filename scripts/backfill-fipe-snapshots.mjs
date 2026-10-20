#!/usr/bin/env node
/**
 * Backfills the FIPE snapshot (price, reference month and codes) for existing
 * vehicle listings, using the same resolution rules as the listing form.
 *
 * Usage:
 *   npm run backfill:fipe               # updates listings without a FIPE price
 *   DRY_RUN=1 npm run backfill:fipe     # only reports what would change
 *   UPDATE_ALL=1 npm run backfill:fipe  # also refreshes listings that already have a price
 *   LIMIT=10 CONCURRENCY=1 npm run backfill:fipe
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import {
  getFipeDetailByCode,
  getFipeVersionsByYear,
  resolveBrandAndModelByYear,
  selectFipeYearVariant,
} from '../src/lib/fipe-api.ts'

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
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
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

const DRY_RUN = process.env.DRY_RUN === '1'
const UPDATE_ALL = process.env.UPDATE_ALL === '1'
const LIMIT = Math.max(0, Number(process.env.LIMIT || 0))
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 1))
const REQUEST_DELAY_MS = Math.max(0, Number(process.env.REQUEST_DELAY_MS || 350))

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[backfill-fipe] Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON key) are required.')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[backfill-fipe] SUPABASE_SERVICE_ROLE_KEY not found. Falling back to anon key; writes may fail by RLS.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function parsePriceBrl(price) {
  const only = String(price || '').replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = Number(only)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let lastRequestAt = 0

async function throttle() {
  if (REQUEST_DELAY_MS <= 0) return
  const waitMs = REQUEST_DELAY_MS - (Date.now() - lastRequestAt)
  if (waitMs > 0) await sleep(waitMs)
  lastRequestAt = Date.now()
}

async function fetchListings() {
  const rows = []
  const pageSize = 500
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('vehicle_listings')
      .select('id, slug, brand, model, version, year_model, price, fipe_price, status, vehicle_type')
      .neq('vehicle_type', 'truck')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Failed to load listings: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

async function lookupFipe(listing) {
  const year = Number(listing.year_model)
  if (!Number.isFinite(year) || year < 1900) return null

  const resolved = await resolveBrandAndModelByYear(
    listing.brand,
    listing.model,
    year,
    listing.version || undefined,
  )
  if (!resolved) return null

  await throttle()
  const versions = await getFipeVersionsByYear(resolved.brand.code, resolved.model.code, year)
  const selected = selectFipeYearVariant(versions, listing.version, resolved.model.name)
  if (!selected) return null

  await throttle()
  const detail = await getFipeDetailByCode(resolved.brand.code, resolved.model.code, selected.code)
  if (!detail?.price || detail.modelYear !== year) return null

  const fipePrice = parsePriceBrl(detail.price)
  if (!fipePrice) return null

  return {
    fipe_price: fipePrice,
    fipe_reference_month: detail.referenceMonth || null,
    fipe_brand_code: resolved.brand.code,
    fipe_model_code: resolved.model.code,
    fipe_year_code: selected.code,
    resolvedModel: resolved.model.name,
  }
}

async function processListing(listing) {
  try {
    let snapshot = await lookupFipe(listing)
    // A transient FIPE failure (5xx/429) looks like "no exact reference";
    // retry once so a temporary error does not leave the listing without a snapshot.
    if (!snapshot) {
      await sleep(900)
      snapshot = await lookupFipe(listing)
    }
    if (!snapshot) {
      return { listing, status: 'skipped' }
    }

    const { resolvedModel, ...payload } = snapshot
    if (!DRY_RUN) {
      const { error } = await supabase
        .from('vehicle_listings')
        .update(payload)
        .eq('id', listing.id)
      if (error) throw new Error(error.message)
    }

    return { listing, status: DRY_RUN ? 'would-update' : 'updated', snapshot: payload, resolvedModel }
  } catch (error) {
    return { listing, status: 'error', error: error instanceof Error ? error.message : String(error) }
  }
}

async function main() {
  console.log(`[backfill-fipe] dryRun=${DRY_RUN} updateAll=${UPDATE_ALL} concurrency=${CONCURRENCY}`)

  const all = await fetchListings()
  let targets = all.filter((listing) => UPDATE_ALL || !listing.fipe_price || Number(listing.fipe_price) <= 0)
  if (LIMIT > 0) targets = targets.slice(0, LIMIT)

  console.log(`[backfill-fipe] listings=${all.length} targets=${targets.length}`)

  const results = []
  let cursor = 0
  async function worker() {
    while (cursor < targets.length) {
      const listing = targets[cursor++]
      results.push(await processListing(listing))
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker))

  for (const result of results) {
    const { listing } = result
    const label = `${listing.brand} ${listing.model} ${listing.version || ''} ${listing.year_model}`.replace(/\s+/g, ' ').trim()
    if (result.status === 'updated') {
      console.log(`  ok     ${label} -> R$ ${result.snapshot.fipe_price} (${result.snapshot.fipe_reference_month}) via "${result.resolvedModel}"`)
    } else if (result.status === 'would-update') {
      console.log(`  would  ${label} -> R$ ${result.snapshot.fipe_price} (${result.snapshot.fipe_reference_month}) via "${result.resolvedModel}"`)
    } else if (result.status === 'skipped') {
      console.log(`  skip   ${label} (sem referência FIPE exata)`)
    } else {
      console.log(`  error  ${label}: ${result.error}`)
    }
  }

  const updated = results.filter((r) => r.status === 'updated').length
  const wouldUpdate = results.filter((r) => r.status === 'would-update').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const errors = results.filter((r) => r.status === 'error').length
  console.log(`[backfill-fipe] done updated=${updated} wouldUpdate=${wouldUpdate} skipped=${skipped} errors=${errors}`)

  if (errors > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error('[backfill-fipe] fatal', error)
  process.exit(1)
})
