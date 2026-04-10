/**
 * FIPE API Integration Utility (Parallelum/Fipe Online)
 * Hierarquia obrigatória: tipo -> marca -> modelo -> ano -> versão(combustível)
 */

export interface FipeItem {
  name: string
  code: string
}

export interface FipeReference {
  name: string
  code: string
}

export interface FipeResult {
  vehicleType: number
  price: string
  brand: string
  model: string
  modelYear: number
  fuel: string
  codeFipe: string
  referenceMonth: string
  fuelAcronym: string
}

export interface FipeYearOption extends FipeItem {
  modelYear: number | null
  fuelType: string
  fuelCode: string | null
  isZeroKm: boolean
}

export interface FipeVersionOption {
  code: string
  name: string
  fuelType: string
  fuelCode: string | null
  modelYear: number
}

const BASE_URL = process.env.NEXT_PUBLIC_FIPE_API_BASE_URL || 'https://fipe.parallelum.com.br/api/v2'
const TOKEN = process.env.FIPE_API_TOKEN

const META_TTL_MS = 12 * 60 * 60 * 1000
const DETAIL_TTL_MS = 60 * 60 * 1000
const REFERENCE_TTL_MS = 6 * 60 * 60 * 1000

type CacheEntry = {
  expiresAt: number
  value: unknown
}

const responseCache = new Map<string, CacheEntry>()
let referencesCache: { expiresAt: number; items: FipeReference[] } | null = null

function normalize(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseYearNumber(name: string): number | null {
  const directYear = name.match(/\b(19\d{2}|20\d{2})\b/)
  if (directYear) {
    return parseInt(directYear[1], 10)
  }
  if (name.toLowerCase().includes('zero km') || parseInt(name, 10) === 32000) {
    return new Date().getFullYear()
  }
  return null
}

function parseFuelFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return 'Não informado'
  return parts.slice(1).join(' ')
}

function parseFuelCodeFromYearCode(code: string): string | null {
  const match = code.match(/-(\d+)$/)
  return match ? match[1] : null
}

function parseYearOptions(items: FipeItem[]): FipeYearOption[] {
  return items.map((item) => {
    const modelYear = parseYearNumber(item.name)
    const numericPrefix = parseInt(item.name, 10)
    const isZeroKm = item.name.toLowerCase().includes('zero km') || numericPrefix === 32000

    return {
      ...item,
      modelYear,
      fuelType: parseFuelFromName(item.name),
      fuelCode: parseFuelCodeFromYearCode(item.code),
      isZeroKm,
    }
  })
}

