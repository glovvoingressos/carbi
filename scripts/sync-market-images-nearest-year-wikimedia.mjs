#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const REPORT_IN = path.join(ROOT, 'scratch', 'wikimedia-market-image-report.json')
const REPORT_OUT = path.join(ROOT, 'scratch', 'wikimedia-market-image-report-nearest-year.json')

const report = JSON.parse(fs.readFileSync(REPORT_IN, 'utf8'))
const unresolved = report.unresolved || []

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function extractYear(text) {
  const m = String(text).match(/\b(19\d{2}|20\d{2})\b/)
  return m ? Number(m[1]) : null
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'carbi-marketplace/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function score(car, candidate) {
  const normTitle = normalize(candidate.title)
  const normDesc = normalize(candidate.description)
  const combo = `${normTitle} ${normDesc}`
  const modelTokens = normalize(car.model).split(' ').filter((t) => t.length >= 2)
  const brandTokens = normalize(car.brand).split(' ').filter((t) => t.length >= 2)

  let s = 0
  const modelHits = modelTokens.filter((t) => combo.includes(t)).length
  const brandHits = brandTokens.filter((t) => combo.includes(t)).length
  s += modelHits * 3 + brandHits * 2

  const y = extractYear(`${candidate.title} ${candidate.description}`)
  if (y) s += Math.max(0, 10 - Math.abs(car.year - y))

  if (modelHits === 0) s -= 20
  return s
}

async function searchCandidate(car) {
  const queries = [
    `${car.brand} ${car.model}`,
    `${car.model} ${car.brand}`,
    `${car.model} car`,
  ]

  const candidates = []
  for (const q of queries) {
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('format', 'json')
    url.searchParams.set('generator', 'search')
    url.searchParams.set('gsrsearch', q)
    url.searchParams.set('gsrnamespace', '6')
    url.searchParams.set('gsrlimit', '30')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url|extmetadata')

    const data = await fetchJson(url.toString())
    const pages = Object.values(data?.query?.pages || {})
    for (const page of pages) {
      const info = page.imageinfo?.[0]
      if (!info?.url) continue
      if (!/\.(jpg|jpeg|png|webp)$/i.test(info.url)) continue
      const desc = info.extmetadata?.ImageDescription?.value || info.extmetadata?.ObjectName?.value || ''
      candidates.push({ title: page.title || '', description: desc, url: info.url })
    }
  }

  if (!candidates.length) return null

  const best = candidates
    .map((c) => ({ c, s: score(car, c) }))
    .sort((a, b) => b.s - a.s)[0]

  if (!best || best.s < 3) return null
  return best.c
}

async function download(url, tmpFile) {
  const res = await fetch(url, { headers: { 'User-Agent': 'carbi-marketplace/1.0' } })
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`)
  const arr = await res.arrayBuffer()
  fs.writeFileSync(tmpFile, Buffer.from(arr))
}

async function main() {
  const out = { timestamp: new Date().toISOString(), synced: [], unresolved: [] }
  fs.mkdirSync(path.join(ROOT, 'scratch'), { recursive: true })

  for (const item of unresolved) {
    const car = {
      id: item.id,
      brand: item.brand,
      model: item.model,
      year: item.year,
      image: `/assets/cars/${item.id}.png`,
    }

    try {
      const cand = await searchCandidate(car)
      if (!cand) {
        out.unresolved.push({ ...item, reason: 'No nearest-year model match on Wikimedia' })
        continue
      }

      const tmp = path.join(ROOT, 'scratch', `${car.id}.tmp`)
      const png = path.join(ROOT, 'scratch', `${car.id}.png`)
      await download(cand.url, tmp)
      execFileSync('/usr/bin/sips', ['-s', 'format', 'png', tmp, '--out', png], { stdio: 'ignore' })
      fs.copyFileSync(png, path.join(ROOT, 'public', car.image))
      fs.rmSync(tmp, { force: true })
      fs.rmSync(png, { force: true })

      out.synced.push({ id: car.id, brand: car.brand, model: car.model, year: car.year, source: cand.url, title: cand.title })
      console.log(`SYNCED ${car.brand} ${car.model} (${car.year})`)
    } catch (e) {
      out.unresolved.push({ ...item, reason: e instanceof Error ? e.message : 'unknown error' })
      console.log(`UNRESOLVED ${car.brand} ${car.model}`)
    }
  }

  fs.writeFileSync(REPORT_OUT, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Done synced=${out.synced.length} unresolved=${out.unresolved.length}`)
  console.log(`Report ${REPORT_OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
