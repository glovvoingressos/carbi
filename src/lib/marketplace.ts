import type { FipeResult } from '@/lib/fipe-api'
import type { TruckCategory } from '@/lib/trucks'
import { formatBRL } from '@/data/cars'

export const LISTING_MAX_IMAGES = 10
export const LISTING_MAX_IMAGE_SIZE_MB = 10
export const LISTING_MAX_IMAGE_SIZE_BYTES = LISTING_MAX_IMAGE_SIZE_MB * 1024 * 1024
export const LISTING_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** URL pública do anúncio: caminhões têm detalhe próprio em /caminhoes. */
export function publicListingPath(listing: { slug: string; vehicle_type?: string | null }): string {
  return listing.vehicle_type === 'truck'
    ? `/caminhoes/anuncio/${listing.slug}`
    : `/anuncios/${listing.slug}`
}

export function normalizePlateFinal(value: string | null | undefined): string | null {
  const normalized = String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return normalized ? normalized.slice(-1) : null
}

const SENSITIVE_STRUCTURED_KEYS = new Set([
  'placa',
  'plate',
  'placa_final',
  'plate_final',
  'renavam',
  'cpf',
  'cnpj',
  'cpf_cnpj',
  'cpfcnpj',
  'cpfcnpjproprietario',
  'nomeproprietario',
  'nome_proprietario',
  'proprietario',
  'documento',
  'document',
])

function sanitizeStructuredValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeStructuredValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_STRUCTURED_KEYS.has(key.toLowerCase()))
      .map(([key, item]) => [key, sanitizeStructuredValue(item)]),
  )
}

/**
 * Remove dados pessoais/identificadores que nunca devem ir para
 * `structured_data`/`technical_data` (ex.: placa completa vinda da consulta).
 */
export function sanitizeListingStructuredData(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeStructuredValue(value)
  return sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)
    ? sanitized as Record<string, unknown>
    : {}
}

export interface PlateFipeLookupInput {
  brand: string
  model: string
  yearModel: number
  fuel: string
  plate?: string
  fipePrice?: number | null
  fipeReference?: string | null
}

export function buildFipeResultFromPlateLookup(input: PlateFipeLookupInput): FipeResult | null {
  if (!input.fipePrice || input.fipePrice <= 0) return null

  return {
    price: formatBRL(input.fipePrice),
    brand: input.brand,
    model: input.model,
    modelYear: input.yearModel,
    fuel: input.fuel,
    codeFipe: `plate-${normalizePlateFinal(input.plate) || 'lookup'}`,
    referenceMonth: input.fipeReference || '',
    vehicleType: 1,
    fuelAcronym: '',
  }
}

export function getListingImageRejection(
  file: Pick<File, 'type' | 'size'>,
  currentCount: number,
): string | null {
  if (currentCount >= LISTING_MAX_IMAGES) return `Você pode adicionar até ${LISTING_MAX_IMAGES} imagens.`
  if (!LISTING_ALLOWED_TYPES.includes(file.type)) return 'Use imagens JPG, PNG ou WEBP.'
  if (file.size > LISTING_MAX_IMAGE_SIZE_BYTES) return `Cada imagem deve ter no máximo ${LISTING_MAX_IMAGE_SIZE_MB} MB.`
  return null
}

export interface ListingImageInput {
  storage_path: string
  public_url: string
  sort_order: number
  is_primary: boolean
}

export interface ListingFormPayload {
  title: string
  description: string
  vehicle_type: 'car' | 'truck'
  brand: string
  model: string
  version?: string
  year: number
  year_model: number
  mileage: number
  price: number
  transmission: string
  fuel: string
  color: string
  body_type: string
  city: string
  state: string
  optional_items: string[]
  engine?: string
  horsepower?: number | null
  plate_final?: string
  /** Placa completa: usada apenas para o cofre privado, nunca publicada. */
  plate?: string | null
  doors?: number | null
  vin?: string | null
  fipe_brand_code?: string
  fipe_model_code?: string
  fipe_year_code?: string
  fipe_reference_month?: string
  fipe_price?: number | null
  structured_data?: Record<string, unknown>
  // Truck-specific fields
  truck_type?: string | null
  load_capacity?: number | null
  axles?: number | null
  truck_body_type?: string | null
  cabin_type?: string | null
  pbt?: number | null
  cmt?: number | null
  truck_category?: TruckCategory | null
  chassis?: string | null
}

