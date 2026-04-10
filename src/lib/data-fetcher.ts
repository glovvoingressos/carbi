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

function inferSegment(value: string): CarSpec['segment'] {
  const normalized = normalizeName(value)
  if (normalized.includes('suv')) return 'suv'
  if (normalized.includes('sedan')) return 'sedan'
  if (normalized.includes('pick') || normalized.includes('picape')) return 'pickup'
  if (normalized.includes('eletric')) return 'electric'
  if (normalized.includes('sport')) return 'sport'
  return 'hatch'
}

function getTemplateCar(dbCar: any): CarSpec | null {
  const brand = normalizeName(dbCar.brand_name || '')
  const model = normalizeName(dbCar.model_name || '')
  const year = Number(dbCar.year_model || 0)

  const sameBrandModel = staticCars.filter(
    (car) => normalizeName(car.brand) === brand && normalizeName(car.model) === model
  )
  if (sameBrandModel.length === 0) return null

  const exactYear = sameBrandModel.find((car) => car.year === year)
  if (exactYear) return exactYear

  return sameBrandModel.sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0] || null
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
      const template = getTemplateCar(dbCar)
      const modelName = dbCar.model_name || template?.model || ''
      const brandName = dbCar.brand_name || template?.brand || ''
      if (!modelName || !brandName) return null

      const modelSlug = slugify(modelName || template?.model || 'modelo')
      const brandSlug = slugify(brandName || template?.brand || 'marca')
      const parsedPrice = Number(dbCar.price_brl)
      const parsedYear = Number(dbCar.year_model || template?.year || new Date().getFullYear())
      const parsedHp = Number(dbCar.horsepower || template?.horsepower || 0)
      const inferredSegment = inferSegment(dbCar.body_type || dbCar.category || template?.segment || '')
      const fallbackId = `${brandSlug}-${modelSlug}-${parsedYear}`
      const fallbackCategory = dbCar.category || template?.category || inferredSegment

      return {
        ...(template || {
          id: fallbackId,
          brand: brandName,
          model: modelName,
          version: dbCar.version_name || 'Versão não informada',
          year: parsedYear,
          slug: modelSlug || fallbackId,
          segment: inferredSegment,
          category: fallbackCategory,
          priceBrl: Number.isFinite(parsedPrice) ? parsedPrice : 0,
          engineType: dbCar.fuel_type || 'Não informado',
          displacement: dbCar.engine || 'Não informado',
          cylinderCount: Number(dbCar.cylinder_count || 0),
          turbo: Boolean(dbCar.turbo || false),
          horsepower: parsedHp,
          torque: Number(dbCar.torque || 0),
          transmission: dbCar.transmission || 'Não informado',
          drive: dbCar.drive || 'Não informado',
          lengthMm: Number(dbCar.length_mm || 0),
          widthMm: Number(dbCar.width_mm || 0),
          heightMm: Number(dbCar.height_mm || 0),
          wheelbaseMm: Number(dbCar.wheelbase_mm || 0),
          weightKg: Number(dbCar.weight_kg || 0),
          trunkCapacity: Number(dbCar.trunk_capacity || 0),
          seats: Number(dbCar.seats || 5),
          fuelEconomyCityGas: Number(dbCar.fuel_economy_city || 0),
          fuelEconomyRoadGas: Number(dbCar.fuel_economy_road || 0),
          topSpeed: Number(dbCar.top_speed || 0),
          acceleration0100: Number(dbCar.acceleration_0100 || 0),
          airbagsCount: Number(dbCar.airbags_count || 0),
          absBrakes: Boolean(dbCar.abs_brakes || false),
          esc: Boolean(dbCar.esc || false),
          hasCarplay: Boolean(dbCar.has_carplay || false),
          hasAndroidAuto: Boolean(dbCar.has_android_auto || false),
          hasAc: Boolean(dbCar.has_ac || false),
          hasRearCamera: Boolean(dbCar.has_rear_camera || false),
          hasMultimedia: Boolean(dbCar.has_multimedia || false),
          hasCruiseCtrl: Boolean(dbCar.has_cruise_ctrl || false),
          latinNcap: Number(dbCar.latin_ncap || 0),
          isofix: Boolean(dbCar.isofix || false),
          tags: [],
          isPopular: false,
          pros: [],
          cons: [],
          shortDesc: `${modelName} com preço médio atualizado.`,
          idealFor: 'Quem busca dados atualizados do veículo',
          image: '/assets/decorations/car-3d.png',
        }),
        id: String(dbCar.id || template?.id || fallbackId),
        brand: brandName,
        model: modelName,
        version: dbCar.version_name || template?.version || 'Versão não informada',
        year: parsedYear,
        slug: modelSlug || template?.slug || fallbackId,
        segment: template?.segment || inferredSegment,
        category: fallbackCategory,
        priceBrl: Number.isFinite(parsedPrice) ? parsedPrice : Number(template?.priceBrl || 0),
        engineType: dbCar.fuel_type || template?.engineType || 'Não informado',
        shortDesc: `${modelName} em sua versão ${dbCar.version_name || template?.version || 'padrão'}. Valor atualizado com referência mensal oficial.`,
        idealFor: template?.idealFor || 'Quem busca valor atualizado e ficha técnica confiável',
        image: template?.image || `/assets/cars/${brandSlug}-${modelSlug}-${parsedYear}.png`,
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
    
    const finalCars = dbCars.map((car) => ({
      ...car,
      image: assetOverrides[car.id] || car.image,
    }))

    return finalCars.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
  } catch (err) {
    console.error('Failed to merge cars:', err)
    return []
  }
}
