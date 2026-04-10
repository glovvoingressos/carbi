import { FipeResult } from '@/lib/fipe-api'

export const LISTING_MAX_IMAGES = 10
export const LISTING_MAX_IMAGE_SIZE_MB = 10
export const LISTING_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ListingImageInput {
  storage_path: string
  public_url: string
  sort_order: number
  is_primary: boolean
}

export interface ListingFormPayload {
  title: string
  description: string
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
  doors?: number | null
  vin?: string | null
  fipe_brand_code?: string
  fipe_model_code?: string
  fipe_year_code?: string
  fipe_reference_month?: string
  fipe_price?: number | null
  structured_data?: Record<string, unknown>
}

export interface ListingPublic {
  id: string
  user_id: string
  vehicle_id?: string | null
  title: string
  description: string
  brand: string
  model: string
  version: string | null
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
  images: Array<{
    id: string
    url: string
    sort_order: number
    is_primary: boolean
  }> | null
}

export function parseMoneyInputToNumber(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
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

export function validateListingPayload(payload: ListingFormPayload): string[] {
  const errors: string[] = []

  if (!payload.title || payload.title.trim().length < 8) errors.push('Título deve ter pelo menos 8 caracteres.')
  if (!payload.description || payload.description.trim().length < 20) errors.push('Descrição deve ter pelo menos 20 caracteres.')
  if (!payload.brand?.trim()) errors.push('Marca é obrigatória.')
  if (!payload.model?.trim()) errors.push('Modelo é obrigatório.')
  if (!payload.transmission?.trim()) errors.push('Câmbio é obrigatório.')
  if (!payload.fuel?.trim()) errors.push('Combustível é obrigatório.')
  if (!payload.color?.trim()) errors.push('Cor é obrigatória.')
  if (!payload.body_type?.trim()) errors.push('Carroceria é obrigatória.')
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
