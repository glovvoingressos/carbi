import { supabase } from './supabase'
import { CarSpec, cars as staticCars } from '@/data/cars'

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-')
}

const MODEL_TRIM_STOPWORDS = new Set([
  'advance',
  'advantage',
  'ambition',
  'attraction',
  'black',
  'comfortline',
  'drive',
  'edition',
  'exclusive',
  'gl',
  'gli',
  'griffe',
  'highline',
  'hybrid',
  'line',
  'limited',
  'lt',
  'ltz',
  'm',
  'pack',
  'performance',
  'plus',
  'premium',
  'prestige',
  'pro',
  'rs',
  's',
  'sline',
  'sport',
  'style',
  'tech',
  'touring',
  'ultimate',
  'xlt',
  'xrx',
  'xrv',
])

function isLikelyEngineToken(token: string): boolean {
  const clean = normalizeName(token)
  if (!clean) return false
  if (/^\d/.test(clean)) return true
  if (clean.includes('tfsi') || clean.includes('tsi') || clean.includes('turbo') || clean.includes('flex')) return true
  if (clean.includes('tronic') || clean.includes('tiptronic') || clean.includes('quattro')) return true
  if (clean.includes('cv') || clean.includes('v6') || clean.includes('v8') || clean.includes('v12')) return true
  return false
}

function canonicalModelFromRaw(modelName: string): string {
  const normalizedRaw = String(modelName || '')
    .replace(/\bTTRS\b/gi, 'TT RS')
    .replace(/\bTT-RS\b/gi, 'TT RS')
    .replace(/\bTRON\b/gi, 'TRON')
    .replace(/\be-tron\b/gi, 'etron')
  const rawTokens = normalizedRaw
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

  if (rawTokens.length === 0) return ''

  const picked: string[] = []
  for (let i = 0; i < rawTokens.length; i += 1) {
    const token = rawTokens[i]
    if (i > 0 && isLikelyEngineToken(token)) break
    picked.push(token)
    if (picked.length >= 4) break
  }

  while (picked.length > 1) {
    const tail = normalizeName(picked[picked.length - 1]).replace(/-/g, '')
    if (!MODEL_TRIM_STOPWORDS.has(tail)) break
    picked.pop()
  }

  return picked.join(' ').trim() || rawTokens[0]
}

function canonicalModelSlug(modelName: string): string {
  return slugify(canonicalModelFromRaw(modelName))
}

function toBrandSlug(value: string): string {
  return slugify(value)
}

function num(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function str(value: unknown, fallback = 'Não informado'): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  return fallback
}

function bool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function inferSegment(value: string): CarSpec['segment'] {
  const normalized = normalizeName(value)
  if (normalized.includes('suv')) return 'suv'
  if (normalized.includes('sedan')) return 'sedan'
  if (normalized.includes('pick') || normalized.includes('picape')) return 'pickup'
  if (normalized.includes('eletric')) return 'electric'
  if (normalized.includes('sport')) return 'sport'
  return 'hatch'
}

function technicalCompletenessScore(car: CarSpec): number {
  let score = 0
  if (car.horsepower > 0) score += 8
  if (car.torque > 0) score += 8
  if (car.displacement && car.displacement !== 'Não informado') score += 6
  if (car.transmission && car.transmission !== 'Não informado') score += 6
  if (car.engineType && car.engineType !== 'Não informado') score += 6
  if (car.category && car.category !== 'Não informado') score += 5
  if (car.fuelEconomyCityGas > 0) score += 4
  if (car.fuelEconomyRoadGas > 0) score += 4
  if (car.lengthMm > 0) score += 2
  if (car.wheelbaseMm > 0) score += 2
  if (car.image && car.image.length > 0) score += 3
  return score
}

function normalizeDedupKey(car: CarSpec): string {
  return `${normalizeName(car.brand)}|${normalizeName(car.model)}|${car.year}|${normalizeName(car.version)}`
}

function pickPreferredVariant(cars: CarSpec[]): CarSpec | null {
  if (cars.length === 0) return null
  return [...cars].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    const scoreDiff = technicalCompletenessScore(b) - technicalCompletenessScore(a)
    if (scoreDiff !== 0) return scoreDiff
    if (a.priceBrl !== b.priceBrl) return a.priceBrl - b.priceBrl
    return a.model.localeCompare(b.model)
  })[0]
}

export function groupCarsByModel(cars: CarSpec[]): Array<{
  modelSlug: string
  representative: CarSpec
  variants: CarSpec[]
}> {
  const grouped = new Map<string, CarSpec[]>()

  for (const car of cars) {
    const key = canonicalModelSlug(car.model)
    const current = grouped.get(key) || []
    current.push(car)
    grouped.set(key, current)
  }

  return Array.from(grouped.entries())
    .map(([modelSlug, variants]) => {
      const representative = pickPreferredVariant(variants)
      if (!representative) return null
      const canonicalModel = canonicalModelFromRaw(representative.model)
      return {
        modelSlug,
        representative: {
          ...representative,
          model: canonicalModel || representative.model,
          slug: modelSlug || representative.slug,
        },
        variants: [...variants],
      }
    })
    .filter((item): item is { modelSlug: string; representative: CarSpec; variants: CarSpec[] } => Boolean(item))
}

