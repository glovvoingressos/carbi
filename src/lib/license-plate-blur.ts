import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'

type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

type GeminiDetectionResponse = {
  found?: boolean
  confidence?: number
  box?: BoundingBox | null
}

type SanitizeResult = {
  blurred: boolean
  confidence: number | null
  box: BoundingBox | null
}

const GEMINI_MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash']
const MIN_CONFIDENCE = 0.7

function getGoogleApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeBox(raw?: BoundingBox | null): BoundingBox | null {
  if (!raw) return null
  const values = [raw.x, raw.y, raw.width, raw.height]
  if (values.some((value) => !Number.isFinite(value))) return null

  const x = clamp(raw.x, 0, 0.98)
  const y = clamp(raw.y, 0, 0.98)
  const width = clamp(raw.width, 0.02, 0.98 - x)
  const height = clamp(raw.height, 0.01, 0.98 - y)
  if (width <= 0.01 || height <= 0.005) return null

  return { x, y, width, height }
}

async function buildDetectionPayload(buffer: Buffer, mimeType: string) {
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  return {
    contents: [
      {
        parts: [
          {
            text: [
              'Analise a foto de um carro e identifique somente a placa visível do veículo principal.',
              'Responda apenas JSON.',
              'Use coordenadas normalizadas entre 0 e 1.',
              'Retorne found=false se a placa não estiver visível com confiança.',
              'Se encontrar, retorne o retângulo mínimo da placa em { x, y, width, height }.',
            ].join(' '),
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
    safetySettings: [],
    systemInstruction: {
      parts: [
        {
          text: 'Você é um detector de placa. Responda estritamente com JSON válido.',
        },
      ],
    },
    _meta: { originalMimeType: mimeType },
  }
}

async function detectLicensePlate(buffer: Buffer, mimeType: string): Promise<SanitizeResult> {
  const apiKey = getGoogleApiKey()
  if (!apiKey) {
    return { blurred: false, confidence: null, box: null }
  }

  const payload = await buildDetectionPayload(buffer, mimeType)
  let lastError: Error | null = null

  for (const model of GEMINI_MODEL_CANDIDATES) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}`)
      }

      const data = await response.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === 'string')?.text
      if (typeof rawText !== 'string' || !rawText.trim()) {
        return { blurred: false, confidence: null, box: null }
      }

      const parsed = JSON.parse(rawText) as GeminiDetectionResponse
      const box = normalizeBox(parsed.box)
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : null
      const found = Boolean(parsed.found && box && (confidence === null || confidence >= MIN_CONFIDENCE))
      return { blurred: found, confidence, box: found ? box : null }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Gemini detection failed')
    }
  }

  if (lastError) {
    console.warn('[plate-blur] Gemini detection fallback:', lastError.message)
  }

  return { blurred: false, confidence: null, box: null }
}

export async function blurLicensePlate(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; blurred: boolean; confidence: number | null }> {
  const detection = await detectLicensePlate(buffer, mimeType)
  if (!detection.blurred || !detection.box) {
    return { buffer, blurred: false, confidence: detection.confidence }
  }

  const image = sharp(buffer).rotate()
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0
  if (!width || !height) {
    return { buffer, blurred: false, confidence: detection.confidence }
  }

  const paddingX = detection.box.width * 0.35
  const paddingY = detection.box.height * 0.7
  const left = Math.max(0, Math.floor((detection.box.x - paddingX) * width))
  const top = Math.max(0, Math.floor((detection.box.y - paddingY) * height))
  const extractWidth = Math.min(width - left, Math.ceil((detection.box.width + paddingX * 2) * width))
  const extractHeight = Math.min(height - top, Math.ceil((detection.box.height + paddingY * 2) * height))

  if (extractWidth < 12 || extractHeight < 12 || left >= width || top >= height) {
    return { buffer, blurred: false, confidence: detection.confidence }
  }

  const source = await image.toBuffer()
  try {
    const blurredRegion = await sharp(source)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .blur(18)
      .toBuffer()

    const output = await sharp(source)
      .composite([{ input: blurredRegion, left, top }])
      .toBuffer()

    return { buffer: output, blurred: true, confidence: detection.confidence }
  } catch (error) {
    console.warn('[plate-blur] invalid extract area', { left, top, extractWidth, extractHeight, error })
    return { buffer, blurred: false, confidence: detection.confidence }
  }
}

export async function sanitizeListingStorageImage(params: {
  supabase: SupabaseClient
  storagePath: string
}) {
  const { data: fileData, error: downloadError } = await params.supabase.storage
    .from('vehicle-listings')
    .download(params.storagePath)

  if (downloadError || !fileData) {
    throw new Error(`Falha ao baixar imagem do storage: ${downloadError?.message || 'arquivo indisponível'}`)
  }

  const contentType = fileData.type || 'image/jpeg'
  const input = Buffer.from(await fileData.arrayBuffer())
  const sanitized = await blurLicensePlate(input, contentType)

  if (!sanitized.blurred) {
    return { blurred: false, confidence: sanitized.confidence }
  }

  const { error } = await params.supabase.storage
    .from('vehicle-listings')
    .update(params.storagePath, sanitized.buffer, {
      contentType,
      cacheControl: '3600',
    })

  if (error) {
    throw new Error(`Falha ao sobrescrever imagem sanitizada: ${error.message}`)
  }

  return { blurred: true, confidence: sanitized.confidence }
}
