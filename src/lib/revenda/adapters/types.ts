export interface VehicleImportAdapter {
  name: string
  fetchVehicles(credentials: DealerCredentials): Promise<VehicleImportRow[]>
}

export interface VehicleImportRow {
  brand: string
  model: string
  year: number
  year_model?: number
  version?: string
  price: number
  mileage: number
  color?: string
  fuel?: string
  transmission?: string
  city?: string
  state?: string
  plate?: string
  description?: string
  images?: string[]
}

export interface DealerCredentials {
  apiUrl: string
  apiKey: string
  dealerId: string
}

export interface SpreadsheetColumn {
  index: number
  header: string
  mappedTo?: string
}

export interface ImportJob {
  id: string
  user_id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  errors: any[]
  mapping: Record<string, string>
  created_at: string
  completed_at?: string
}
