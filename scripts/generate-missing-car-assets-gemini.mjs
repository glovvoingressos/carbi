#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'src', 'data', 'cars')
const ASSETS_DIR = path.join(ROOT, 'public', 'assets', 'cars')
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'carAssetManifest.ts')

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('Missing GOOGLE_API_KEY or GEMINI_API_KEY')
  process.exit(1)
}

const MODEL_CANDIDATES = [
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-exp',
]

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.ts'))

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function listExpectedAssetPaths() {
  const refs = []
  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8')
    const matches = [...content.matchAll(/image:\s*['"](\/assets\/cars\/[^'"]+\.png)['"]/g)]
    for (const match of matches) refs.push(match[1])
  }
  return [...new Set(refs)]
}

function missingAssetPaths() {
  return listExpectedAssetPaths().filter((assetPath) => !fs.existsSync(path.join(ROOT, 'public', assetPath)))
}

function decodeModelAndTrim(fileName) {
  const base = fileName.replace('.png', '')
  const parts = base.split('-')
  const year = parts[parts.length - 1]
  const body = parts.slice(0, -1).join(' ')
  return { body, year: /^\d{4}$/.test(year) ? year : '2026' }
}

function buildPrompt(assetPath) {
  const fileName = path.basename(assetPath)
  const { body, year } = decodeModelAndTrim(fileName)
  return [
    `Foto automotiva realista de estúdio do veículo ${body}, ano modelo ${year}.`,
    'Enquadramento lateral 3/4 dianteiro, carro inteiro visível, fundo claro limpo, iluminação profissional.',
    'Sem texto, sem logotipos, sem marca d’água, sem pessoas, sem elementos gráficos.',
    'Estilo fotográfico real, alta nitidez, proporção horizontal.',
  ].join(' ')
}

async function generateWithModel(model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HTTP ${response.status} on ${model}: ${body.slice(0, 280)}`)
  }

  const data = await response.json()
  const candidates = Array.isArray(data?.candidates) ? data.candidates : []
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || []
    for (const part of parts) {
      const b64 = part?.inlineData?.data
      if (typeof b64 === 'string' && b64.length > 0) {
        return Buffer.from(b64, 'base64')
      }
    }
  }

  throw new Error(`No image binary returned by ${model}`)
}

async function generateImage(prompt) {
  let lastError = null
  for (const model of MODEL_CANDIDATES) {
    try {
      const image = await generateWithModel(model, prompt)
      return { image, model }
    } catch (error) {
      lastError = error
      console.error(`model failed: ${model} -> ${error.message}`)
    }
  }
  throw lastError || new Error('All Gemini models failed')
}

function writeManifest() {
  const filesOnDisk = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => `  '/assets/cars/${f}',`)

  const content = `// Auto-generated from public/assets/cars.\nexport const availableCarAssetPaths = new Set<string>([\n${filesOnDisk.join('\n')}\n])\n`
  fs.writeFileSync(MANIFEST_PATH, content, 'utf8')
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true })
  const missing = missingAssetPaths()
  console.log(`Missing assets: ${missing.length}`)
  if (missing.length === 0) {
    writeManifest()
    console.log('No missing assets.')
    return
  }

  const limit = Number.parseInt(process.env.LIMIT || `${missing.length}`, 10)
  const queue = missing.slice(0, Number.isFinite(limit) ? limit : missing.length)
  let ok = 0
  let fail = 0

  for (const assetPath of queue) {
    const outputPath = path.join(ROOT, 'public', assetPath)
    const prompt = buildPrompt(assetPath)
    try {
      const { image, model } = await generateImage(prompt)
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, image)
      ok += 1
      console.log(`OK  [${model}] ${assetPath}`)
      await sleep(300)
    } catch (error) {
      fail += 1
      console.error(`ERR ${assetPath}: ${error.message}`)
      await sleep(300)
    }
  }

  writeManifest()
  console.log(`Done. success=${ok} fail=${fail}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
