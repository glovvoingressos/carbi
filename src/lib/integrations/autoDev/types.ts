export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface VehicleEnrichment {
  vehicleId: string
  vin: string | null
  source: 'auto_dev'
  sourceVersion: string | null

  identity: {
    make: string | null
    model: string | null
    year: number | null
    trim: string | null
    bodyType: string | null
    style: string | null
  }

  powertrain: {
    engine: string | null
    horsepower: number | null
    torque: number | null
    transmission: string | null
    drivetrain: string | null
    fuelType: string | null
  }

  efficiency: {
    cityMpg: number | null
    highwayMpg: number | null
    combinedMpg: number | null
    consumptionLabel: string | null
  }

  dimensions: {
    length: number | null
    width: number | null
    height: number | null
    wheelbase: number | null
    curbWeight: number | null
    seatingCapacity: number | null
    cargoCapacity: number | null
  }

  appearance: {
    exteriorColors: string[]
    interiorColors: string[]
  }

  features: {
    comfort: string[]
    technology: string[]
    safety: string[]
    convenience: string[]
    other: string[]
  }

  photos: {
    hero: string | null
    gallery: string[]
    interior: string[]
    exterior: string[]
    detail: string[]
  }

  recalls: {
    count: number
    items: Array<{
      title: string
      description: string | null
      remedy: string | null
      risk: string | null
      recallDate: string | null
      sourceLabel: string | null
    }>
  }

  raw: JsonValue | null
  fetchedAt: string
  updatedAt: string
}

export type AutoDevFetchStatus = 'success' | 'partial' | 'failed'

export interface AutoDevEndpointPayload {
  decode: unknown | null
  specs: unknown | null
  photos: unknown | null
  build: unknown | null
  recalls: unknown | null
  sourceVersion: string | null
}

export interface AutoDevRefreshResult {
  success: boolean
  status: AutoDevFetchStatus
  enrichment: VehicleEnrichment | null
  errors: string[]
  fromCache: boolean
}

export type AutoDevErrorCode =
  | 'NOT_CONFIGURED'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INVALID_RESPONSE'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR'

export interface AutoDevErrorDetails {
  code: AutoDevErrorCode
  message: string
  status?: number
  endpoint?: string
}
