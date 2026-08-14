import { cars } from '@/data/cars'
import type { Vocabulary } from './types'

export type { Vocabulary } from './types'

export const STATE_BY_CODE: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

export const STATE_ALIASES: Record<string, string> = {
  'belo horizonte': 'belo horizonte', bh: 'belo horizonte', 'bh/mg': 'belo horizonte',
  'são paulo': 'são paulo', sp: 'são paulo', 'sao paulo': 'são paulo', 'capital paulista': 'são paulo',
  'rio de janeiro': 'rio de janeiro', rj: 'rio de janeiro', 'rio': 'rio de janeiro',
  'brasília': 'brasília', brasilia: 'brasília', df: 'brasília',
  curitiba: 'curitiba', 'porto alegre': 'porto alegre', salvador: 'salvador',
  fortaleza: 'fortaleza', recife: 'recife', goiânia: 'goiânia', goiania: 'goiânia',
  jf: 'juiz de fora', 'juiz de fora': 'juiz de fora', contagem: 'contagem', betim: 'betim',
}

export const BRAND_ALIASES: Record<string, string> = {
  audi: 'Audi',
  bmw: 'BMW',
  'mercedes': 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  'vw': 'Volkswagen',
  'volkswagen': 'Volkswagen',
  'volks': 'Volkswagen',
  'toyota': 'Toyota',
  'honda': 'Honda',
  'chevrolet': 'Chevrolet',
  'chevy': 'Chevrolet',
  'gm': 'Chevrolet',
  'ford': 'Ford',
  'fiat': 'Fiat',
  'renault': 'Renault',
  'nissan': 'Nissan',
  'hyundai': 'Hyundai',
  'kia': 'Kia',
  'kia motors': 'Kia',
  'peugeot': 'Peugeot',
  'citroen': 'Citroën',
  'citroën': 'Citroën',
  'volvo': 'Volvo',
  'jeep': 'Jeep',
  'mitsubishi': 'Mitsubishi',
  'subaru': 'Subaru',
  'suzuki': 'Suzuki',
  'jac': 'JAC',
  'chery': 'Chery',
  'caoa chery': 'CAOA Chery',
  'gwm': 'GWM',
  'haval': 'Haval',
  'ram': 'RAM',
  'porsche': 'Porsche',
  'lamborghini': 'Lamborghini',
  'ferrari': 'Ferrari',
  'maserati': 'Maserati',
  'land rover': 'Land Rover',
  'range rover': 'Land Rover',
  'mini': 'MINI',
  'jaguar': 'Jaguar',
  'lexus': 'Lexus',
  'byd': 'BYD',
  'geely': 'Geely',
  'renegade': 'Jeep',
  'compass': 'Jeep',
  'civic': 'Honda',
  'corolla': 'Toyota',
}

const BODY_ALIASES: Record<string, string> = {
  'suv': 'SUV',
  'utilitario esportivo': 'SUV',
  'utilitário esportivo': 'SUV',
  'sedan': 'Sedan',
  'sedã': 'Sedan',
  'hatch': 'Hatch',
  'hatchback': 'Hatch',
  'picape': 'Pickup',
  'pickup': 'Pickup',
  'pick-up': 'Pickup',
  'esportivo': 'Esportivo',
  'coupé': 'Coupe',
  'coupe': 'Coupe',
  'perua': 'Perua',
  'station wagon': 'Perua',
  'minivan': 'Minivan',
  'van': 'Van',
  'sport': 'Esportivo',
}

const FUEL_ALIASES: Record<string, string> = {
  'eletrico': 'elétrico',
  'elétrico': 'elétrico',
  'hibrido': 'híbrido',
  'híbrido': 'híbrido',
  'flex': 'flex',
  'gasolina': 'gasolina',
  'alcool': 'álcool',
  'álcool': 'álcool',
  'etanol': 'álcool',
  'diesel': 'diesel',
  'gnv': 'GNV',
}

const TRANSMISSION_ALIASES: Record<string, string> = {
  'automatico': 'automatico',
  'automático': 'automatico',
  'auto': 'automatico',
  'manual': 'manual',
}

const OPTIONAL_ALIASES: Record<string, string> = {
  'teto solar': 'teto solar',
  'teto-solar': 'teto solar',
  'bancos de couro': 'couro',
  'couro': 'couro',
  'carplay': 'carplay',
  'apple carplay': 'carplay',
  'android auto': 'android auto',
  'multimidia': 'multimídia',
  'multimídia': 'multimídia',
  'bluetooth': 'bluetooth',
  'camera de ré': 'câmera de ré',
  'câmera de ré': 'câmera de ré',
  'sensor de ré': 'sensor de ré',
  'xenon': 'xenôn',
  'led': 'led',
}

