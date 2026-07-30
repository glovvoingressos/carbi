import type { PlacaApiResponse, PlacaLookupResult } from './types'
import { getFipePrice } from '@/lib/fipe-api'

const PLACA_API_BASE = 'https://wdapi2.com.br/consulta'
const PLACA_API_TOKEN = process.env.PLACA_API_TOKEN || '55fd95285b8689b5c643b902c6c82beb'

export async function lookupPlate(plate: string): Promise<PlacaLookupResult> {
  try {
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleanPlate.length !== 7) {
      return { success: false, error: 'Placa deve ter 7 caracteres (ABC1D23 ou ABC1234)' }
    }

    const response = await fetch(`${PLACA_API_BASE}/${cleanPlate}/${PLACA_API_TOKEN}`)
    const data = await response.json()

    if (data.message) {
      return { success: false, error: data.message }
    }

    // Map API response to our format
    const extra = data.extra || {}
    const vehicleData: PlacaApiResponse = {
      placa: data.placa || cleanPlate,
      chassi: data.chassi || '',
      renavam: '',
      marca: data.marca || '',
      modelo: data.modelo || '',
      versao: data.VERSAO || '',
      anoFabricacao: parseInt(extra.ano_fabricacao || data.ano) || 0,
      anoModelo: parseInt(extra.ano_modelo || data.anoModelo) || 0,
      cor: data.cor || '',
      combustivel: extra.combustivel || '',
      cilindradas: extra.cilindradas || '',
      potencia: extra.potencia || extra.hp || '',
      cambio: extra.caixa_cambio || '',
      tipoVeiculo: extra.tipo_veiculo || '',
      situacao: data.situacao || '',
      uf: data.uf || extra.uf || '',
      municipio: data.municipio || extra.municipio || '',
      cpfCnpjProprietario: '',
      nomeProprietario: '',
      dataAtualizacao: data.data || '',
    }

    // Extract FIPE data - pick the best match (highest score)
    const fipeEntries = data.fipe?.dados
    if (fipeEntries && Array.isArray(fipeEntries) && fipeEntries.length > 0) {
      // Sort by score descending to get best match
      const sorted = [...fipeEntries].sort((a, b) => (b.score || 0) - (a.score || 0))
      const bestMatch = sorted[0]
      const priceStr = bestMatch.texto_valor || ''
      const priceNum = parseFloat(priceStr.replace(/[^\d,]/g, '').replace(',', '.'))
      vehicleData.fipe_price = priceNum || null
      vehicleData.fipe_reference_month = bestMatch.mes_referencia || null
    }

    // If no FIPE from API, try our own FIPE lookup
    if (!vehicleData.fipe_price && vehicleData.marca && vehicleData.modelo && vehicleData.anoModelo) {
      try {
        const fipeResult = await getFipePrice(vehicleData.marca, vehicleData.modelo, vehicleData.anoModelo)
        if (fipeResult) {
          const priceNum = parseFloat(fipeResult.price.replace(/[^\d,]/g, '').replace(',', '.'))
          vehicleData.fipe_price = priceNum || null
          vehicleData.fipe_reference_month = fipeResult.referenceMonth || null
        }
      } catch {
        // FIPE lookup failed, continue without it
      }
    }

    return { success: true, data: vehicleData }
  } catch (error) {
    return { success: false, error: 'Erro ao consultar placa. Tente novamente.' }
  }
}
