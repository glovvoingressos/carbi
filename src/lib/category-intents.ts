import type { ListingPublic } from '@/lib/marketplace'
import type { ListingsPageInput, PublicSitemapListing } from '@/lib/marketplace-server'
import { matchesMarketplaceSeoQuery } from '@/lib/marketplace-seo'
import { normalizeBodyType, normalizeFuel } from '@/lib/vehicle-filter-normalization'

type CategoryIntentListing = Pick<
  ListingPublic,
  'price' | 'mileage' | 'fuel' | 'engine' | 'body_type' | 'doors' | 'optional_items' | 'horsepower'
>

export type IntentData = {
  title: string
  desc: string
  h1: string
  filter: (listing: CategoryIntentListing) => boolean
  query?: ListingsPageInput
}

export const INTENTS: Record<string, IntentData> = {
  'ate-50-mil': {
    title: 'Melhores Carros até 50 mil | Opções Baratas e Seguras',
    desc: 'Buscando um carro até 50 mil reais? Confira anúncios reais com preços atualizados, fotos e comparação FIPE.',
    h1: 'Melhores Carros até 50 mil reais',
    query: { vehicle_type: 'car', priceMax: 50000, sort: 'price_asc' },
    filter: (listing) => listing.price <= 50000,
  },
  'ate-100-mil': {
    title: 'Melhores Carros até 100 mil | Custo Benefício',
    desc: 'Encontre carros até 100 mil reais na Carbi. Compare SUVs, sedans e hatches com valor atualizado de mercado.',
    h1: 'Melhores Carros até 100 mil reais',
    query: { vehicle_type: 'car', priceMax: 100000, priceMin: 50000, sort: 'price_asc' },
    filter: (listing) => listing.price <= 100000 && listing.price > 50000,
  },
  economicos: {
    title: 'Carros Mais Econômicos | Baixo Consumo de Combustível',
    desc: 'Descubra anúncios reais com foco em baixo consumo, manutenção acessível e melhor custo por uso.',
    h1: 'Carros Mais Econômicos do Brasil',
    query: { vehicle_type: 'car', sort: 'mileage_asc' },
    filter: (listing) => {
      const fuel = `${listing.fuel} ${listing.engine || ''}`.toLowerCase()
      return listing.mileage <= 70000 || /flex|gasoline|hybrid|electric/.test(fuel)
    },
  },
  'para-familia': {
    title: 'Melhores Carros para Família | Espaço e Porta Malas Grande',
    desc: 'Para viajar com conforto e levar tudo. Veja anúncios reais com bom espaço interno e carrocerias familiares.',
    h1: 'Melhores Carros para Família',
    query: { vehicle_type: 'car', bodyType: ['suv', 'sedan', 'pickup'], sort: 'recent' },
    filter: (listing) => /suv|sedan|pickup|van/.test((listing.body_type || '').toLowerCase()) || (listing.doors || 0) >= 4,
  },
  '7-lugares': {
    title: 'Carros de 7 Lugares | Melhores Opções para Grupos Grandes',
    desc: 'Precisa de mais espaço? Confira uma seleção de anúncios reais mais adequados para famílias grandes e viagens.',
    h1: 'Melhores Carros de 7 Lugares',
    query: { vehicle_type: 'car', bodyType: ['suv', 'pickup'], sort: 'recent' },
    filter: (listing) => /suv|pickup|van/.test((listing.body_type || '').toLowerCase()) || (listing.doors || 0) >= 4,
  },
  hibridos: {
    title: 'Carros Híbridos e Sustentáveis | Tecnologia e Economia',
    desc: 'O futuro chegou. Conheça os anúncios reais de híbridos no Brasil, unindo desempenho e economia.',
    h1: 'Melhores Carros Híbridos',
    query: { vehicle_type: 'car', fuel: 'hybrid', sort: 'recent' },
    filter: (listing) => /hybrid|híbrido/.test(`${listing.fuel} ${listing.engine}`.toLowerCase()),
  },
  'off-road': {
    title: 'Melhores Carros Off-Road | Tração 4x4 e Aventura',
    desc: 'Para quem não tem medo de estrada ruim. Veja anúncios reais com foco em robustez e aventura.',
    h1: 'Carros Selecionados para Off-Road',
    query: { vehicle_type: 'car', bodyType: ['pickup', 'suv'], sort: 'recent' },
    filter: (listing) => /pickup|suv|awd|4x4|4wd/.test(`${listing.body_type} ${listing.engine} ${listing.optional_items.join(' ')}`.toLowerCase()),
  },
  esportivos: {
    title: 'Carros Esportivos de Alta Performance | Velocidade e Design',
    desc: 'Paixão por dirigir. Confira anúncios reais com foco em desempenho, potência e desenho agressivo.',
    h1: 'Carros Esportivos e de Performance',
    query: { vehicle_type: 'car', sort: 'recent' },
    filter: (listing) => (listing.horsepower || 0) >= 200 || /turbo|sport|tsi|tfs/i.test(`${listing.engine} ${listing.optional_items.join(' ')}`),
  },
}

export const CATEGORY_INTENT_SLUGS = Object.keys(INTENTS)

export function resolveCategoryIntent(slug: string): IntentData | null {
  return INTENTS[slug] || null
}

export function hasCategoryIntentInventory(slug: string, inventory: PublicSitemapListing[]): boolean {
  const intent = resolveCategoryIntent(slug)
  if (!intent) return false

  const matchingQuery = inventory.filter((listing) =>
    matchesMarketplaceSeoQuery(listing, intent.query || { vehicle_type: 'car' }),
  )
  const sort = intent.query?.sort || 'recent'
  matchingQuery.sort((left, right) => {
    const leftValue = sort === 'price_asc' ? left.price : sort === 'price_desc' ? left.price : sort === 'mileage_asc' ? left.mileage : sort === 'year_desc' ? left.year_model : null
    const rightValue = sort === 'price_asc' ? right.price : sort === 'price_desc' ? right.price : sort === 'mileage_asc' ? right.mileage : sort === 'year_desc' ? right.year_model : null
    if (leftValue != null && rightValue != null && leftValue !== rightValue) {
      return sort === 'price_desc' || sort === 'year_desc' ? rightValue - leftValue : leftValue - rightValue
    }
    return new Date(right.published_at || right.created_at).getTime() - new Date(left.published_at || left.created_at).getTime()
  })

  // The category page scans at most three 48-item pages. Mirror that visible
  // inventory window so it is not listed in the sitemap while rendering empty.
  return matchingQuery.slice(0, 144).some((listing) => {
    return intent.filter({
      price: listing.price ?? Number.NaN,
      mileage: listing.mileage ?? Number.NaN,
      fuel: normalizeFuel(listing.fuel),
      engine: listing.engine || null,
      body_type: normalizeBodyType(listing.body_type),
      doors: listing.doors ?? null,
      optional_items: listing.optional_items || [],
      horsepower: listing.horsepower ?? null,
    })
  })
}
