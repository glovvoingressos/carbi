import { CarQuery } from 'car-query'

const carQuery = new CarQuery()

export interface EnhancedCarDetails {
  horsepower?: number
  torque?: number
  acceleration?: number
  topSpeed?: number
  weight?: number
  trunkCapacity?: number
}

export async function getEnhancedSpecs(make: string, model: string, year: number = 2026): Promise<EnhancedCarDetails | null> {
  try {
    const searchYear = year > 2025 ? 2025 : year
    
    // 1. Get models for the make/year
    const models = await carQuery.getModels({ year: searchYear, make: make.toLowerCase() })
    const matchedModel = models.find(m => m.model_name.toLowerCase().includes(model.toLowerCase()))
    
    if (!matchedModel) return null

    // 2. Get trims for that model
    const trims = await carQuery.getTrims({ year: searchYear, make: make.toLowerCase(), model: matchedModel.model_name })
    if (trims.length === 0) return null

    // 3. Get details for the first/best trim
    // For now, we take the first trim as a reference
    // In a more advanced version, we could match the version name
    const detail = await carQuery.getModelDetail(parseInt(trims[0].model_id))
    
    return {
      horsepower: parseInt(detail.model_hp) || undefined,
      torque: parseInt(detail.model_torque_nm) || undefined,
      weight: parseInt(detail.model_weight_kg) || undefined,
      transmission: detail.model_transmission_type || undefined,
      drive: detail.model_drive || undefined
    }
  } catch (error) {
    console.error('CarQuery enrichment error:', error)
    return null
  }
}
