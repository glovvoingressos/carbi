export interface CarImageAnalysis {
  brand: string | null
  model: string | null
  year: number | null
  color: string | null
  bodyStyle: string | null
  condition: 'excelente' | 'bom' | 'regular' | 'ruim' | null
  mileage: string | null
  features: string[]
  description: string
  confidence: number
}

export interface FormAssistance {
  suggestedTitle: string
  suggestedDescription: string
  suggestedPrice: number | null
  suggestedCategory: string
  detectedFeatures: string[]
  warnings: string[]
}

export interface DocumentExtraction {
  type: string
  data: Record<string, string>
}