export async function getDBCars(): Promise<CarSpec[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('external_car_catalog')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching cars from DB:', error)
    return []
  }

  return data
    .map((dbCar: any): CarSpec | null => {
      const modelName = str(dbCar.model_name, '')
      const brandName = str(dbCar.brand_name, '')
      if (!modelName || !brandName) return null

      const modelSlug = slugify(modelName || 'modelo')
      const brandSlug = slugify(brandName || 'marca')
      const parsedPrice = num(dbCar.price_brl)
      const parsedYear = num(dbCar.year_model || dbCar.year || new Date().getFullYear())
      const parsedHp = num(dbCar.horsepower)
      const inferredSegment = inferSegment(str(dbCar.body_type || dbCar.category || '', ''))
      const fallbackId = `${brandSlug}-${modelSlug}-${parsedYear}`
      const fallbackCategory = str(dbCar.category, inferredSegment)

      return {
        id: String(dbCar.id || fallbackId),
        brand: brandName,
        model: modelName,
        version: str(dbCar.version_name, 'Não informado'),
        year: parsedYear,
        slug: modelSlug || fallbackId,
        segment: inferredSegment,
        category: fallbackCategory,
        priceBrl: parsedPrice,
        engineType: str(dbCar.fuel_type),
        displacement: str(dbCar.engine, 'Não informado'),
        cylinderCount: num(dbCar.cylinder_count),
        turbo: bool(dbCar.turbo),
        horsepower: parsedHp,
        torque: num(dbCar.torque),
        transmission: str(dbCar.transmission),
        drive: str(dbCar.drive),
        lengthMm: num(dbCar.length_mm),
        widthMm: num(dbCar.width_mm),
        heightMm: num(dbCar.height_mm),
        wheelbaseMm: num(dbCar.wheelbase_mm),
        weightKg: num(dbCar.weight_kg),
        trunkCapacity: num(dbCar.trunk_capacity),
        seats: num(dbCar.seats) || 5,
        fuelEconomyCityGas: num(dbCar.fuel_economy_city),
        fuelEconomyRoadGas: num(dbCar.fuel_economy_road),
        topSpeed: num(dbCar.top_speed),
        acceleration0100: num(dbCar.acceleration_0100),
        airbagsCount: num(dbCar.airbags_count),
        absBrakes: bool(dbCar.abs_brakes),
        esc: bool(dbCar.esc),
        hasCarplay: bool(dbCar.has_carplay),
        hasAndroidAuto: bool(dbCar.has_android_auto),
        hasAc: bool(dbCar.has_ac),
        hasRearCamera: bool(dbCar.has_rear_camera),
        hasMultimedia: bool(dbCar.has_multimedia),
        hasCruiseCtrl: bool(dbCar.has_cruise_ctrl),
        latinNcap: num(dbCar.latin_ncap),
        isofix: bool(dbCar.isofix),
        tags: [],
        isPopular: bool(dbCar.is_popular),
        pros: [],
        cons: [],
        shortDesc: `${modelName} ${parsedYear} com valor atualizado em tempo real.`,
        idealFor: 'Quem busca dados atualizados do veículo',
        image: typeof dbCar.image_url === 'string' ? dbCar.image_url : '',
      } as CarSpec
    })
    .filter((car: CarSpec | null): car is CarSpec => car !== null)
}

export async function getCarsByBrand(brand: string): Promise<CarSpec[]> {
  const allCars = await getAllCars()
  const target = normalizeName(brand)
  return allCars.filter((car) => normalizeName(car.brand) === target)
}

export async function getCarVariants(brandSlug: string, modelSlug: string): Promise<CarSpec[]> {
  const cars = await getAllCars()
  const filtered = cars.filter((car) => {
    return toBrandSlug(car.brand) === brandSlug && canonicalModelSlug(car.model) === modelSlug
  })
  return filtered.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    return technicalCompletenessScore(b) - technicalCompletenessScore(a)
  })
}

export async function getCarDetail(brandSlug: string, modelSlug: string): Promise<CarSpec | null> {
  const variants = await getCarVariants(brandSlug, modelSlug)
  if (variants.length > 0) {
    return pickPreferredVariant(variants)
  }

  // Fallback para URLs legadas que podem usar id/version slug.
  const cars = await getAllCars()
  const car = cars.find(
    (c) => (c.slug === modelSlug || c.id === modelSlug) && toBrandSlug(c.brand) === brandSlug,
  )
  return car || null
}

export async function getAllCars(): Promise<CarSpec[]> {
  try {
    const dbCars = await getDBCars()
    
    // Fetch overrides from car_assets table if it exists
    let assetOverrides: Record<string, string> = {}
    type AssetOverrideRow = {
      car_id: string
      image_url: string
    }
    if (supabase) {
      const { data: assetData } = await supabase
        .from('car_assets')
        .select('car_id, image_url')
      
      if (assetData) {
        assetOverrides = Object.fromEntries((assetData as AssetOverrideRow[]).map((row) => [row.car_id, row.image_url]))
      }
    }
    
    const dbWithOverrides = dbCars.map((car) => ({
      ...car,
      image: assetOverrides[car.id] || car.image,
    }))

    const combined = [...dbWithOverrides, ...staticCars.map((car) => ({
      ...car,
      image: assetOverrides[car.id] || car.image,
    }))]

    const winnerByKey = new Map<string, CarSpec>()
    for (const car of combined) {
      const key = normalizeDedupKey(car)
      const current = winnerByKey.get(key)
      if (!current) {
        winnerByKey.set(key, car)
        continue
      }
      if (technicalCompletenessScore(car) > technicalCompletenessScore(current)) {
        winnerByKey.set(key, car)
      }
    }
    const deduped = Array.from(winnerByKey.values())

    return deduped.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
  } catch (err) {
    console.error('Failed to merge cars:', err)
    return [...staticCars]
  }
}
