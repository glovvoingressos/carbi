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

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const BUCKET = process.env.SCRIPT_BUCKET || 'vehicle-listings'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(BUCKET)
console.log('getBucket:', { bucketErr: bucketErr?.message, bucket })

async function listAll() {
  const limit = 1000
  let offset = 0
  const out = []
  for (let i = 0; i < 200; i += 1) {
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) {
      console.log('list error:', error.message)
      break
    }
    if (!data?.length) break
    for (const item of data) out.push(item)
    if (data.length < limit) break
    offset += limit
  }
  return out
}

const items = await listAll()
console.log(`\nTotal items at root: ${items.length}`)
for (const it of items.slice(0, 20)) {
  console.log(` - name="${it.name}" id="${it.id}"`)
}

const folders = items.filter((it) => it.name && it.name.endsWith('/'))
if (folders.length) {
  console.log(`\nFolders at root (${folders.length}):`)
  for (const f of folders.slice(0, 20)) {
    const { data: sub, error } = await supabase.storage.from(BUCKET).list(f.name, { limit: 10 })
    console.log(` - ${f.name} -> ${sub?.length || 0} items${error ? ` err=${error.message}` : ''}`)
    for (const s of (sub || []).slice(0, 5)) {
      const url = supabase.storage.from(BUCKET).getPublicUrl(f.name + s.name).data?.publicUrl
      console.log(`     - ${s.name} url=${url || '<empty>'}`)
    }
  }
} else {
  for (const it of items.slice(0, 5)) {
    const url = supabase.storage.from(BUCKET).getPublicUrl(it.name).data?.publicUrl
    console.log(`url for "${it.name}": ${url || '<empty>'}`)
    if (url) {
      try {
        const res = await fetch(url, { method: 'HEAD' })
        console.log(`   HEAD status: ${res.status}`)
      } catch (e) {
        console.log(`   HEAD err: ${e.message}`)
      }
    }
  }
}