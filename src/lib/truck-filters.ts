import type { ListingsPageInput, TruckListingFilters } from '@/lib/marketplace-server'
import { applyCityFilter } from '@/lib/city-filter'

/* ────────────────────────────────────────────────────────────
   Catálogo de carrocerias de caminhão

   O formulário grava o rótulo exato em `truck_body_type`
   (ex.: "Baú"), enquanto as URLs de SEO usam slugs (ex.: "bau").
   O filtro precisa enxergar os dois sem depender de acentuação —
   `ilike` não ignora acento, então cada carroceria lista as
   variações aceitas.
   ──────────────────────────────────────────────────────────── */
export const TRUCK_BODY_TYPES = [
  { slug: 'bau', label: 'Baú' },
  { slug: 'sider', label: 'Sider' },
  { slug: 'graneleiro', label: 'Graneleiro' },
  { slug: 'tanque', label: 'Tanque' },
  { slug: 'carga-seca', label: 'Carga seca' },
  { slug: 'bau-frigorifico', label: 'Baú frigorífico' },
  { slug: 'boiadeira', label: 'Boiadeira' },
  { slug: 'basculante', label: 'Basculante' },
  { slug: 'plataforma', label: 'Plataforma' },
  { slug: 'outra', label: 'Outra' },
]

const stripAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const fold = (value: string) =>
  stripAccents(value.toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * `truck_type` é gravado como slug pelo formulário de caminhão
 * (`truck`, `toco`, `bitruck`, `cavalo-mecanico`) mas a UI de filtros
 * envia rótulos (`Truck`, `Toco`, `Bitruck`, `Cavalo mecânico`).
 *
 * A comparação é **exata** de propósito: um `ilike '%truck%'` casaria
 * também com `bitruck` e misturaria as duas categorias.
 */
export function truckTypeAliases(value: string): string[] {
  const key = fold(value)
  const aliases: Record<string, string[]> = {
    truck: ['truck', 'Truck'],
    toco: ['toco', 'Toco'],
    bitruck: ['bitruck', 'Bitruck'],
    'cavalo-mecanico': ['cavalo-mecanico', 'Cavalo mecânico', 'Cavalo mecanico', 'cavalo mecanico'],
  }
  return [...new Set(aliases[key] || [value.trim()])]
}

/** Resolve slug/rótulo de carroceria para os valores gravados no banco. */
export function truckBodyTypeAliases(value: string): string[] {
  const key = fold(value)
  const entry = TRUCK_BODY_TYPES.find((body) => body.slug === key || fold(body.label) === key)
  if (!entry) return [value.trim()]
  return [...new Set([entry.label, stripAccents(entry.label), entry.slug])]
}

const TRUCK_TYPE_LABELS: Record<string, string> = {
  truck: 'Truck',
  toco: 'Toco',
  bitruck: 'Bitruck',
  'cavalo-mecanico': 'Cavalo mecânico',
}

/** Rótulo de exibição do filtro — aceita slug ou rótulo. */
export function truckTypeLabel(value: string): string {
  return TRUCK_TYPE_LABELS[fold(value)] || value
}

/** Rótulo de exibição da carroceria — aceita slug ou rótulo. */
export function truckBodyTypeLabel(value: string): string {
  const key = fold(value)
  return TRUCK_BODY_TYPES.find((body) => body.slug === key || fold(body.label) === key)?.label || value
}

function applyTruckTypeFilter(query: any, value: string | string[]): any {
  const values = expandTruckTypeValues(value)
  return values.length > 0 ? query.in('truck_type', values) : query
}

function applyTruckBodyFilter(query: any, value: string | string[]): any {
  const values = expandTruckBodyTypeValues(value)
  return values.length > 0 ? query.in('truck_body_type', values) : query
}

/** Expande um ou mais valores de tipo de caminhão para os valores gravados. */
export function expandTruckTypeValues(value: string | string[]): string[] {
  const values = (Array.isArray(value) ? value : [value]).flatMap(truckTypeAliases).filter(Boolean)
  return [...new Set(values)]
}

/** Expande um ou mais valores de carroceria para os valores gravados. */
export function expandTruckBodyTypeValues(value: string | string[]): string[] {
  const values = (Array.isArray(value) ? value : [value]).flatMap(truckBodyTypeAliases).filter(Boolean)
  return [...new Set(values)]
}

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
  if (input.truckType) result = applyTruckTypeFilter(result, input.truckType)
  if (input.truckBodyType) result = applyTruckBodyFilter(result, input.truckBodyType)
  if (input.axles != null) result = Array.isArray(input.axles) ? result.in('axles', input.axles) : result.eq('axles', input.axles)
  if (input.loadCapacityMin != null) result = result.gte('load_capacity', input.loadCapacityMin)
  if (input.loadCapacityMax != null) result = result.lte('load_capacity', input.loadCapacityMax)
  result = applyCityFilter(result, input.city)
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
  for (const [key, value] of [['brand', input.brand], ['model', input.model], ['truck_type', input.truckType], ['truck_body_type', input.truckBodyType], ['transmission', input.transmission], ['city', input.city]] as const) {
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
