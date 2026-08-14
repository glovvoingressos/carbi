import type { ListingsPageInput, TruckListingFilters } from '@/lib/marketplace-server'

export function buildTruckListingFilters(input: Omit<TruckListingFilters, 'vehicle_type'>): TruckListingFilters {
  return { ...input, vehicle_type: 'truck' }
}

export function buildTruckClientFilters(input: Partial<ListingsPageInput>): TruckListingFilters {
  return buildTruckListingFilters(input)
}

export function clearTruckListingFilters(): TruckListingFilters {
  return { vehicle_type: 'truck' }
}

export function applyTruckQueryFilters(query: any, input: TruckListingFilters): any {
  let result = query
  if (input.vehicle_type) result = result.eq('vehicle_type', input.vehicle_type)
  if (input.truckType) result = Array.isArray(input.truckType) ? result.in('truck_type', input.truckType) : result.ilike('truck_type', `%${input.truckType}%`)
  if (input.axles != null) result = Array.isArray(input.axles) ? result.in('axles', input.axles) : result.eq('axles', input.axles)
  if (input.loadCapacityMin != null) result = result.gte('load_capacity', input.loadCapacityMin)
  if (input.loadCapacityMax != null) result = result.lte('load_capacity', input.loadCapacityMax)
  if (input.city) result = Array.isArray(input.city) ? result.in('city', input.city) : result.ilike('city', input.city)
  if (input.state) result = result.eq('state', input.state)
  if (input.transmission) result = Array.isArray(input.transmission) ? result.in('transmission', input.transmission) : result.ilike('transmission', `%${input.transmission}%`)
  if (input.mileageMin != null) result = result.gte('mileage', input.mileageMin)
  if (input.mileageMax != null) result = result.lte('mileage', input.mileageMax)
  return result
}

export function serializeTruckListingFilters(input: TruckListingFilters): URLSearchParams {
  const params = new URLSearchParams()
  params.set('vehicle_type', 'truck')
  if (input.q) params.set('q', input.q)
  for (const [key, value] of [['brand', input.brand], ['model', input.model], ['truck_type', input.truckType], ['transmission', input.transmission], ['city', input.city]] as const) {
    if (Array.isArray(value)) value.forEach(item => params.append(key, String(item)))
    else if (value) params.set(key, String(value))
  }
  if (input.state) params.set('state', input.state)
  if (Array.isArray(input.axles)) input.axles.forEach(value => params.append('axles', String(value)))
  else if (input.axles != null) params.set('axles', String(input.axles))
  if (input.mileageMin != null) params.set('mileage_min', String(input.mileageMin))
  if (input.mileageMax != null) params.set('mileage_max', String(input.mileageMax))
  if (input.loadCapacityMin != null) params.set('load_capacity_min', String(input.loadCapacityMin))
  if (input.loadCapacityMax != null) params.set('load_capacity_max', String(input.loadCapacityMax))
  return params
}
