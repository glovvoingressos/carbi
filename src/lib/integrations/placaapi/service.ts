import type { PlacaApiResponse, PlacaLookupResult } from './types'

const PLACA_API_BASE = 'https://wdapi2.com.br/consulta/placa'
const PLACA_API_TOKEN = process.env.PLACA_API_TOKEN || '55fd95285b8689b5c643b902c6c82beb'

export async function lookupPlate(plate: string): Promise<PlacaLookupResult> {
  try {
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleanPlate.length !== 7) {
      return { success: false, error: 'Placa deve ter 7 caracteres (ABC1D23 ou ABC1234)' }
    }

    const response = await fetch(`${PLACA_API_BASE}/${cleanPlate}?token=${PLACA_API_TOKEN}`)
    const data = await response.json()

    if (data.message) {
      return { success: false, error: data.message }
    }

    return { success: true, data: data as PlacaApiResponse }
  } catch (error) {
    return { success: false, error: 'Erro ao consultar placa. Tente novamente.' }
  }
}