const INTENT_ALIASES: Record<string, string> = {
  'familia': 'family',
  'família': 'family',
  'primeiro carro': 'first_car',
  'trabalho': 'work',
  'uber': 'work',
  'app': 'work',
  'entrega': 'work',
  'viagem': 'travel',
  'viagens': 'travel',
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function normalizeBrand(value: string): string {
  return normalizeText(value || '')
}

export function normalizeModel(value: string): string {
  return normalizeText(value || '').replace(/[^a-z0-9 ]/g, ' ').trim().replace(/\s+/g, ' ')
}

export function resolveAliases(value: string): { brand: string | null, model: string | null } {
  const norm = normalizeText(value)
  const aliases = Object.keys(BRAND_ALIASES)
    .sort((a, b) => b.length - a.length) // longest first so "mercedes-benz" wins over "mercedes"
    .find((alias) => norm.includes(alias))
  return {
    brand: aliases ? BRAND_ALIASES[aliases] : null,
    model: aliases ? aliases : null,
  }
}

export function resolveBodyType(value: string): string | null {
  const norm = normalizeText(value)
  const key = Object.keys(BODY_ALIASES).sort((a, b) => b.length - a.length).find((alias) => norm.includes(alias))
  return key ? BODY_ALIASES[key] : null
}

export function resolveFuel(value: string): string | null {
  const norm = normalizeText(value)
  const key = Object.keys(FUEL_ALIASES).sort((a, b) => b.length - a.length).find((alias) => norm.includes(alias))
  return key ? FUEL_ALIASES[key] : null
}

export function resolveTransmission(value: string): string | null {
  const norm = normalizeText(value)
  const key = Object.keys(TRANSMISSION_ALIASES).sort((a, b) => b.length - a.length).find((alias) => norm.includes(alias))
  return key ? TRANSMISSION_ALIASES[key] : null
}

export function resolveOptional(value: string): string | null {
  const norm = normalizeText(value)
  const key = Object.keys(OPTIONAL_ALIASES).sort((a, b) => b.length - a.length).find((alias) => norm.includes(alias))
  return key ? OPTIONAL_ALIASES[key] : null
}

export function resolveIntent(value: string): string | null {
  const norm = normalizeText(value)
  const key = Object.keys(INTENT_ALIASES).sort((a, b) => b.length - a.length).find((alias) => norm.includes(alias))
  return key ? INTENT_ALIASES[key] : null
}

export function resolveCity(value: string): { city: string | null, state: string | null } {
  const norm = normalizeText(value)
  const stateMatch = norm.match(/\b([a-z]{2})\b/g)
  let state: string | null = null
  if (stateMatch) {
    const code = stateMatch.map((s) => s.toUpperCase()).find((s) => STATE_BY_CODE[s])
    if (code) state = code
  }
  let city: string | null = null
  const cityKey = Object.keys(STATE_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((alias) => norm.includes(alias))
  if (cityKey) {
    city = STATE_ALIASES[cityKey]
    if (!state) state = STATE_BY_CODE[city === 'belo horizonte' ? 'MG' : 'SP']
  }
  return { city, state }
}

let cachedVocabulary: {
  brands: string[]
  modelsByBrand: Record<string, string[]>
  fetchedAt: number
} | null = null

function catalogBrands(): { brands: string[], modelsByBrand: Record<string, string[]> } {
  const modelsByBrand: Record<string, string[]> = {}
  for (const car of cars) {
    const brand = car.brand.trim()
    if (!brand) continue
    if (!modelsByBrand[brand]) modelsByBrand[brand] = []
    const model = car.model.trim()
    if (model && !modelsByBrand[brand].includes(model)) modelsByBrand[brand].push(model)
  }
  return { brands: Object.keys(modelsByBrand), modelsByBrand }
}

export async function getVocabulary(): Promise<Vocabulary> {
  const now = Date.now()
  if (cachedVocabulary && now - cachedVocabulary.fetchedAt < 10 * 60 * 1000) {
    return { brands: cachedVocabulary.brands, modelsByBrand: cachedVocabulary.modelsByBrand }
  }

  const catalog = catalogBrands()
  const brands = new Set(catalog.brands)
  const modelsByBrand: Record<string, string[]> = { ...catalog.modelsByBrand }

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase-server')
    const { isSupabaseConfigured } = await import('@/lib/supabase-server')
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseServerClient()
      const { data: rows } = await supabase
        .from('vehicle_listings_public')
        .select('brand, model')
        .limit(5000)
      if (rows) {
        for (const row of rows) {
          const brand = (row.brand || '').trim()
          const model = (row.model || '').trim()
          if (!brand) continue
          brands.add(brand)
          if (model && !(modelsByBrand[brand] || []).includes(model)) {
            modelsByBrand[brand] = [...(modelsByBrand[brand] || []), model]
          }
        }
      }
    }
  } catch (error) {
    console.warn('buyer-agent: falha ao montar vocabulário com anúncios:', error)
  }

  cachedVocabulary = { brands: [...brands], modelsByBrand, fetchedAt: now }
  return { brands: cachedVocabulary.brands, modelsByBrand: cachedVocabulary.modelsByBrand }
}

export function getStaticVocabulary(): Vocabulary {
  const catalog = catalogBrands()
  return { brands: Object.keys(BRAND_ALIASES).map((k) => BRAND_ALIASES[k]), modelsByBrand: catalog.modelsByBrand }
}