function withQuery(endpoint: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) search.set(k, String(v))
  })

  const qs = search.toString()
  if (!qs) return endpoint
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${qs}`
}

async function fetchFipe<T>(
  endpoint: string,
  opts?: { ttlMs?: number; includeReference?: boolean; referenceCode?: string }
): Promise<T | null> {
  const ttlMs = opts?.ttlMs ?? META_TTL_MS
  const includeReference = opts?.includeReference ?? true

  const referenceCode = includeReference
    ? opts?.referenceCode || (await getLatestReferenceCode())
    : undefined

  const finalEndpoint = includeReference && referenceCode
    ? withQuery(endpoint, { reference: referenceCode })
    : endpoint

  const cacheKey = `${finalEndpoint}`
  const cached = responseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T
  }

  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
    }

    if (TOKEN) {
      headers['X-Subscription-Token'] = TOKEN
    }

    const response = await fetch(`${BASE_URL}${finalEndpoint}`, {
      headers,
      next: { revalidate: Math.floor(ttlMs / 1000) },
    })

    if (!response.ok) {
      console.error(`FIPE API error: ${response.status} ${response.statusText} at ${finalEndpoint}`)
      return null
    }

    const data = (await response.json()) as T
    responseCache.set(cacheKey, {
      expiresAt: Date.now() + ttlMs,
      value: data,
    })

    return data
  } catch (err) {
    console.error(`FIPE API fetch failed at ${finalEndpoint}:`, err)
    return null
  }
}

export async function getFipeReferences(): Promise<FipeReference[]> {
  const now = Date.now()
  if (referencesCache && referencesCache.expiresAt > now) {
    return referencesCache.items
  }

  const references = (await fetchFipe<FipeReference[]>('/references', {
    ttlMs: REFERENCE_TTL_MS,
    includeReference: false,
  })) || []

  referencesCache = {
    expiresAt: now + REFERENCE_TTL_MS,
    items: references,
  }

  return references
}

async function getLatestReferenceCode(): Promise<string | undefined> {
  const refs = await getFipeReferences()
  return refs[0]?.code
}

export async function getFipeBrands(): Promise<FipeItem[]> {
  return (await fetchFipe<FipeItem[]>('/cars/brands', { ttlMs: META_TTL_MS })) || []
}

export async function getFipeModels(brandCode: string): Promise<FipeItem[]> {
  return (await fetchFipe<FipeItem[]>(`/cars/brands/${brandCode}/models`, { ttlMs: META_TTL_MS })) || []
}

export async function getFipeYears(brandCode: string, modelCode: string): Promise<FipeItem[]> {
  return (await fetchFipe<FipeItem[]>(`/cars/brands/${brandCode}/models/${modelCode}/years`, { ttlMs: META_TTL_MS })) || []
}

export async function getFipeDetailByCode(brandCode: string, modelCode: string, yearCode: string): Promise<FipeResult | null> {
  return await fetchFipe<FipeResult>(`/cars/brands/${brandCode}/models/${modelCode}/years/${yearCode}`, { ttlMs: DETAIL_TTL_MS })
}

export async function getFilteredFipeYears(brandCode: string, modelCode: string, limit = 6): Promise<number[]> {
  const rawYears = await getFipeYears(brandCode, modelCode)
  const options = parseYearOptions(rawYears)

  const years = Array.from(
    new Set(options.map((o) => o.modelYear).filter((y): y is number => typeof y === 'number'))
  )
    .sort((a, b) => b - a)
    .slice(0, limit)

  return years
}

export async function getFipeVersionsByYear(brandCode: string, modelCode: string, year: number): Promise<FipeVersionOption[]> {
  const rawYears = await getFipeYears(brandCode, modelCode)
  const options = parseYearOptions(rawYears)

  const versions = options
    .filter((o) => o.modelYear === year)
    .map((o) => ({
      code: o.code,
      name: `${o.fuelType}`,
      fuelType: o.fuelType,
      fuelCode: o.fuelCode,
      modelYear: year,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  // De-dup: algumas fontes podem retornar entradas repetidas por combustíveis equivalentes
  return versions.filter((v, index, arr) => arr.findIndex((x) => x.code === v.code) === index)
}

export async function getFipeYearsByModelName(brandName: string, modelName: string, limit = 6): Promise<number[]> {
  const brand = await resolveBrandByName(brandName)
  if (!brand) return []

  const model = await resolveModelByName(brand.code, modelName)
  if (!model) return []

  return getFilteredFipeYears(brand.code, model.code, limit)
}

async function resolveBrandByName(brandName: string): Promise<FipeItem | null> {
  const brands = await getFipeBrands()
  const target = normalize(brandName)

  return (
    brands.find((b) => normalize(b.name) === target) ||
    brands.find((b) => normalize(b.name).startsWith(target)) ||
    brands.find((b) => normalize(b.name).includes(target)) ||
    null
  )
}

async function resolveModelByName(brandCode: string, modelName: string, versionName?: string): Promise<FipeItem | null> {
  const models = await getFipeModels(brandCode)
  const target = normalize(modelName)
  const versionTokens = normalize(versionName || '')
    .split(' ')
    .filter((t) => t.length >= 2)

  const candidates = models
    .filter((m) => {
      const n = normalize(m.name)
      return n === target || n.startsWith(target + ' ') || n.includes(` ${target}`) || n.includes(target)
    })
    .map((m) => {
      const n = normalize(m.name)
      let score = 0
      if (n === target) score += 100
      if (n.startsWith(target + ' ')) score += 30
      score -= n.length // desempate para nome mais objetivo

      for (const token of versionTokens) {
        if (n.includes(token)) score += 5
      }

      return { model: m, score }
    })
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.model || null
}

function chooseVersionByPreference(versions: FipeVersionOption[], versionName?: string): FipeVersionOption | null {
  if (versions.length === 0) return null
  if (!versionName) return versions[0]

  const tokens = normalize(versionName)
    .split(' ')
    .filter((t) => t.length >= 2)

  const scored = versions
    .map((v) => {
      const vName = normalize(v.name)
      const vFuel = normalize(v.fuelType)
      let score = 0
      for (const token of tokens) {
        if (vName.includes(token)) score += 10
        if (vFuel.includes(token)) score += 10
      }
      return { version: v, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored[0]?.version || versions[0]
}

/**
 * Consulta determinística por hierarquia FIPE:
 * marca -> modelo -> ano -> versão (combustível)
 */
export async function getFipePrice(
  brandName: string,
  modelName: string,
  year: number | string,
  versionName?: string
): Promise<FipeResult | null> {
  const targetYear = typeof year === 'number' ? year : parseInt(year, 10)
  if (!targetYear) return null

  const brand = await resolveBrandByName(brandName)
  if (!brand) return null

  const model = await resolveModelByName(brand.code, modelName, versionName)
  if (!model) return null

  const availableYears = await getFilteredFipeYears(brand.code, model.code, 6)
  if (availableYears.length === 0) return null

  const selectedYear = availableYears.includes(targetYear)
    ? targetYear
    : availableYears[0]

  const versions = await getFipeVersionsByYear(brand.code, model.code, selectedYear)
  const selectedVersion = chooseVersionByPreference(versions, versionName)

  if (!selectedVersion) return null

  return await getFipeDetailByCode(brand.code, model.code, selectedVersion.code)
}

/**
 * Histórico com os últimos N anos válidos do mesmo modelo.
 * Mantém a mesma lógica de versão/combustível por correspondência de nome.
 */
export async function getFipeHistory(
  brandName: string,
  modelName: string,
  yearsCount = 6,
  versionName?: string
): Promise<{ year: number; price: string; priceNum: number }[]> {
  const brand = await resolveBrandByName(brandName)
  if (!brand) return []

  const model = await resolveModelByName(brand.code, modelName, versionName)
  if (!model) return []

  const years = await getFilteredFipeYears(brand.code, model.code, yearsCount)

  const history = await Promise.all(
    years.map(async (year) => {
      const versions = await getFipeVersionsByYear(brand.code, model.code, year)
      const selectedVersion = chooseVersionByPreference(versions, versionName)
      if (!selectedVersion) return null

      const detail = await getFipeDetailByCode(brand.code, model.code, selectedVersion.code)
      if (!detail) return null

      const priceNum = parseFloat(detail.price.replace(/[^\d,]/g, '').replace(',', '.'))
      if (Number.isNaN(priceNum)) return null

      return {
        year,
        price: detail.price,
        priceNum,
      }
    })
  )

  return history.filter((item): item is { year: number; price: string; priceNum: number } => item !== null)
}
