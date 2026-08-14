import type { ListingsPageInput, TruckListingFilters } from '@/lib/marketplace-server'

export function buildTruckListingFilters(input: Omit<TruckListingFilters, 'vehicle_type'>): TruckListingFilters {
  return { ...input, vehicle_type: 'truck' }
}

export function buildTruckClientFilters(input: Partial<ListingsPageInput>): TruckListingFilters {
  return buildTruckListingFilters(input)
}