export interface ListingPublic {
  id: string
  user_id: string
  vehicle_id?: string | null
  title: string
  description: string
  vehicle_type: 'car' | 'truck'
  brand: string
  model: string
  version: string | null
  year: number
  year_model: number
  mileage: number
  price: number
  transmission: string | string[]
  fuel: string
  color: string
  body_type: string
  city: string
  state: string
  optional_items: string[]
  engine: string | null
  horsepower: number | null
  plate_final: string | null
  doors: number | null
  vin?: string | null
  fipe_price: number | null
  fipe_difference_value: number | null
  fipe_difference_percent: number | null
  fipe_reference_month: string | null
  status: 'draft' | 'active' | 'sold' | 'archived' | 'paused' | string
  slug: string
  published_at: string | null
  created_at: string
  updated_at: string
  price_updated_at?: string | null
  category?: string | null
  badges?: Array<{
    key: 'new' | 'price_drop' | 'below_fipe' | 'opportunity'
    label: string
  }>
  listed_since?: string
  price_updated_since?: string | null
  price_history?: {
    has_changes: boolean
    changes_last_30d: number
    last_old_price: number | null
    last_new_price: number | null
    last_changed_at: string | null
  } | null
  images: Array<{
    id: string
    url: string
    sort_order: number
    is_primary: boolean
  }> | null
  // Truck-specific fields
  truck_type?: string | null
  load_capacity?: number | null
  axles?: number | null
  truck_body_type?: string | null
  cabin_type?: string | null
  pbt?: number | null
  cmt?: number | null
  truck_category?: TruckCategory | null
  chassis?: string | null
  // Negotiation settings
  accepts_offers?: boolean
  negotiable?: 'open' | 'low' | 'firm'
  accepts_counter?: boolean
  accepts_trade?: boolean
  // View tracking
  view_count?: number
}

export type ListingPriceReview = {
  ratio: number
  differencePercent: number
  direction: 'above' | 'below'
  reason: string
}

/** Flags only large deviations; smaller differences remain visible for normal negotiation. */
export function getListingPriceReview(price: number | string, fipePrice: number | string | null | undefined): ListingPriceReview | null {
  const numericPrice = typeof price === 'number' ? price : Number(price)
  const numericFipe = typeof fipePrice === 'number' ? fipePrice : Number(fipePrice)
  if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericFipe) || numericFipe <= 0) return null
  const ratio = numericPrice / numericFipe
  if (ratio <= 5 && ratio >= 0.2) return null
  const direction = ratio > 5 ? 'above' : 'below'
  const differencePercent = Math.abs((ratio - 1) * 100)
  const directionLabel = direction === 'above' ? 'acima' : 'abaixo'
  return {
    ratio,
    differencePercent,
    direction,
    reason: `O preço anunciado está ${differencePercent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% ${directionLabel} da referência FIPE. O anúncio foi ocultado para revisão.`,
  }
}

