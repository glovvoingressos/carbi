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
  if (process.env.CARQUERY_ENABLED !== 'true') {
    return null
  }

  try {
    const searchYear = year > 2025 ? 2025 : year
    
    // 1. Get models for the make/year
    const models = (await carQuery.getModels({ year: searchYear, make: make.toLowerCase() })) as any[]
    const matchedModel = models.find((m: any) => {
      const modelName = String(m.model_name || m.modelName || '').toLowerCase()
      return modelName.includes(model.toLowerCase())
    })
    
    if (!matchedModel) return null

    // 2. Get trims for that model
    const matchedModelName = String(matchedModel.model_name || matchedModel.modelName || model)
    const trims = (await carQuery.getTrims({
      year: searchYear,
      make: make.toLowerCase(),
      model: matchedModelName,
    })) as any[]

    if (trims.length === 0) return null

    // 3. Get details for the first/best trim
    const detailId = Number(trims[0].model_id || trims[0].modelId || 0)
    if (!detailId) return null

    const detail = (await carQuery.getModelDetail(detailId)) as any
    
    return {
      horsepower: parseInt(String(detail.model_hp || detail.horsepower || '0'), 10) || undefined,
      torque: parseInt(String(detail.model_torque_nm || detail.torque || '0'), 10) || undefined,
      weight: parseInt(String(detail.model_weight_kg || detail.weight || '0'), 10) || undefined,
    }
  } catch {
    console.error('CarQuery enrichment error')
    return null
  }
}
