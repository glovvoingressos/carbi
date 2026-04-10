import { JsonValue, VehicleEnrichment } from '@/lib/integrations/autoDev/types'

export interface VehicleEnrichmentRow {
  id?: string
  vehicle_id: string
  source: string
  vin: string | null
  identity: JsonValue
  powertrain: JsonValue
  efficiency: JsonValue
  dimensions: JsonValue
  appearance: JsonValue
  features: JsonValue
  photos: JsonValue
  recalls: JsonValue
  raw: JsonValue | null
  fetch_status: string
  fetch_error: string | null
  fetched_at: string
  updated_at?: string
}

export function toVehicleEnrichmentUpsertPayload(
  enrichment: VehicleEnrichment,
  status: 'success' | 'partial' | 'failed',
  fetchError: string | null,
): VehicleEnrichmentRow {
  return {
    vehicle_id: enrichment.vehicleId,
    source: enrichment.source,
    vin: enrichment.vin,
    identity: enrichment.identity as JsonValue,
    powertrain: enrichment.powertrain as JsonValue,
    efficiency: enrichment.efficiency as JsonValue,
    dimensions: enrichment.dimensions as JsonValue,
    appearance: enrichment.appearance as JsonValue,
    features: enrichment.features as JsonValue,
    photos: enrichment.photos as JsonValue,
    recalls: enrichment.recalls as JsonValue,
    raw: enrichment.raw,
    fetch_status: status,
    fetch_error: fetchError,
    fetched_at: enrichment.fetchedAt,
  }
}

export function fromVehicleEnrichmentRow(row: VehicleEnrichmentRow): VehicleEnrichment {
  return {
    vehicleId: row.vehicle_id,
    vin: row.vin,
    source: 'auto_dev',
    sourceVersion: null,
    identity: (row.identity || {}) as VehicleEnrichment['identity'],
    powertrain: (row.powertrain || {}) as VehicleEnrichment['powertrain'],
    efficiency: (row.efficiency || {}) as VehicleEnrichment['efficiency'],
    dimensions: (row.dimensions || {}) as VehicleEnrichment['dimensions'],
    appearance: (row.appearance || { exteriorColors: [], interiorColors: [] }) as VehicleEnrichment['appearance'],
    features: (row.features || {
      comfort: [],
      technology: [],
      safety: [],
      convenience: [],
      other: [],
    }) as VehicleEnrichment['features'],
    photos: (row.photos || {
      hero: null,
      gallery: [],
      interior: [],
      exterior: [],
      detail: [],
    }) as VehicleEnrichment['photos'],
    recalls: (row.recalls || { count: 0, items: [] }) as VehicleEnrichment['recalls'],
    raw: row.raw,
    fetchedAt: row.fetched_at,
    updatedAt: row.updated_at || row.fetched_at,
  }
}
