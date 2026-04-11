#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const SOURCE_FILE = path.join(ROOT, 'src', 'data', 'cars', 'marketExpansion.ts')
const REPORT_FILE = path.join(ROOT, 'scratch', 'wikimedia-market-image-report.json')

const text = fs.readFileSync(SOURCE_FILE, 'utf8')
const blocks = [...text.matchAll(/\{[\s\S]*?\n  \}/g)].map((m) => m[0])

function extract(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*['\"]([^'\"]+)['\"]`))
  return match?.[1] ?? null
}

function extractNum(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*(\\d+)`))
  return match ? Number(match[1]) : null
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const cars = blocks
  .map((block) => ({
    id: extract(block, 'id'),
    brand: extract(block, 'brand'),
    model: extract(block, 'model'),
    year: extractNum(block, 'year'),
    image: extract(block, 'image'),
  }))
  .filter((car) => car.id && car.brand && car.model && car.year && car.image)

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'carbi-marketplace/1.0 (image-sync; public source)',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function scoreCandidate(car, candidate) {
  const yearToken = String(car.year)
  const title = normalize(candidate.title || '')
  const desc = normalize(candidate.description || '')
  const combo = `${title} ${desc}`

  const modelTokens = normalize(car.model)
    .split(' ')
    .filter((token) => token.length >= 2)
  const brandTokens = normalize(car.brand)
    .split(' ')
    .filter((token) => token.length >= 2)

  let score = 0
  if (combo.includes(yearToken)) score += 5
  if (combo.includes(normalize(car.model))) score += 4
  if (combo.includes(normalize(car.brand))) score += 2

  const matchedModelTokens = modelTokens.filter((token) => combo.includes(token)).length
  score += matchedModelTokens

  const matchedBrandTokens = brandTokens.filter((token) => combo.includes(token)).length
  score += matchedBrandTokens

  if (!combo.includes(yearToken)) score -= 5
  if (matchedModelTokens === 0) score -= 5

  return score
}

async function findBestWikimediaImage(car) {
  const queries = [
    `${car.brand} ${car.model} ${car.year}`,
    `${car.brand} ${car.model} model year ${car.year}`,
    `${car.brand} ${car.model}`,
  ]

  const candidates = []

  for (const query of queries) {
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('format', 'json')
    url.searchParams.set('generator', 'search')
    url.searchParams.set('gsrsearch', query)
    url.searchParams.set('gsrnamespace', '6')
    url.searchParams.set('gsrlimit', '20')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url|extmetadata')

    const json = await fetchJson(url.toString())
    const pages = Object.values(json?.query?.pages || {})

    for (const page of pages) {
      const info = page.imageinfo?.[0]
      const sourceUrl = info?.url
      if (!sourceUrl) continue
      if (!/\.(jpg|jpeg|png|webp)$/i.test(sourceUrl)) continue

      const extmeta = info.extmetadata || {}
      const description =
        extmeta.ImageDescription?.value ||
        extmeta.ObjectName?.value ||
        ''

      candidates.push({
        title: page.title || '',
        description,
        sourceUrl,
      })
    }
  }

  if (candidates.length === 0) return null

  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(car, candidate),
    }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]
  const yearToken = String(car.year)
  const normalized = normalize(`${top.candidate.title} ${top.candidate.description}`)
  const hasYear = normalized.includes(yearToken)
  const hasModel = normalize(car.model)
    .split(' ')
    .filter((token) => token.length >= 2)
    .some((token) => normalized.includes(token))

  if (!hasYear || !hasModel) return null

  return top.candidate
}

async function downloadToFile(url, outputPath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'carbi-marketplace/1.0 (image-sync; public source)',
    },
  })
  if (!response.ok) throw new Error(`Download HTTP ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer))
}

async function main() {
  fs.mkdirSync(path.join(ROOT, 'scratch'), { recursive: true })

  const report = {
    timestamp: new Date().toISOString(),
    total: cars.length,
    synced: [],
    unresolved: [],
  }

  for (const car of cars) {
    const absoluteTarget = path.join(ROOT, 'public', car.image)
    const tmpPath = path.join(ROOT, 'scratch', `${car.id}.tmp`)
    const pngPath = path.join(ROOT, 'scratch', `${car.id}.png`)

    try {
      const match = await findBestWikimediaImage(car)
      if (!match) {
        report.unresolved.push({
          id: car.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          reason: 'No exact year+model match found on Wikimedia Commons',
        })
        continue
      }

      await downloadToFile(match.sourceUrl, tmpPath)
      execFileSync('/usr/bin/sips', ['-s', 'format', 'png', tmpPath, '--out', pngPath], {
        stdio: 'ignore',
      })
      fs.copyFileSync(pngPath, absoluteTarget)
      fs.rmSync(tmpPath, { force: true })
      fs.rmSync(pngPath, { force: true })

      report.synced.push({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        source: match.sourceUrl,
        title: match.title,
      })
      console.log(`SYNCED ${car.brand} ${car.model} ${car.year}`)
    } catch (error) {
      report.unresolved.push({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
      console.log(`UNRESOLVED ${car.brand} ${car.model} ${car.year}`)
    }
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8')
  console.log(`\nDone. synced=${report.synced.length} unresolved=${report.unresolved.length}`)
  console.log(`Report: ${REPORT_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
