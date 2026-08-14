import { criteriaSchema, CarCriteria, emptyCriteria } from './types'
import { Vocabulary } from './vocabulary'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function interpretWithLLM(query: string, vocabulary: Vocabulary): Promise<CarCriteria> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY não configurada')
  }

  const brandList = [...new Set(vocabulary.brands)].slice(0, 150).join(', ')
  const modelHint = Object.entries(vocabulary.modelsByBrand).slice(0, 12)
    .map(([brand, models]) => `${brand}: ${models.slice(0, 15).join(', ')}`)
    .join('\n')

  const system = `Você é um consultor de compra de carros seminovos do Brasil.
Dado o pedido do usuário, extraia critérios estruturados de busca.
Responda APENAS com um objeto JSON válido, sem texto extra, seguindo EXATAMENTE este schema:
{
  "brand": string | null,
  "model": string | null,
  "version": string | null,
  "year_min": number | null,
  "year_max": number | null,
  "price_min": number | null,
  "price_max": number | null,
  "mileage_max": number | null,
  "transmission": "automatico" | "manual" | null,
  "fuel": "elétrico" | "híbrido" | "flex" | "gasolina" | "álcool" | "diesel" | null,
  "body_type": "SUV" | "Sedan" | "Hatch" | "Pickup" | "Esportivo" | "Coupe" | "Perua" | null,
  "city": string | null,
  "state": string | null,
  "optional_items": string[],
  "max_owners": number | null,
  "intent": string | null,
  "notes": string | null
}
Regras:
- Use apenas preços em reais (ex.: "até 200 mil" vira price_max: 200000; "a partir de 120 mil" vira price_min: 120000).
- NUNCA invente marca, modelo ou versão que não estejam no pedido (valores nulos quando ausentes).
- "2021 ou mais novo" => year_min: 2021. "até 2018" => year_max: 2018. "2013 a 2016" => year_min 2013, year_max 2016. Ano isolado "2015" => year_min 2015 (permita o ano seguinte, se aplicável).
- "carro econômico para família" SEM critérios concretos => brand null, model null, body_type null, price_max null, mas intent: "family", notes: "econômico".
- Campos indisponíveis => null (ou [] para arrays).`

  const user = `Marcas conhecidas: ${brandList}

Modelos (referência, use só se fizer sentido): 
${modelHint}

Pedido do usuário:
"""
${query}
"""

Extraia os critérios como JSON.`

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://carbi.com.br',
      'X-Title': 'Carbi - Consultor de Compra',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 400,
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('LLM sem conteúdo')

  const cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .trim()

  const json = JSON.parse(cleaned)
  const parsed = criteriaSchema.safeParse({ ...emptyCriteria, ...json })

  if (!parsed.success) {
    throw new Error('LLM retornou JSON fora do schema')
  }
  return parsed.data
}