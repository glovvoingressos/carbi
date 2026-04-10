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

export async function getCarDetail(brandSlug: string, modelSlug: string): Promise<CarSpec | null> {
  const cars = await getAllCars()
  const car = cars.find(c => 
    (c.slug === modelSlug || c.id === modelSlug) && 
    c.brand.toLowerCase().replace(/\s+/g, '-') === brandSlug
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

    const deduped = combined.filter((car, index, arr) => {
      const key = `${normalizeName(car.brand)}|${normalizeName(car.model)}|${car.year}|${normalizeName(car.version)}`
      return arr.findIndex((item) => `${normalizeName(item.brand)}|${normalizeName(item.model)}|${item.year}|${normalizeName(item.version)}` === key) === index
    })

    return deduped.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
  } catch (err) {
    console.error('Failed to merge cars:', err)
    return [...staticCars]
  }
}
