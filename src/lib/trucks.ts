export type TruckCategory = 'toco' | 'truck' | 'bitruck' | 'cavalo_mecanico' | 'carreta' | 'outro'

export interface TruckData {
  truck_type: string | null
  load_capacity: number | null
  axles: number | null
  truck_body_type: string | null
  cabin_type: string | null
  pbt: number | null
  cmt: number | null
  truck_category: TruckCategory | null
  chassis: string | null
  structured_data: Record<string, unknown>
}

function first(input: Record<string, unknown>, keys: string[]): unknown {
  return keys.map((key) => input[key]).find((value) => value !== undefined && value !== null && value !== '')
}

function nullableString(value: unknown): string | null {
  return value === undefined || value === null || value === '' ? null : String(value)
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeCategory(value: unknown): TruckCategory | null {
  const normalized = String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (normalized.includes('bitruck') || normalized.includes('bi-truck')) return 'bitruck'
  if (normalized.includes('cavalo') || normalized.includes('mecanico')) return 'cavalo_mecanico'
  if (normalized.includes('carreta')) return 'carreta'
  if (normalized.includes('toco')) return 'toco'
  if (normalized === 'truck' || normalized.includes('caminhao')) return 'truck'
  if (normalized) return 'outro'
  return null
}

export function mapTruckPayload(input: Record<string, unknown>): {
  brand: string | null
  model: string | null
  yearManufacture: number | null
  yearModel: number | null
  truck: {
    category: TruckCategory | null
    axles: number | null
    loadCapacity: number | null
    pbt: number | null
    cmt: number | null
    structuredData: Record<string, unknown>
  }
} {
  const truck = normalizeTruckData(input)
  return {
    brand: nullableString(first(input, ['brand', 'marca'])),
    model: nullableString(first(input, ['model', 'modelo'])),
    yearManufacture: nullableNumber(first(input, ['yearManufacture', 'anoFabricacao'])),
    yearModel: nullableNumber(first(input, ['yearModel', 'anoModelo'])),
    truck: {
      category: truck.truck_category,
      axles: truck.axles,
      loadCapacity: truck.load_capacity,
      pbt: truck.pbt,
      cmt: truck.cmt,
      structuredData: truck.structured_data,
    },
  }
}

export function normalizeTruckData(input: Record<string, unknown>): TruckData {
  const knownKeys = new Set([
    'truck_type', 'truckType', 'tipoVeiculo', 'tipo', 'load_capacity', 'loadCapacity', 'capacidadeCarga',
    'axles', 'quantidadeEixos', 'eixos', 'truck_body_type', 'truckBodyType', 'tipoCarroceria',
    'cabin_type', 'cabinType', 'pbt', 'pesoBrutoTotal', 'cmt', 'capacidadeMaximaTracao',
    'truck_category', 'truckCategory', 'categoria', 'chassis', 'chassi',
  ])
  const structured_data = Object.fromEntries(Object.entries(input).filter(([key]) => !knownKeys.has(key)))
  return {
    truck_type: nullableString(first(input, ['truck_type', 'truckType', 'tipoVeiculo', 'tipo'])),
    load_capacity: nullableNumber(first(input, ['load_capacity', 'loadCapacity', 'capacidadeCarga'])),
    axles: nullableNumber(first(input, ['axles', 'quantidadeEixos', 'eixos'])),
    truck_body_type: nullableString(first(input, ['truck_body_type', 'truckBodyType', 'tipoCarroceria'])),
    cabin_type: nullableString(first(input, ['cabin_type', 'cabinType', 'cabine'])),
    pbt: nullableNumber(first(input, ['pbt', 'pesoBrutoTotal'])),
    cmt: nullableNumber(first(input, ['cmt', 'capacidadeMaximaTracao'])),
    truck_category: normalizeCategory(first(input, ['truck_category', 'truckCategory', 'categoria', 'tipoVeiculo', 'tipo'])),
    chassis: nullableString(first(input, ['chassis', 'chassi'])),
    structured_data,
  }
}