export function parseMoneyInputToNumber(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseBrazilianInt(value: string | number): number {
  if (typeof value === 'number') return Math.round(value)
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

export function formatBrazilianInt(value: number | string | null | undefined): string {
  if (value == null) return ''
  const num = typeof value === 'string' ? parseBrazilianInt(value) : value
  if (!num) return ''
  return num.toLocaleString('pt-BR')
}

export function normalizeOptionalItems(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30)
}

export function parseFipePriceToNumber(priceLabel: string): number {
  const normalized = priceLabel.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Resolve o snapshot FIPE que fica gravado no anúncio.
 *
 * A consulta do servidor é a fonte principal, mas a FIPE é um serviço externo
 * sujeito a rate limit (429) e indisponibilidade. Nesses casos, usamos o valor
 * que o formulário já consultou no navegador (`fipe_price` do payload) para
 * não perder o comparativo na página do anúncio.
 */
export function resolveListingFipeSnapshot(input: {
  vehicleType: 'car' | 'truck'
  fipeResult?: FipeResult | null
  clientPrice?: number | null
  clientReferenceMonth?: string | null
}): { price: number | null; referenceMonth: string | null } {
  const clientPrice = typeof input.clientPrice === 'number' && input.clientPrice > 0
    ? input.clientPrice
    : null

  if (input.vehicleType === 'truck') {
    return { price: clientPrice, referenceMonth: input.clientReferenceMonth || null }
  }

  const serverPrice = input.fipeResult ? parseFipePriceToNumber(input.fipeResult.price) || null : null
  return {
    price: serverPrice || clientPrice,
    referenceMonth: input.fipeResult?.referenceMonth || input.clientReferenceMonth || null,
  }
}

export function getFipeComparison(
  listingPrice: number,
  fipePrice: number | null,
): { diffValue: number | null; diffPercent: number | null; status: 'below' | 'near' | 'above' | 'unknown' } {
  if (!fipePrice || fipePrice <= 0) {
    return { diffValue: null, diffPercent: null, status: 'unknown' }
  }

  const diffValue = listingPrice - fipePrice
  const diffPercent = (diffValue / fipePrice) * 100

  let status: 'below' | 'near' | 'above' = 'near'
  if (diffPercent <= -3) status = 'below'
  if (diffPercent >= 3) status = 'above'

  return { diffValue, diffPercent, status }
}

export function normalizeTruckPayload(payload: Partial<ListingFormPayload>): Record<string, unknown> {
  if (payload.vehicle_type !== 'truck') return {}

  const truckFields = ['truck_type', 'load_capacity', 'axles', 'truck_body_type'] as const
  const dedicatedFields = ['cabin_type', 'pbt', 'cmt', 'truck_category'] as const
  const structuredFields = ['chassis'] as const
  const normalized: Record<string, unknown> = { vehicle_type: 'truck' }

  for (const field of truckFields) {
    if (field in payload) normalized[field] = payload[field] ?? null
  }

  const additionalFields = [...dedicatedFields, ...structuredFields]
  if ('structured_data' in payload || additionalFields.some((field) => field in payload)) {
    normalized.structured_data = {
      ...(payload.structured_data || {}),
      ...Object.fromEntries(additionalFields.filter((field) => field in payload).map((field) => [field, payload[field] ?? null])),
    }
  }

  for (const field of dedicatedFields) {
    if (field in payload) normalized[field] = payload[field] ?? null
  }

  return normalized
}

export function buildListingRollbackPayload(
  previousListing: Record<string, unknown>,
  appliedUpdates: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(Object.keys(appliedUpdates).map((field) => [field, previousListing[field]]))
}

export function resolveTruckPatch(
  payload: Partial<ListingFormPayload>,
  currentVehicleType: 'car' | 'truck',
): { updates: Record<string, unknown>; error: string | null } {
  if (payload.vehicle_type && payload.vehicle_type !== currentVehicleType) {
    return { updates: {}, error: 'Não é permitido alterar o tipo do veículo.' }
  }

  const effectiveType = payload.vehicle_type || currentVehicleType
  if (effectiveType !== 'truck') return { updates: {}, error: null }

  const updates = normalizeTruckPayload({ ...payload, vehicle_type: 'truck' })
  const truckPayload = { ...payload, vehicle_type: 'truck' } as ListingFormPayload
  const errors = validateListingPayload(truckPayload)
  const truckErrors = errors.filter((error) => /^(load_capacity|axles|pbt|cmt) inválido\.$/.test(error))
  return { updates, error: truckErrors[0] || null }
}

export function validateListingPayload(payload: ListingFormPayload): string[] {
  const errors: string[] = []

  if (!['car', 'truck'].includes(payload.vehicle_type)) errors.push('Tipo de veículo inválido.')
  if (payload.vehicle_type === 'truck') {
    const numericTruckFields: Array<[string, number | null | undefined]> = [
      ['load_capacity', payload.load_capacity],
      ['axles', payload.axles],
      ['pbt', payload.pbt],
      ['cmt', payload.cmt],
    ]
    for (const [field, value] of numericTruckFields) {
      if (value != null && (!Number.isFinite(value) || value < 0)) errors.push(`${field} inválido.`)
    }
  }

  if (!payload.brand?.trim()) errors.push('Marca é obrigatória.')
  if (!payload.model?.trim()) errors.push('Modelo é obrigatório.')
  if (!payload.transmission?.trim()) errors.push('Câmbio é obrigatório.')
  if (!payload.fuel?.trim()) errors.push('Combustível é obrigatório.')
  if (!payload.color?.trim()) errors.push('Cor é obrigatória.')
  if (!payload.city?.trim()) errors.push('Cidade é obrigatória.')
  if (!/^[A-Za-z]{2}$/.test(payload.state || '')) errors.push('Estado deve conter 2 letras.')
  if (!Number.isFinite(payload.year) || payload.year < 1950 || payload.year > 2100) errors.push('Ano inválido.')
  if (!Number.isFinite(payload.year_model) || payload.year_model < 1950 || payload.year_model > 2100) errors.push('Ano/modelo inválido.')
  if (!Number.isFinite(payload.mileage) || payload.mileage < 0) errors.push('Quilometragem inválida.')
  if (!Number.isFinite(payload.price) || payload.price <= 0) errors.push('Preço inválido.')
  if (payload.vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(payload.vin.trim().toUpperCase())) {
    errors.push('VIN inválido. Use 17 caracteres válidos.')
  }

  return errors
}

export function safeSanitizeMessage(message: string): string {
  let cleaned = message.replace(/[\r\n\t]+/g, ' ').trim()
  cleaned = cleaned.replace(/\s{2,}/g, ' ')
  cleaned = cleaned.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[email oculto]')
  cleaned = cleaned.replace(/(\+?55\s?)?(\(?\d{2}\)?\s?)?(9?\d{4})[-\s]?(\d{4})/gi, '[telefone oculto]')
  cleaned = cleaned.replace(/wa\.me\/\S+|t\.me\/\S+|instagram\.com\/\S+|facebook\.com\/\S+/gi, '[contato externo removido]')
  return cleaned.slice(0, 2000)
}

export function buildFipeSnapshot(result: FipeResult | null): {
  fipe_price?: number | null
  fipe_reference_month?: string
} {
  if (!result) {
    return {
      fipe_price: null,
    }
  }

  return {
    fipe_price: parseFipePriceToNumber(result.price),
    fipe_reference_month: result.referenceMonth,
  }
}
