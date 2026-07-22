import type { CarImageAnalysis, FormAssistance, DocumentExtraction } from './types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'nvidia/llama-3.2-11b-vision-instruct'

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY not configured')
  return key
}

async function callVision(prompt: string, imageBase64: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

function parseJsonResponse<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0]) as T
}

export async function analyzeCarImage(imageBase64: string): Promise<CarImageAnalysis> {
  const prompt = `Analise esta imagem de carro e retorne um JSON com:
{
  "brand": "marca do carro",
  "model": "modelo",
  "year": ano,
  "color": "cor",
  "bodyStyle": "tipo (hatch, sedan, SUV, etc)",
  "condition": "excelente/bom/regular/ruim",
  "mileage": "quilometragem estimada",
  "features": ["feature1", "feature2"],
  "description": "descrição em português",
  "confidence": 0.0 a 1.0
}
Retorne APENAS o JSON, sem texto adicional.`

  const text = await callVision(prompt, imageBase64)
  return parseJsonResponse<CarImageAnalysis>(text)
}

export async function generateListingFromImages(images: string[]): Promise<FormAssistance> {
  if (images.length === 0) throw new Error('At least one image required')

  const imageContents = images.slice(0, 4).map(img => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${img}` }
  }))

  const prompt = `Analise estas ${images.length} imagens de um carro e gere dados para anúncio de venda. Retorne um JSON:
{
  "suggestedTitle": "título chamativo para o anúncio",
  "suggestedDescription": "descrição detalhada do carro",
  "suggestedPrice": preço_sugerido_em_reais ou null,
  "suggestedCategory": "categoria (popular, executivo, esportivo, etc)",
  "detectedFeatures": ["feature1", "feature2"],
  "warnings": ["possível problema1"]
}
Retorne APENAS o JSON.`

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContents
        ]
      }],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  return parseJsonResponse<FormAssistance>(content)
}

export async function extractDataFromDocument(documentBase64: string): Promise<DocumentExtraction> {
  const prompt = `Extraia os dados deste documento automotivo (CRLV, nota fiscal, etc). Retorne um JSON:
{
  "type": "tipo do documento (CRLV, nota_fiscal, etc)",
  "data": {
    "campo1": "valor1",
    "campo2": "valor2"
  }
}
Extraia campos como: placa, chassi, proprietário, marca, modelo, ano, cor, RENAVAM, CPF/CNPJ.
Retorne APENAS o JSON.`

  const text = await callVision(prompt, documentBase64)
  return parseJsonResponse<DocumentExtraction>(text)
}

export type { CarImageAnalysis, FormAssistance, DocumentExtraction }
