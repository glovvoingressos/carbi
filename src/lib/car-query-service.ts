export interface EnhancedCarDetails {
  horsepower?: number
  torque?: number
  acceleration?: number
  topSpeed?: number
  weight?: number
  trunkCapacity?: number
}

export async function getEnhancedSpecs(make: string, model: string, year: number = 2026): Promise<EnhancedCarDetails | null> {
  void make
  void model
  void year
  return null
}
