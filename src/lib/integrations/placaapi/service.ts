import type { PlacaApiResponse, PlacaLookupResult } from './types'
import { getFipePrice } from '@/lib/fipe-api'

const REGCHECK_BASE = 'https://www.regcheck.org.uk/api/json.aspx'
const REGCHECK_USER = process.env.REGCHECK_USERNAME || ''
const REGCHECK_PASS = process.env.REGCHECK_API_KEY || ''

export async function lookupPlate(plate: string): Promise<PlacaLookupResult> {
  try {
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleanPlate.length !== 7) {
      return { success: false, error: 'Placa deve ter 7 caracteres (ABC1D23 ou ABC1234)' }
    }

    if (!REGCHECK_USER || !REGCHECK_PASS) {
      return { success: false, error: 'Credenciais da API não configuradas.' }
    }

    const auth = Buffer.from(`${REGCHECK_USER}:${REGCHECK_PASS}`).toString('base64')
    const response = await fetch(`${REGCHECK_BASE}/CheckBrazil/${cleanPlate}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: 'Placa não encontrada ou erro na consulta.' }
    }

    const data = await response.json()

    // Map RegCheck response to our format
    const vehicleData: PlacaApiResponse = {
      placa: cleanPlate,
      chassi: data.Vin || '',
      renavam: '',
      marca: data.CarMake?.CurrentTextValue || data.MakeDescription || '',
      modelo: data.CarModel?.CurrentTextValue || data.ModelDescription || '',
      anoFabricacao: parseInt(data.RegistrationYear) || 0,
      anoModelo: parseInt(data.RegistrationYear) || 0,
      cor: data.Colour || '',
      combustivel: data.Fuel || '',
      cilindradas: data.EngineSize?.CurrentTextValue || '',
      potencia: data.Power || '',
      cambio: data.Transmission?.CurrentTextValue || '',
      tipoVeiculo: data.Type || '',
      situacao: '',
      uf: data.Location?.split(', ')[1] || '',
      municipio: data.Location?.split(', ')[0] || '',
      cpfCnpjProprietario: '',
      nomeProprietario: '',
      dataAtualizacao: '',
    }

    // Fetch FIPE price after getting plate data
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

    return { success: true, data: vehicleData }
  } catch (error) {
    return { success: false, error: 'Erro ao consultar placa. Tente novamente.' }
  }
}
