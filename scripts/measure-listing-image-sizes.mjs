#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

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

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const BUCKET = process.env.SCRIPT_BUCKET || 'vehicle-listings'
const SAMPLE_SIZE = Math.max(1, Number(process.env.SCRIPT_SAMPLE_SIZE || 500))
const CONCURRENCY = Math.max(1, Number(process.env.SCRIPT_CONCURRENCY || 8))
const MAX_DEPTH = Math.max(1, Number(process.env.SCRIPT_MAX_DEPTH || 6))

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars (URL or KEY).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function listFolder(prefix, depth) {
  const out = []
  let offset = 0
  const limit = 1000
  for (let i = 0; i < 100; i += 1) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) {
      console.log(`list error at "${prefix}": ${error.message}`)
      break
    }
    if (!data?.length) break
    for (const item of data) {
      const fullName = prefix ? `${prefix}${item.name}` : item.name
      if (item.id === null) {
        if (depth < MAX_DEPTH) {
          const nested = await listFolder(`${fullName}/`, depth + 1)
          for (const n of nested) out.push(n)
        }
      } else {
        out.push(fullName)
      }
    }
    if (data.length < limit) break
    offset += limit
  }
  return out
}

function pickEvenly(arr, n) {
  if (arr.length <= n) return arr.slice()
  const step = arr.length / n
  const picked = []
  for (let i = 0; i < n; i += 1) picked.push(arr[Math.floor(i * step)])
  return picked
}

function buildPublicUrl(name) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name)
  return data?.publicUrl || ''
}

async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function measureOne(name) {
  const url = buildPublicUrl(name)
  if (!url) return { name, error: 'no public url' }
  try {
    const res = await fetchWithTimeout(url, 15000)
    if (!res.ok) return { name, error: `http ${res.status}` }
    const buffer = Buffer.from(await res.arrayBuffer())
    const meta = await sharp(buffer).metadata()
    return {
      name,
      bytes: buffer.length,
      width: meta.width || 0,
      height: meta.height || 0,
      format: meta.format || '',
    }
  } catch (err) {
    return { name, error: err?.message || String(err) }
  }
}

function aspectBucket(w, h) {
  if (!w || !h) return 'unknown'
  const r = w / h
  if (r >= 1.45 && r <= 1.55) return '3:2 (1.5)'
  if (r >= 1.70 && r <= 1.85) return '16:9 (1.78)'
  if (r >= 1.25 && r <= 1.40) return '4:3 / 5:4 (~1.33)'
  if (r >= 0.55 && r <= 0.65) return '9:16 portrait (0.56)'
  if (r >= 0.70 && r <= 0.80) return '4:5 portrait (0.80)'
  if (r >= 0.95 && r <= 1.05) return '1:1 square'
  return `other (${r.toFixed(2)})`
}

function summarize(rows) {
  const widths = {}
  const heights = {}
  const pairs = {}
  const aspects = {}
  const sizes = { 'lt_0.5MB': 0, '0.5_1MB': 0, '1_2MB': 0, '2_5MB': 0, '5_10MB': 0, 'gte_10MB': 0 }
  const formats = {}
  const mp = []
  let bytesTotal = 0
  let bytesCount = 0

  for (const r of rows) {
    if (!r || r.error || !r.width || !r.height) continue
    widths[r.width] = (widths[r.width] || 0) + 1
    heights[r.height] = (heights[r.height] || 0) + 1
    const key = `${r.width}x${r.height}`
    pairs[key] = (pairs[key] || 0) + 1
    const ab = aspectBucket(r.width, r.height)
    aspects[ab] = (aspects[ab] || 0) + 1
    formats[r.format] = (formats[r.format] || 0) + 1
    mp.push((r.width * r.height) / 1_000_000)
    const mb = r.bytes / (1024 * 1024)
    if (mb < 0.5) sizes['lt_0.5MB'] += 1
    else if (mb < 1) sizes['0.5_1MB'] += 1
    else if (mb < 2) sizes['1_2MB'] += 1
    else if (mb < 5) sizes['2_5MB'] += 1
    else if (mb < 10) sizes['5_10MB'] += 1
    else sizes['gte_10MB'] += 1
    bytesTotal += r.bytes
    bytesCount += 1
  }

  const topPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 15)
  const topWidths = Object.entries(widths).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const topHeights = Object.entries(heights).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const sortedMp = mp.slice().sort((a, b) => a - b)
  const median = sortedMp.length ? sortedMp[Math.floor(sortedMp.length / 2)] : 0
  const mean = sortedMp.length ? sortedMp.reduce((s, v) => s + v, 0) / sortedMp.length : 0

  return {
    measured: bytesCount,
    failed: rows.length - bytesCount,
    bytes_avg: bytesCount ? Math.round(bytesTotal / bytesCount) : 0,
    bytes_median: bytesCount
      ? (() => {
          const sb = rows
            .filter((r) => r && !r.error && r.bytes)
            .map((r) => r.bytes)
            .sort((a, b) => a - b)
          return sb[Math.floor(sb.length / 2)] || 0
        })()
      : 0,
    megapixels_median: Number(median.toFixed(2)),
    megapixels_mean: Number(mean.toFixed(2)),
    top_pairs: topPairs,
    top_widths: topWidths,
    top_heights: topHeights,
    aspect_buckets: aspects,
    formats,
    size_distribution: sizes,
  }
}

async function runWorker(queue, results, label) {
  while (queue.length) {
    const name = queue.shift()
    if (!name) return
    const r = await measureOne(name)
    results.push(r)
    if (results.length % 25 === 0) {
      console.log(`[${label}] measured ${results.length}/${SAMPLE_SIZE}`)
    }
  }
}

async function main() {
  console.log(`Listing objects recursively in bucket "${BUCKET}" (max depth ${MAX_DEPTH})...`)
  const all = await listFolder('', 0)
  console.log(`Found ${all.length} files in storage.`)
  if (!all.length) {
    console.log('Nothing to measure.')
    return
  }

  const sample = pickEvenly(all, Math.min(SAMPLE_SIZE, all.length))
  console.log(`Sampling ${sample.length} objects evenly across the list.`)

  const queue = sample.slice()
  const results = []
  const workers = []
  for (let i = 0; i < CONCURRENCY; i += 1) {
    workers.push(runWorker(queue, results, `w${i}`))
  }
  await Promise.all(workers)

  const summary = summarize(results)
  console.log('\n=== Summary ===')
  console.log(JSON.stringify(summary, null, 2))

  const failed = results.filter((r) => r && r.error)
  if (failed.length) {
    console.log(`\nFailures (${failed.length}):`)
    for (const f of failed.slice(0, 5)) console.log(` - ${f.name}: ${f.error}`)
  }

  const outPath = path.join(process.cwd(), 'scratch', 'listing-image-size-report.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify({ summary, results }, null, 2))
  console.log(`\nWrote report to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})