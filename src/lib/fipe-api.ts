/**
 * FIPE API Service (Parallelum v2)
 * Robust implementation with caching and fuzzy matching
 */

const BASE_URL = process.env.NEXT_PUBLIC_FIPE_API_BASE_URL || 'https://fipe.parallelum.com.br/api/v2'
const FIPE_API_TOKEN = process.env.FIPE_API_TOKEN

// Caches
let cachedReference: string | null = null
let refExpiresAt = 0
const REFERENCE_TTL = 1000 * 60 * 60 // 1 hour

let cachedBrands: Record<string, FipeItem[]> = {}
let brandsExpiresAt = 0
const BRANDS_TTL = 1000 * 60 * 60 * 24 // 24 hours

export interface FipeItem {
  name: string
  code: string
}

export interface FipeReference {
  name: string
  code: string
}

export interface FipeResult {
  price: string
  brand: string
  model: string
  modelYear: number
  fuel: string
  codeFipe: string
  referenceMonth: string
  vehicleType: number
  fuelAcronym: string
}

export interface FipeVersionOption {
  code: string
  name: string
  fuelType: string
  fuelCode: string | null
  modelYear: number
}

/**
 * Normalizes strings for consistent matching
 */
export function normalize(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bvolkswagen\b/g, 'vw')
}

/**
 * Base fetcher for Parallelum v2
 */
