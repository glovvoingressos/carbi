/**
 * Classificação segura de caminhão para anúncios criados fora do fluxo
 * dedicado de caminhões.
 *
 * O formulário de carro grava `vehicle_type = 'car'` por padrão. Quando um
 * vendedor anuncia um caminhão por esse fluxo, o anúncio fica ativo, mas não
 * aparece em /caminhoes — que filtra por `vehicle_type = 'truck'`.
 *
 * As regras abaixo são deliberadamente conservadoras: só marcam como caminhão
 * marcas que no Brasil só vendem comerciais pesados ou modelos com nomenclatura
 * inconfundível de caminhão. Picapes e SUVs (Hilux, Amarok, Ranger, XC60...)
 * continuam como carro.
 */

const fold = (value: string | null | undefined) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/** Marcas que, no mercado brasileiro, não vendem automóveis de passeio. */
const EXCLUSIVE_TRUCK_BRANDS = new Set([
  'scania',
  'iveco',
  'man',
  'daf',
  'sinotruk',
  'hino',
  'international',
  'kenworth',
  'peterbilt',
  'mack',
  'agrale',
])

const canonicalBrandKey = (brand: string) => {
  if (brand.startsWith('mercedes')) return 'mercedes-benz'
  if (brand === 'vw' || brand.startsWith('volkswagen')) return 'volkswagen'
  if (brand.startsWith('iveco')) return 'iveco'
  if (brand.startsWith('scania')) return 'scania'
  if (brand.startsWith('volvo')) return 'volvo'
  return brand
}

/**
 * Nomenclaturas de caminhão das marcas que também vendem carros. Nada aqui
 * colide com os modelos de passeio das mesmas marcas.
 */
const TRUCK_MODEL_PATTERNS: Record<string, RegExp[]> = {
  'mercedes-benz': [
    /\b(actros|axor|atego|accelo|atron|antos|eurocargo)\b/,
    /\bls\s?\d{3,4}\b/,
    /\bl\s?\d{4}\b/,
  ],
  volkswagen: [
    /\b(constellation|worker|meteor|delivery)\b/,
    // Nomenclatura de caminhão: 8.150, 17.190, 24.280, 25.370...
    /\b\d{2}\.\d{3}\b/,
  ],
  volvo: [
    /^(fh|fm|fmx|vm|nh|fe|fl)\b/,
    /\b(fh|fm|fmx)\s?-?\s?\d{2,3}\b/,
  ],
  ford: [/\b(cargo|f-?4000)\b/],
  scania: [/\b[rsgptl]\s?-?\s?\d{2,3}\b/],
  iveco: [/\b(daily|tector|stralis|s-?way|eurocargo|trakker|hi-?road|vertis)\b/],
}

/** Padrões que valem para qualquer marca. */
const GENERIC_TRUCK_PATTERNS = [
  // 25.370, 24.280, 17.190...
  /\b\d{2}\.\d{3}\b/,
  // 6x2, 6x4, 8x2, 8x4 — 4x4 fica de fora porque também é tração de SUV/picape.
  /\b[68]x[24]\b/,
  /\b(caminhao|cavalo mecanico|bitruck|toco)\b/,
]

export type TruckClassificationInput = {
  vehicle_type?: string | null
  title?: string | null
  brand?: string | null
  model?: string | null
  body_type?: string | null
  truck_type?: string | null
  truck_body_type?: string | null
  axles?: number | null
  load_capacity?: number | null
}

export function isTruckListing(input: TruckClassificationInput): boolean {
  if (fold(input.vehicle_type) === 'truck') return true

  // Dados exclusivos de caminhão já presentes no anúncio.
  if (input.truck_type || input.truck_body_type) return true
  if (input.axles != null || input.load_capacity != null) return true

  const brand = fold(input.brand)
  const model = fold(input.model)
  const title = fold(input.title)
  const bodyType = fold(input.body_type)

  if (bodyType === 'caminhao' || bodyType === 'caminhoes') return true

  const brandKey = canonicalBrandKey(brand)
  if (EXCLUSIVE_TRUCK_BRANDS.has(brandKey)) return true

  const haystack = `${model} ${title}`
  if (!haystack.trim()) return false

  if (GENERIC_TRUCK_PATTERNS.some((pattern) => pattern.test(haystack))) return true

  const patterns = TRUCK_MODEL_PATTERNS[brandKey] || []
  return patterns.some((pattern) => pattern.test(model) || pattern.test(title))
}

/** Decide o `vehicle_type` efetivo de um anúncio a partir dos seus dados. */
export function resolveVehicleType(input: TruckClassificationInput): 'car' | 'truck' {
  return isTruckListing(input) ? 'truck' : 'car'
}
