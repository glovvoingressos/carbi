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
      if (!template) return null

      const modelSlug = slugify(dbCar.model_name || template.model)
      const brandSlug = slugify(dbCar.brand_name || template.brand)
      const parsedPrice = Number(dbCar.price_brl)

      return {
        ...template,
        id: String(dbCar.id || template.id),
        brand: dbCar.brand_name || template.brand,
        model: dbCar.model_name || template.model,
        version: dbCar.version_name || template.version,
        year: Number(dbCar.year_model || template.year),
        slug: modelSlug || template.slug,
        priceBrl: Number.isFinite(parsedPrice) ? parsedPrice : template.priceBrl,
        engineType: dbCar.fuel_type || template.engineType,
        shortDesc: `${dbCar.model_name || template.model} em sua versão ${dbCar.version_name || template.version}. Valor atualizado com referência mensal oficial.`,
        idealFor: 'Quem busca valor atualizado e ficha técnica confiável',
        image: template.image || `/assets/cars/${brandSlug}-${modelSlug}-${Number(dbCar.year_model || template.year)}.png`,
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
    
    // Merge static cars with DB cars
    const dbKeys = new Set(
      dbCars.map((c) => `${normalizeName(c.brand)}|${normalizeName(c.model)}|${c.year}`)
    )
    const filteredStatic = staticCars.map(car => ({
      ...car,
      // Priority: DB Override > Static Path
      image: assetOverrides[car.id] || car.image
    })).filter((c) => {
      const key = `${normalizeName(c.brand)}|${normalizeName(c.model)}|${c.year}`
      return !dbKeys.has(key)
    })

    const finalCars = [...dbCars, ...filteredStatic]
    
    return finalCars.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
  } catch (err) {
    console.error('Failed to merge cars:', err)
    return [...staticCars]
  }
}
