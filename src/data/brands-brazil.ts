/**
 * Lista completa de marcas de carros vendidas no Brasil (2025/2026).
 *
 * Inclui marcas nacionais, importadas, premium, luxo e chinesas
 * com presença ativa no mercado brasileiro.
 */

export interface BrazilBrand {
  name: string
  slug: string
  origin: string
  localProduction: boolean
  segment: 'nacional' | 'importada' | 'premium' | 'luxo' | 'chinesa' | 'eletrica'
  aliases: string[]
}

export const BRAZIL_BRANDS: BrazilBrand[] = [
  // ── Marcas nacionais / com produção local ──────────────────────────
  { name: 'Volkswagen', slug: 'volkswagen', origin: 'Alemanha', localProduction: true, segment: 'nacional', aliases: ['vw', 'volks'] },
  { name: 'Fiat', slug: 'fiat', origin: 'Itália', localProduction: true, segment: 'nacional', aliases: ['fiat chrysler', 'stellantis'] },
  { name: 'Chevrolet', slug: 'chevrolet', origin: 'EUA', localProduction: true, segment: 'nacional', aliases: ['chevy', 'gm', 'general motors'] },
  { name: 'Toyota', slug: 'toyota', origin: 'Japão', localProduction: true, segment: 'nacional', aliases: [] },
  { name: 'Honda', slug: 'honda', origin: 'Japão', localProduction: true, segment: 'nacional', aliases: [] },
  { name: 'Hyundai', slug: 'hyundai', origin: 'Coreia do Sul', localProduction: true, segment: 'nacional', aliases: ['hundai'] },
  { name: 'Jeep', slug: 'jeep', origin: 'EUA', localProduction: true, segment: 'nacional', aliases: [] },
  { name: 'Renault', slug: 'renault', origin: 'França', localProduction: true, segment: 'nacional', aliases: [] },
  { name: 'Nissan', slug: 'nissan', origin: 'Japão', localProduction: true, segment: 'nacional', aliases: [] },
  { name: 'Citroën', slug: 'citroen', origin: 'França', localProduction: true, segment: 'nacional', aliases: ['citroen', 'citroen'] },
  { name: 'Peugeot', slug: 'peugeot', origin: 'França', localProduction: true, segment: 'nacional', aliases: ['peugeout'] },
  { name: 'Mitsubishi', slug: 'mitsubishi', origin: 'Japão', localProduction: true, segment: 'nacional', aliases: ['mitsubish'] },

  // ── Marcas com produção local (comercial/utilitário) ───────────────
  { name: 'RAM', slug: 'ram', origin: 'EUA', localProduction: true, segment: 'nacional', aliases: ['ram trucks'] },
  { name: 'Suzuki', slug: 'suzuki', origin: 'Japão', localProduction: true, segment: 'nacional', aliases: [] },

  // ── Marcas chinesas ───────────────────────────────────────────────
  { name: 'BYD', slug: 'byd', origin: 'China', localProduction: true, segment: 'chinesa', aliases: ['build your dreams'] },
  { name: 'CAOA Chery', slug: 'caoa-chery', origin: 'China', localProduction: true, segment: 'chinesa', aliases: ['chery', 'caoa chery', 'caoachery'] },
  { name: 'GWM', slug: 'gwm', origin: 'China', localProduction: true, segment: 'chinesa', aliases: ['great wall', 'great wall motors', 'haval'] },
  { name: 'JAC', slug: 'jac', origin: 'China', localProduction: true, segment: 'chinesa', aliases: ['jac motors'] },
  { name: 'Omoda', slug: 'omoda', origin: 'China', localProduction: false, segment: 'chinesa', aliases: ['omoda jaecoo'] },
  { name: 'Jaecoo', slug: 'jaecoo', origin: 'China', localProduction: false, segment: 'chinesa', aliases: [] },
  { name: 'Changan', slug: 'changan', origin: 'China', localProduction: false, segment: 'chinesa', aliases: [] },
  { name: 'Dongfeng', slug: 'dongfeng', origin: 'China', localProduction: false, segment: 'chinesa', aliases: [] },
  { name: 'Exeed', slug: 'exeed', origin: 'China', localProduction: false, segment: 'chinesa', aliases: [] },
  { name: 'Foton', slug: 'foton', origin: 'China', localProduction: true, segment: 'chinesa', aliases: [] },

  // ── Marcas premium ────────────────────────────────────────────────
  { name: 'BMW', slug: 'bmw', origin: 'Alemanha', localProduction: true, segment: 'premium', aliases: ['bayerische'] },
  { name: 'Audi', slug: 'audi', origin: 'Alemanha', localProduction: true, segment: 'premium', aliases: [] },
  { name: 'Mercedes-Benz', slug: 'mercedes-benz', origin: 'Alemanha', localProduction: true, segment: 'premium', aliases: ['mercedes', 'mercedes benz'] },
  { name: 'Volvo', slug: 'volvo', origin: 'Suécia', localProduction: true, segment: 'premium', aliases: [] },
  { name: 'Land Rover', slug: 'land-rover', origin: 'Reino Unido', localProduction: true, segment: 'premium', aliases: ['landrover', 'land rover'] },
  { name: 'Jaguar', slug: 'jaguar', origin: 'Reino Unido', localProduction: false, segment: 'premium', aliases: [] },
  { name: 'Subaru', slug: 'subaru', origin: 'Japão', localProduction: false, segment: 'premium', aliases: [] },
  { name: 'Mini', slug: 'mini', origin: 'Reino Unido', localProduction: false, segment: 'premium', aliases: [] },
  { name: 'Alfa Romeo', slug: 'alfa-romeo', origin: 'Itália', localProduction: false, segment: 'premium', aliases: ['alfa'] },
  { name: 'Kia', slug: 'kia', origin: 'Coreia do Sul', localProduction: false, segment: 'premium', aliases: [] },
  { name: 'Genesis', slug: 'genesis', origin: 'Coreia do Sul', localProduction: false, segment: 'premium', aliases: [] },

  // ── Marcas de luxo ────────────────────────────────────────────────
  { name: 'Porsche', slug: 'porsche', origin: 'Alemanha', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'Lexus', slug: 'lexus', origin: 'Japão', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'Ferrari', slug: 'ferrari', origin: 'Itália', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'Lamborghini', slug: 'lamborghini', origin: 'Itália', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'Maserati', slug: 'maserati', origin: 'Itália', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'McLaren', slug: 'mclaren', origin: 'Reino Unido', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'Aston Martin', slug: 'aston-martin', origin: 'Reino Unido', localProduction: false, segment: 'luxo', aliases: ['aston martin'] },
  { name: 'Rolls-Royce', slug: 'rolls-royce', origin: 'Reino Unido', localProduction: false, segment: 'luxo', aliases: ['rolls royce'] },
  { name: 'Bentley', slug: 'bentley', origin: 'Reino Unido', localProduction: false, segment: 'luxo', aliases: [] },
  { name: 'Bugatti', slug: 'bugatti', origin: 'França', localProduction: false, segment: 'luxo', aliases: [] },

  // ── Marcas de veículos elétricos (dedicadas) ──────────────────────
  { name: 'Tesla', slug: 'tesla', origin: 'EUA', localProduction: false, segment: 'eletrica', aliases: [] },

  // ── Marcas utilitárias/comerciais com presença no Brasil ──────────
  { name: 'Agrale', slug: 'agrale', origin: 'Brasil', localProduction: true, segment: 'nacional', aliases: [] },
  { name: 'Iveco', slug: 'iveco', origin: 'Itália', localProduction: true, segment: 'nacional', aliases: [] },

  // ── Outras marcas com importação/representação no Brasil ──────────
  { name: 'Dodge', slug: 'dodge', origin: 'EUA', localProduction: false, segment: 'importada', aliases: [] },
  { name: 'Chrysler', slug: 'chrysler', origin: 'EUA', localProduction: false, segment: 'importada', aliases: [] },
  { name: 'Smart', slug: 'smart', origin: 'Alemanha', localProduction: false, segment: 'importada', aliases: [] },
  { name: 'Mazda', slug: 'mazda', origin: 'Japão', localProduction: false, segment: 'importada', aliases: [] },
  { name: 'Lifan', slug: 'lifan', origin: 'China', localProduction: false, segment: 'chinesa', aliases: [] },
]

/**
 * Retorna todas as marcas ordenadas por nome.
 */
export function getAllBrazilBrands(): BrazilBrand[] {
  return [...BRAZIL_BRANDS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

/**
 * Retorna marcas filtradas por segmento.
 */
export function getBrandsBySegment(segment: BrazilBrand['segment']): BrazilBrand[] {
  return getAllBrazilBrands().filter(b => b.segment === segment)
}

/**
 * Busca uma marca por slug.
 */
export function getBrandBySlug(slug: string): BrazilBrand | undefined {
  return BRAZIL_BRANDS.find(b => b.slug === slug)
}

/**
 * Busca uma marca por nome ou alias (case-insensitive, sem acentos).
 */
export function findBrand(input: string): BrazilBrand | undefined {
  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return BRAZIL_BRANDS.find(b => {
    const nameNorm = b.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (nameNorm === normalized) return true
    if (b.aliases.some(a => a.toLowerCase() === normalized)) return true
    return false
  })
}

/**
 * Conta o número total de marcas.
 */
export function getBrandCount(): number {
  return BRAZIL_BRANDS.length
}