async function fetchFipe<T>(endpoint: string, useReference = true, type = 'cars', referenceOverride?: string): Promise<T> {
  const ref = referenceOverride || (useReference ? await getLatestReference() : null)
  const query = ref ? `?reference=${ref}` : ''
  const url = endpoint.startsWith('/references') 
    ? `${BASE_URL}${endpoint}${query}`
    : `${BASE_URL}/${type}${endpoint}${query}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (FIPE_API_TOKEN) {
    headers['X-Subscription-Token'] = FIPE_API_TOKEN
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 } // Cache for 1 hour at Next.js level
    })

    if (!res.ok) {
      console.error(`FIPE API Error (${res.status}): ${url}`)
      return [] as any
    }

    return await res.json()
  } catch (error) {
    console.error('FIPE Fetch Error:', error)
    return [] as any
  }
}

/**
 * Reference month resolution
 */
export async function getFipeReferences(): Promise<FipeReference[]> {
  const raw = await fetchFipe<any[]>('/references', false)
  if (!Array.isArray(raw)) return []
  return raw.map(r => ({
    name: r.month || r.name || 'Referência desconhecida',
    code: String(r.code)
  }))
}

export async function getLatestReference(): Promise<string | null> {
  if (cachedReference && refExpiresAt > Date.now()) {
    return cachedReference
  }

  const refs = await getFipeReferences()
  if (refs.length > 0) {
    cachedReference = refs[0].code
    refExpiresAt = Date.now() + REFERENCE_TTL
    return cachedReference
  }
  
  return null
}

/**
 * Brands, Models and Years
 */
export async function getFipeBrands(type = 'cars'): Promise<FipeItem[]> {
  if (cachedBrands[type] && brandsExpiresAt > Date.now()) {
    return cachedBrands[type]
  }

  const brands = await fetchFipe<FipeItem[]>('/brands', false, type)
  if (Array.isArray(brands) && brands.length > 0) {
    cachedBrands[type] = brands
    brandsExpiresAt = Date.now() + BRANDS_TTL
  }
  return brands || []
}

export async function getFipeModels(brandCode: string, type = 'cars'): Promise<FipeItem[]> {
  return fetchFipe<FipeItem[]>(`/brands/${brandCode}/models`, true, type)
}

export async function getFipeYears(brandCode: string, modelCode: string, type = 'cars'): Promise<FipeItem[]> {
  return fetchFipe<FipeItem[]>(`/brands/${brandCode}/models/${modelCode}/years`, true, type)
}

/**
 * Detail
 */
export async function getFipeDetailByCode(brandCode: string, modelCode: string, yearCode: string, type = 'cars'): Promise<FipeResult | null> {
  const data = await fetchFipe<any>(`/brands/${brandCode}/models/${modelCode}/years/${yearCode}`, true, type)
  
  if (!data || !data.price) return null

  return {
    price: data.price,
    brand: data.brand,
    model: data.model,
    modelYear: data.modelYear,
    fuel: data.fuel,
    codeFipe: data.codeFipe,
    referenceMonth: data.referenceMonth,
    vehicleType: data.vehicleType,
    fuelAcronym: data.fuelAcronym,
  }
}

/**
 * UI Helpers
 */
export async function getFilteredFipeYears(brandCode: string, modelCode: string, limit = 6): Promise<number[]> {
  const rawYears = await getFipeYears(brandCode, modelCode)
  const years = rawYears.map(item => {
    // Only match exactly 4 digits to avoid 32000 (Zero KM) or other codes
    const match = item.name.match(/^(\d{4})\b/)
    const y = match ? parseInt(match[1], 10) : null
    return (y && y < 2100) ? y : null // Sanity check for year range
  }).filter((y): y is number => y !== null)
  
  return Array.from(new Set(years)).sort((a, b) => b - a).slice(0, limit)
}

export async function getFipeVersionsByYear(brandCode: string, modelCode: string, year: number): Promise<FipeVersionOption[]> {
  const rawYears = await getFipeYears(brandCode, modelCode)
  return rawYears
    .filter(item => item.name.startsWith(String(year)))
    .map(item => ({
      code: item.code,
      name: item.name.replace(String(year), '').trim() || 'Gasolina',
      fuelType: item.name.replace(String(year), '').trim() || 'Gasolina',
      fuelCode: item.code.split('-')[1] || '1',
      modelYear: year
    }))
}

/**
 * Resolvers for auto-hydration (used by [brand]/[model]/page.tsx)
 */

export interface ResolvedModel {
  brand: FipeItem
  model: FipeItem
}

async function getCandidateModels(
  brand: FipeItem,
  models: FipeItem[],
  modelName: string,
  versionName?: string
): Promise<FipeItem[]> {
  const normalizedFipeBrand = normalize(brand.name)
  const nModel = normalize(modelName).replace(normalizedFipeBrand, '').trim() // Remove brand from model name to avoid token conflict
  const nVersion = versionName ? normalize(versionName) : ''

  const mTokens = nModel.split(' ').filter(t => t.length >= 1)
  const vTokens = nVersion.split(' ').filter(t => t.length >= 2)

  const seen = new Set<string>()
  const candidates: FipeItem[] = []
  const tryAdd = (m: FipeItem) => {
    if (m && !seen.has(m.code)) {
      seen.add(m.code)
      candidates.push(m)
    }
  }

  // 1. Strict Word Match (Model + Version)
  if (vTokens.length > 0) {
    for (const m of models) {
      const mn = normalize(m.name)
      if (mTokens.every(t => mn.includes(t)) && vTokens.every(t => mn.includes(t))) tryAdd(m)
    }
  }

  // 2. Partial Token Match (At least half of version tokens)
  if (candidates.length === 0 && vTokens.length > 1) {
    for (const m of models) {
      const mn = normalize(m.name)
      if (!mTokens.every(t => mn.includes(t))) continue
      const matchCount = vTokens.filter(t => mn.includes(t)).length
      if (matchCount >= Math.ceil(vTokens.length / 2)) tryAdd(m)
    }
  }

  // 3. Exact Model Match
  if (candidates.length === 0) {
    for (const m of models) {
      if (normalize(m.name) === nModel) tryAdd(m)
    }
  }

  // 4. Word boundary match for model name
  if (candidates.length === 0) {
    const regex = new RegExp(`\\b${nModel}\\b`, 'i')
    for (const m of models) {
      if (regex.test(normalize(m.name))) tryAdd(m)
    }
  }

  // 5. Token match for model (ignore version)
  if (candidates.length === 0 && mTokens.length > 0) {
    for (const m of models) {
      const mn = normalize(m.name)
      if (mTokens.every(t => mn.includes(t))) tryAdd(m)
    }
  }

  // 6. Last resort: just find something that includes the first two tokens of the model
  if (candidates.length === 0 && mTokens.length >= 2) {
    for (const m of models) {
      const mn = normalize(m.name)
      if (mn.includes(mTokens[0]) && mn.includes(mTokens[1])) tryAdd(m)
    }
  }

  return candidates
}

async function countRealYears(brandCode: string, modelCode: string): Promise<number> {
  try {
    const years = await getFipeYears(brandCode, modelCode)
    return years.filter(y => !y.name.startsWith('32000')).length
  } catch {
    return 0
  }
}

export async function resolveBrandAndModel(
  brandName: string,
  modelName: string,
  type = 'cars',
  versionName?: string
): Promise<ResolvedModel | null> {
  const brands = await getFipeBrands(type)
  const nBrand = normalize(brandName)
  const brand = brands.find(b => normalize(b.name) === nBrand) || 
                brands.find(b => normalize(b.name).includes(nBrand) || nBrand.includes(normalize(b.name)))
  
  if (!brand) return null

  const models = await getFipeModels(brand.code, type)
  const candidates = await getCandidateModels(brand, models, modelName, versionName)
  if (candidates.length === 0) return null

  // When the version alone is ambiguous (e.g. "EXL" matching several trims),
  // prefer the trim with the most available model years.
  let best = candidates[0]
  if (candidates.length > 1) {
    let bestCount = -1
    for (const candidate of candidates) {
      const count = await countRealYears(brand.code, candidate.code)
      if (count > bestCount) {
        bestCount = count
        best = candidate
      }
    }
  }

  return { brand, model: best }
}

export async function resolveBrandAndModelByYear(
  brandName: string,
  modelName: string,
  year: number | string,
  versionName?: string,
  type = 'cars'
): Promise<ResolvedModel | null> {
  const targetYear = typeof year === 'number' ? year : parseInt(String(year), 10)
  if (!targetYear) return null

  const brands = await getFipeBrands(type)
  const nBrand = normalize(brandName)
  const brand = brands.find(b => normalize(b.name) === nBrand) || 
                brands.find(b => normalize(b.name).includes(nBrand) || nBrand.includes(normalize(b.name)))
  if (!brand) return null

  const models = await getFipeModels(brand.code, type)
  const candidates = await getCandidateModels(brand, models, modelName, versionName)
  if (candidates.length === 0) return null

  // Prefer the first candidate that actually has a version for the target year,
  // so a short/ambiguous version never resolves to a wrong trim.
  for (const candidate of candidates) {
    const versions = await getFipeVersionsByYear(brand.code, candidate.code, targetYear)
    if (versions.length > 0) return { brand, model: candidate }
  }

  return { brand, model: candidates[0] }
}

export async function getFipeYearsByModelName(brandName: string, modelName: string, limit = 6, _versionName?: string): Promise<number[]> {
  // Ignoramos a versão para o seletor de anos para permitir que o usuário veja o histórico completo do modelo
  const resolved = await resolveBrandAndModel(brandName, modelName, 'cars')
  if (!resolved) return []
  return getFilteredFipeYears(resolved.brand.code, resolved.model.code, limit)
}

export async function getFipePrice(
  brandName: string,
  modelName: string,
  year: number | string,
  versionName?: string
): Promise<FipeResult | null> {
  const targetYear = typeof year === 'number' ? year : parseInt(year, 10)
  if (!targetYear) return null

  const resolved = await resolveBrandAndModelByYear(brandName, modelName, targetYear, versionName, 'cars')
  if (!resolved) return null

  const versions = await getFipeVersionsByYear(resolved.brand.code, resolved.model.code, targetYear)
  if (versions.length === 0) return null

  let selected = versions[0]
  if (versionName) {
    const nv = normalize(versionName)
    const match = versions.find(v => normalize(v.name).includes(nv)) || 
                  versions.find(v => nv.includes(normalize(v.name)))
    if (match) selected = match
  }

  return getFipeDetailByCode(resolved.brand.code, resolved.model.code, selected.code)
}

export async function getFipeHistory(
  brandName: string,
  modelName: string,
  yearsCount = 6,
  versionName?: string
): Promise<{ year: number; price: string; priceNum: number }[]> {
  const resolved = await resolveBrandAndModel(brandName, modelName, 'cars', versionName)
  if (!resolved) return []

  const years = await getFilteredFipeYears(resolved.brand.code, resolved.model.code, yearsCount)
  
  const history = await Promise.all(
    years.map(async (year) => {
      const versions = await getFipeVersionsByYear(resolved.brand.code, resolved.model.code, year)
      if (versions.length === 0) return null
      
      let selected = versions[0]
      if (versionName) {
        const nv = normalize(versionName)
        const match = versions.find(v => normalize(v.name).includes(nv))
        if (match) selected = match
      }
      
      const detail = await getFipeDetailByCode(resolved.brand.code, resolved.model.code, selected.code)
      if (!detail) return null
      
      const priceNum = parseFloat(detail.price.replace(/[^\d,]/g, '').replace(',', '.'))
      return { year, price: detail.price, priceNum }
    })
  )

  return history.filter((h): h is { year: number; price: string; priceNum: number } => h !== null)
}

export async function getFipeMonthlyHistory(
  brandName: string,
  modelName: string,
  year: number | string,
  versionName?: string,
  monthsCount = 5
): Promise<{ month: string; price: string; priceNum: number }[]> {
  const targetYear = typeof year === 'number' ? year : parseInt(year, 10)
  if (!targetYear) return []

  const resolved = await resolveBrandAndModelByYear(brandName, modelName, targetYear, versionName, 'cars')
  if (!resolved) return []

  const versions = await getFipeVersionsByYear(resolved.brand.code, resolved.model.code, targetYear)
  if (versions.length === 0) return []

  let selected = versions[0]
  if (versionName) {
    const nv = normalize(versionName)
    const match = versions.find(v => normalize(v.name).includes(nv)) ||
                  versions.find(v => nv.includes(normalize(v.name)))
    if (match) selected = match
  }

  const refs = await getFipeReferences()
  const recentRefs = refs.slice(0, monthsCount).reverse()

  const results: { month: string; price: string; priceNum: number }[] = []
  for (const ref of recentRefs) {
    const data = await fetchFipe<any>(`/brands/${resolved.brand.code}/models/${resolved.model.code}/years/${selected.code}`, false, 'cars', ref.code)
    if (data?.price) {
      const priceNum = parseFloat(data.price.replace(/[^\d,]/g, '').replace(',', '.'))
      results.push({ month: ref.name, price: data.price, priceNum: isNaN(priceNum) ? 0 : priceNum })
    }
  }

  return results
}
