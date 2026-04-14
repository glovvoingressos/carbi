export type VehicleCategory = 
  | 'suv'
  | 'hatch'
  | 'sedan'
  | 'pickup'
  | 'minivan'
  | 'coupe'
  | 'convertible'
  | 'wagon'
  | 'electric'
  | 'hybrid'

export interface CategoryInfo {
  key: VehicleCategory
  label: string
  icon: string
}

export const VEHICLE_CATEGORIES: CategoryInfo[] = [
  { key: 'suv', label: 'SUV', icon: '🚙' },
  { key: 'hatch', label: 'Hatch', icon: '🚗' },
  { key: 'sedan', label: 'Sedan', icon: '🚔' },
  { key: 'pickup', label: 'Picape', icon: '🛻' },
  { key: 'minivan', label: 'Van/Minivan', icon: '🚐' },
  { key: 'coupe', label: 'Cupê', icon: '🏎️' },
  { key: 'convertible', label: 'Conversível', icon: '🌤️' },
  { key: 'wagon', label: 'Wagon/Perua', icon: '🚙' },
  { key: 'electric', label: 'Elétrico', icon: '⚡' },
  { key: 'hybrid', label: 'Híbrido', icon: '🔋' },
]

export const CATEGORY_SEATS: Record<string, number[]> = {
  'suv': [5, 7],
  'hatch': [5],
  'sedan': [5],
  'pickup': [2, 5],
  'minivan': [7, 8, 9],
  'coupe': [2, 4],
  'convertible': [2, 4],
  'wagon': [5],
  'electric': [5, 7],
  'hybrid': [5, 7],
}

export function classifyVehicleCategory(
  bodyType: string | null | undefined,
  brand: string,
  model: string,
  seats?: number | null
): VehicleCategory | null {
  const bt = (bodyType || '').toLowerCase()
  const m = (model || '').toLowerCase()
  const b = (brand || '').toLowerCase()

  if (bt.includes('suv') || bt.includes('utilitário') || bt.includes('跨界')) return 'suv'
  if (bt.includes('hatch') || bt.includes('compacto') || bt.includes('hamb') || bt.includes('3 portas')) return 'hatch'
  if (bt.includes('sedan') || bt.includes('berlina') || bt.includes('saloon')) return 'sedan'
  if (bt.includes('pickup') || bt.includes('picape') || bt.includes('camionete') || bt.includes('cabine')) return 'pickup'
  if (bt.includes('van') || bt.includes('minivan') || bt.includes('furgão') || bt.includes('van')) return 'minivan'
  if (bt.includes('cupê') || bt.includes('coupe') || bt.includes('esportivo')) return 'coupe'
  if (bt.includes('conversível') || bt.includes('convertible') || bt.includes('roadster')) return 'convertible'
  if (bt.includes('wagon') || bt.includes('perua') || bt.includes('estate') || bt.includes('kombi')) return 'wagon'
  
  if (m.includes('electric') || m.includes('ev') || b.includes('tesla') || m.includes('i3') || m.includes('zev')) return 'electric'
  
  if (bt.includes('hybrid') || bt.includes('híbrido') || m.includes('hybrid') || m.includes('híbrido') || m.includes('prime') || m.includes('phev')) return 'hybrid'
  
  if (m.includes('suv') || m.includes('suv') || m.includes('tracker') || m.includes('creta') || m.includes('hr-v') || m.includes('captur') || m.includes('duster')) return 'suv'
  
  if (m.includes('hatch') || m.includes('polo') || m.includes('gol') || m.includes('onix') || m.includes('kwid') || m.includes('city') || m.includes('fit')) return 'hatch'
  
  if (m.includes('sedan') || m.includes('cruze') || m.includes('corolla') || m.includes('civic') || m.includes('fluence') || m.includes('logan')) return 'sedan'
  
  if (m.includes('hilux') || m.includes('strada') || m.includes('ranger') || m.includes('toro') || m.includes('montana') || m.includes('saveiro')) return 'pickup'
  
  if (m.includes('van') || m.includes('doblo') || m.includes('doblò') || m.includes('expert') || m.includes('boxer')) return 'minivan'

  if ((seats || 0) >= 7) return 'minivan'

  return null
}

export function classifyByFuelType(fuel: string | null | undefined): 'electric' | 'hybrid' | null {
  const f = (fuel || '').toLowerCase()
  if (f.includes('elétrico') || f.includes('eletric') || f.includes('electric')) return 'electric'
  if (f.includes('híbrido') || f.includes('hybrid') || f.includes('híbrido') || f.includes('plug-in')) return 'hybrid'
  return null
}

export function getCategoryLabel(key: VehicleCategory): string {
  const cat = VEHICLE_CATEGORIES.find(c => c.key === key)
  return cat?.label || key
}

export function getCategoryFromListings(listings: Array<{ body_type?: string | null; brand?: string; model?: string; fuel?: string | null }>): Record<VehicleCategory, number> {
  const counts: Record<VehicleCategory, number> = {
    suv: 0,
    hatch: 0,
    sedan: 0,
    pickup: 0,
    minivan: 0,
    coupe: 0,
    convertible: 0,
    wagon: 0,
    electric: 0,
    hybrid: 0,
  }

  for (const listing of listings) {
    const category = classifyVehicleCategory(listing.body_type, listing.brand || '', listing.model || '')
    if (category) counts[category]++
    
    const fuelCategory = classifyByFuelType(listing.fuel)
    if (fuelCategory && !category) counts[fuelCategory]++
  }

  return counts
}