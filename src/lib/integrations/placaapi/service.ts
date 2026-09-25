import { mapPlacaApiResponse, type PlacaApiResponse, type PlacaLookupResult } from './types'
import { sanitizeVehicleStructuredData } from '@/lib/marketplace'
import { parseFipeReferenceMonth } from '@/lib/fipe-refresh'

const PLACA_API_BASE = 'https://wdapi2.com.br/consulta'

function parsePositiveFipePrice(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const price = value.trim()
  if (!/^(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?$/.test(price)) return null
  const parsed = Number(price.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function lookupPlate(plate: string): Promise<PlacaLookupResult> {
  const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (cleanPlate.length !== 7) {
    return { success: false, failureKind: 'invalid-result', error: 'Placa deve ter 7 caracteres (ABC1D23 ou ABC1234)' }
  }

  const token = process.env.PLACA_API_TOKEN?.trim()
  if (!token) {
    return { success: false, failureKind: 'provider-error', error: 'Serviço de consulta indisponível. Tente novamente.' }
  }

  let response: Response
  try {
    response = await fetch(`${PLACA_API_BASE}/${cleanPlate}/${token}`)
  } catch {
    return { success: false, failureKind: 'network-error', error: 'Erro de rede ao consultar placa. Tente novamente.' }
  }

  if (!response.ok) {
    return response.status === 429
      ? { success: false, failureKind: 'rate-limited', error: 'Limite de consultas atingido. Tente novamente.' }
      : { success: false, failureKind: 'provider-error', error: 'Serviço de consulta indisponível. Tente novamente.' }
  }

  try {
    const data: unknown = await response.json()
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, failureKind: 'invalid-result', error: 'Nenhum resultado válido para a placa.' }
    }
    const raw = data as Record<string, unknown>

    if (raw.message) {
      return { success: false, failureKind: 'invalid-result', error: 'Nenhum resultado válido para a placa.' }
    }

    const vehicleData: PlacaApiResponse = mapPlacaApiResponse(raw, cleanPlate)
    if (!vehicleData.marca && !vehicleData.modelo) {
      return { success: false, failureKind: 'invalid-result', error: 'Nenhum resultado válido para a placa.' }
    }

    // Extract FIPE data - pick the best match (highest score)
    const fipeEntries = (raw.fipe as { dados?: unknown } | null)?.dados
    if (fipeEntries && Array.isArray(fipeEntries) && fipeEntries.length > 0) {
      // Sort by score descending to get best match
      const sorted = fipeEntries.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
        .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      const bestMatch = sorted[0]
      if (bestMatch) {
        const price = parsePositiveFipePrice(bestMatch.texto_valor)
        const reference = typeof bestMatch.mes_referencia === 'string' ? bestMatch.mes_referencia : null
        vehicleData.fipe_price = price && parseFipeReferenceMonth(reference) ? price : null
        vehicleData.fipe_reference_month = vehicleData.fipe_price ? reference : null
        vehicleData.fipe_code = typeof bestMatch.codigo_fipe === 'string' ? bestMatch.codigo_fipe : null
        vehicleData.fipe_model_name = typeof bestMatch.texto_modelo === 'string' ? bestMatch.texto_modelo : null
        vehicleData.fipe_brand_name = typeof bestMatch.texto_marca === 'string' ? bestMatch.texto_marca : null
      }
    }

    vehicleData.structured_data = sanitizeVehicleStructuredData(vehicleData.structured_data)

    return { success: true, data: vehicleData }
  } catch {
    return { success: false, failureKind: 'invalid-result', error: 'Resposta inválida da consulta. Tente novamente.' }
  }
}
