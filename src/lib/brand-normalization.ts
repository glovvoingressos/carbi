/**
 * Normalização de Marcas de Veículos
 * 
 * Resolve inconsistências de grafia que causam falhas no matching:
 * - Citroen vs Citroën
 * - Ram vs RAM
 * - CAOA Chery vs Chery vs Caoa Chery
 * - Omoda vs Omoda Jaecoo vs Jaecoo
 * - GWM vs Haval
 */

const BRAND_CANONICAL_MAP: Record<string, string> = {
  // Citroen
  'citroen': 'Citroën',
  'citroën': 'Citroën',
  
  // RAM
  'ram': 'RAM',
  'ram trucks': 'RAM',
  
  // CAOA Chery
  'caoa chery': 'CAOA Chery',
  'chery': 'CAOA Chery',
  'caoachery': 'CAOA Chery',
  
  // Omoda / Jaecoo
  'omoda': 'Omoda',
  'omoda jaecoo': 'Omoda Jaecoo',
  'jaecoo': 'Jaecoo',
  
  // GWM / Haval
  'gwm': 'GWM',
  'haval': 'GWM',
  'great wall': 'GWM',
  
  // BYD
  'byd': 'BYD',
  
  // Volkswagen
  'volkswagen': 'Volkswagen',
  'vw': 'Volkswagen',
  'v.w.': 'Volkswagen',
  
  // Chevrolet
  'chevrolet': 'Chevrolet',
  'chevy': 'Chevrolet',
  'gm': 'Chevrolet',
  
  // Mercedes
  'mercedes-benz': 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes': 'Mercedes-Benz',
  
  // Land Rover
  'land rover': 'Land Rover',
  'landrover': 'Land Rover',
  
  // Alfa Romeo
  'alfa romeo': 'Alfa Romeo',
  'alfaromeo': 'Alfa Romeo',
  
  // Others that might have variations
  'land-rover': 'Land Rover',
  'alfa-romeo': 'Alfa Romeo',
  'aston martin': 'Aston Martin',
  'aston-martin': 'Aston Martin',
}

/**
 * Normaliza uma marca para sua forma canônica
 */
export function normalizeBrand(brand: string): string {
  if (!brand) return brand
  
  const normalized = brand
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos para comparação
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Busca no mapa de normalização
  const canonical = BRAND_CANONICAL_MAP[normalized]
  return canonical || brand // Retorna original se não encontrar mapping
}

/**
 * Verifica se duas marcas são equivalentes
 */
export function brandsAreEquivalent(brand1: string, brand2: string): boolean {
  if (!brand1 || !brand2) return false
  
  const norm1 = normalizeBrand(brand1)
  const norm2 = normalizeBrand(brand2)
  
  // Matching exato após normalização
  if (norm1 === norm2) return true
  
  // Matching parcial (ex: "omoda" encontra "omoda jaecoo")
  const lower1 = norm1.toLowerCase()
  const lower2 = norm2.toLowerCase()
  if (lower1.includes(lower2) || lower2.includes(lower1)) return true
  
  // Keywords relacionadas (Omoda/Chery)
  const omodaKeywords = ['omoda', 'chery', 'caoa']
  const words1 = lower1.split(' ')
  const words2 = lower2.split(' ')
  const hasCommonKeyword = words1.some(w1 => 
    omodaKeywords.includes(w1) && words2.some(w2 => omodaKeywords.includes(w2))
  )
  if (hasCommonKeyword) return true
  
  return false
}
