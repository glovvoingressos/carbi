import { supabase } from './supabase'
import { CarSpec, cars as staticCars } from '@/data/cars'

export async function getDBCars(): Promise<CarSpec[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('external_car_catalog')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(50) // Showing latest 50 for now to keep it sane

  if (error) {
    console.error('Error fetching cars from DB:', error)
    return []
  }

  return data.map((dbCar: any) => {
    const brandSlug = dbCar.brand_name.toLowerCase().trim().replace(/\s+/g, '-')
    let modelSlug = dbCar.model_name.toLowerCase().trim().replace(/\s+/g, '-')
    
    // Normalizations for common mismatch
    if (modelSlug === 'hr-v') modelSlug = 'hrv'
    if (brandSlug === 'caoa-chery') modelSlug = 'tiggo-5x' // hardcoded example fix from earlier inventory
    
    // Check if we have an image in the static mapping first, otherwise build local path
    const staticImg = staticCars.find(sc => sc.slug === modelSlug)?.image
    const assetPath = staticImg || `/assets/cars/${brandSlug}-${modelSlug}-2024.png`

    return {
      id: dbCar.id,
      brand: dbCar.brand_name,
      model: dbCar.model_name,
      version: dbCar.version_name,
      year: dbCar.year_model,
      slug: modelSlug,
      segment: dbCar.vehicle_type === 'carros' ? 'hatch' : 'suv', // Basic mapping
      category: 'compacto',
      priceBrl: parseFloat(dbCar.price_brl),
      engineType: dbCar.fuel_type,
      displacement: '1.0', // Default
      cylinderCount: 3,
      turbo: false,
      horsepower: 0,
      torque: 0,
      transmission: 'Manual',
      drive: 'Dianteira',
      lengthMm: 0,
      widthMm: 0,
      heightMm: 0,
      wheelbaseMm: 0,
      weightKg: 0,
      trunkCapacity: 0,
      seats: 5,
      fuelEconomyCityGas: 0,
      fuelEconomyRoadGas: 0,
      topSpeed: 0,
      acceleration0100: 0,
      airbagsCount: 2,
      absBrakes: true,
      esc: true,
      hasCarplay: false,
      hasAndroidAuto: false,
      hasAc: true,
      hasRearCamera: false,
      hasMultimedia: false,
      hasCruiseCtrl: false,
      latinNcap: 0,
      isofix: true,
      tags: [dbCar.brand_name.toLowerCase(), dbCar.fuel_type.toLowerCase()],
      isPopular: false,
      pros: ['Preço atualizado', 'Dados em tempo real'],
      cons: ['Sem ficha técnica completa'],
      shortDesc: `${dbCar.model_name} em sua versão ${dbCar.version_name}. Dados extraídos da FIPE.`,
      idealFor: 'Quem busca um carro com preço atualizado pela FIPE',
      image: assetPath,
    }
  })
}

export async function getCarsByBrand(brand: string): Promise<CarSpec[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('external_car_catalog')
    .select('*')
    .eq('brand_name', brand)
    .order('year_model', { ascending: false })

  if (error) return []
  
  // Reuse mapping logic (to be refactored if needed, but for now simple)
  return data.map((dbCar: any) => ({
    id: dbCar.id,
    brand: dbCar.brand_name,
    model: dbCar.model_name,
    version: dbCar.version_name,
    year: dbCar.year_model,
    slug: dbCar.model_name.toLowerCase().replace(/\s+/g, '-'),
    segment: 'suv', // Basic mapping
    category: dbCar.vehicle_type === 'carros' ? 'compacto' : 'utilitario',
    priceBrl: parseFloat(dbCar.price_brl),
    engineType: dbCar.fuel_type,
    displacement: '1.0',
    cylinderCount: 3,
    turbo: false,
    horsepower: 0,
    torque: 0,
    transmission: 'Manual',
    drive: 'Dianteira',
    lengthMm: 0,
    widthMm: 0,
    heightMm: 0,
    wheelbaseMm: 0,
    weightKg: 0,
    trunkCapacity: 0,
    seats: 5,
    fuelEconomyCityGas: 0,
    fuelEconomyRoadGas: 0,
    topSpeed: 0,
    acceleration0100: 0,
    airbagsCount: 2,
    absBrakes: true,
    esc: true,
    hasCarplay: false,
    hasAndroidAuto: false,
    hasAc: true,
    hasRearCamera: false,
    hasMultimedia: false,
    hasCruiseCtrl: false,
    latinNcap: 0,
    isofix: true,
    tags: [dbCar.brand_name.toLowerCase()],
    isPopular: false,
    pros: ['Preço atualizado'],
    cons: ['Sem ficha técnica completa'],
    shortDesc: dbCar.version_name,
    idealFor: 'Informação baseada na FIPE',
    image: 'https://images.unsplash.com/photo-1621007890657-93d3859b6e8c?w=800&auto=format&fit=crop',
  }))
}

export async function getCarDetail(brandSlug: string, modelSlug: string): Promise<CarSpec | null> {
  const cars = await getAllCars()
  const car = cars.find(c => 
    c.slug === modelSlug && 
    c.brand.toLowerCase().replace(/\s+/g, '-') === brandSlug
  )
  return car || null
}

export async function getAllCars(): Promise<CarSpec[]> {
  try {
    const dbCars = await getDBCars()
    
    // Merge static cars with DB cars
    // Filter out static cars that might be duplicated in DB if needed
    const dbSlugs = new Set(dbCars.map(c => c.slug))
    const filteredStatic = staticCars.filter(c => !dbSlugs.has(c.slug))

    // Always keep popular static cars at the top if they exist
    const finalCars = [...dbCars, ...filteredStatic]
    
    // Safety check: if DB has junk, we might want to sort by popularity or year
    return finalCars.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
  } catch (err) {
    console.error('Failed to merge cars:', err)
    return staticCars
  }
}
