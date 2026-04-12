#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
const URLS = (process.env.IMAGE_URLS || '').split(',').map((item) => item.trim()).filter(Boolean)
const OUT_DIR = process.env.OUT_DIR || '/tmp/carbi-plate-blur-test'
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

if (!API_KEY) {
  console.error('Missing GOOGLE_API_KEY or GEMINI_API_KEY')
  process.exit(1)
}

if (URLS.length === 0) {
  console.error('Missing IMAGE_URLS')
  process.exit(1)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

async function detectPlate(buffer) {
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  const payload = {
    contents: [
      {
        parts: [
          {
            text: 'Analise a foto de um carro e localize somente a placa do veículo principal. Responda apenas JSON com found, confidence e box { x, y, width, height } usando coordenadas entre 0 e 1. Se não encontrar com confiança, retorne found=false.',
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: optimized.toString('base64'),
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          found: { type: 'BOOLEAN' },
          confidence: { type: 'NUMBER' },
          box: {
            type: 'OBJECT',
            nullable: true,
            properties: {
              x: { type: 'NUMBER' },
              y: { type: 'NUMBER' },
              width: { type: 'NUMBER' },
              height: { type: 'NUMBER' },
            },
          },
        },
      },
    },
  }

  for (const model of MODELS) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) continue
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.find((part) => typeof part?.text === 'string')?.text
    if (!text) continue
    const parsed = JSON.parse(text)
    if (!parsed?.found || !parsed?.box) continue
    const x = clamp(Number(parsed.box.x), 0, 0.98)
    const y = clamp(Number(parsed.box.y), 0, 0.98)
    const width = clamp(Number(parsed.box.width), 0.02, 0.98 - x)
    const height = clamp(Number(parsed.box.height), 0.01, 0.98 - y)
    if (!Number.isFinite(x + y + width + height) || width <= 0.01 || height <= 0.005) continue
    return {
      ...parsed,
      box: { x, y, width, height },
    }
  }

  return null
}

async function blurBox(buffer, box) {
  const image = sharp(buffer).rotate()
  const meta = await image.metadata()
  const width = meta.width || 0
  const height = meta.height || 0
  const paddingX = box.width * 0.35
  const paddingY = box.height * 0.7
  const left = Math.max(0, Math.floor((clamp(box.x, 0, 1) - paddingX) * width))
  const top = Math.max(0, Math.floor((clamp(box.y, 0, 1) - paddingY) * height))
  const extractWidth = Math.min(width - left, Math.ceil((box.width + paddingX * 2) * width))
  const extractHeight = Math.min(height - top, Math.ceil((box.height + paddingY * 2) * height))
  if (extractWidth < 12 || extractHeight < 12 || left >= width || top >= height) {
    return buffer
  }
  const source = await image.toBuffer()
  try {
    const blurred = await sharp(source)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .blur(18)
      .toBuffer()
    return sharp(source).composite([{ input: blurred, left, top }]).toBuffer()
  } catch (error) {
    console.log(`SKIP_INVALID_BOX left=${left} top=${top} width=${extractWidth} height=${extractHeight} error=${error.message}`)
    return buffer
  }
}

await fs.promises.mkdir(OUT_DIR, { recursive: true })

for (let index = 0; index < URLS.length; index += 1) {
  const url = URLS[index]
  const response = await fetch(url)
  const buffer = Buffer.from(await response.arrayBuffer())
  const detection = await detectPlate(buffer)
  const fileBase = `${String(index + 1).padStart(2, '0')}`
  const originalPath = path.join(OUT_DIR, `${fileBase}-original.jpg`)
  const blurredPath = path.join(OUT_DIR, `${fileBase}-blurred.jpg`)
  await fs.promises.writeFile(originalPath, buffer)
  if (detection?.box) {
    const output = await blurBox(buffer, detection.box)
    await fs.promises.writeFile(blurredPath, output)
    console.log(`OK ${url} confidence=${detection.confidence ?? 'n/a'} -> ${blurredPath}`)
  } else {
    console.log(`NO_PLATE ${url}`)
  }
}
