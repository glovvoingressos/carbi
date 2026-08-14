export interface TruckFormData {
  vehicle_type: 'truck'
  truck_type: string
  load_capacity: string
  axles: string
  truck_body_type: string
  cabin_type: string
  pbt: string
  cmt: string
  truck_category: string
  structured_data: Record<string, unknown>
  fipeAvailable: boolean
}

export function mapTruckPlateResult(data: Record<string, unknown>): TruckFormData {
  const structuredData = { ...(data.structured_data as Record<string, unknown> | undefined), ...data }
  return {
    vehicle_type: 'truck',
    truck_type: String(data.truck_type ?? data.tipoVeiculo ?? ''),
    load_capacity: String(data.load_capacity ?? data.capacidadeCarga ?? ''),
    axles: String(data.axles ?? data.quantidadeEixos ?? ''),
    truck_body_type: String(data.truck_body_type ?? data.tipoCarroceria ?? ''),
    cabin_type: String(data.cabin_type ?? data.cabine ?? ''),
    pbt: String(data.pbt ?? ''),
    cmt: String(data.cmt ?? ''),
    truck_category: String(data.truck_category ?? data.categoria ?? ''),
    structured_data: structuredData,
    fipeAvailable: data.fipePrice != null || data.fipe_price != null,
  }
}

export function truckFipeMessage(fipeAvailable: boolean): string | null {
  return fipeAvailable ? null : 'FIPE não disponível'
}

export function isFipeRequiredForListing(vehicleType: 'car' | 'truck'): boolean {
  return vehicleType === 'car'
}

export function buildTruckListingPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (payload.vehicle_type !== 'truck') return payload
  return {
    ...payload,
    vehicle_type: 'truck',
    truck_type: payload.truck_type || null,
    load_capacity: payload.load_capacity == null || payload.load_capacity === '' ? null : Number(payload.load_capacity),
    axles: payload.axles == null || payload.axles === '' ? null : Number(payload.axles),
    truck_body_type: payload.truck_body_type || null,
    structured_data: { ...((payload.structured_data as Record<string, unknown>) || {}) },
    fipe_price: payload.fipe_price ?? null,
  }
}
