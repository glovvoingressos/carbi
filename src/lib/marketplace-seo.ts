import { ListingsPageInput, ListingSort } from '@/lib/marketplace-server'

export type MarketplaceSeoPreset = {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  listingQuery: ListingsPageInput
}

const PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'ate-50-mil',
    title: 'Carros até R$ 50 mil | Carbi',
    description: 'Anúncios de carros até R$ 50 mil com preços atualizados e dados reais.',
    h1: 'Carros até R$ 50 mil',
    intro: 'Explore anúncios ativos com teto de R$ 50 mil para comparar oportunidades reais.',
    listingQuery: { priceMax: 50000, sort: 'price_asc' },
  },
  {
    slug: 'ate-80-mil',
    title: 'Carros até R$ 80 mil | Carbi',
    description: 'Veja opções de carros até R$ 80 mil em anúncios atualizados diariamente.',
    h1: 'Carros até R$ 80 mil',
    intro: 'Seleção atualizada com anúncios reais para quem está pesquisando carros nessa faixa de preço.',
    listingQuery: { priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'suv',
    title: 'SUVs à venda | Carbi',
    description: 'Anúncios de SUVs com preços, quilometragem e ano/modelo atualizados.',
    h1: 'SUVs à venda',
    intro: 'Descubra SUVs publicados na plataforma e acompanhe oportunidades por preço e ano.',
    listingQuery: { bodyType: 'suv', sort: 'recent' },
  },
  {
    slug: 'automaticos',
    title: 'Carros automáticos à venda | Carbi',
    description: 'Carros automáticos em anúncios reais com filtros de preço, km e ano.',
    h1: 'Carros automáticos à venda',
    intro: 'Lista de anúncios ativos para quem prefere câmbio automático.',
    listingQuery: { transmission: 'autom', sort: 'recent' },
  },
  {
    slug: 'mais-baratos',
    title: 'Carros mais baratos à venda | Carbi',
    description: 'Veja os anúncios com menor preço na plataforma em ordem crescente.',
    h1: 'Carros mais baratos',
    intro: 'Ordenação por menor preço para facilitar a descoberta das melhores opções.',
    listingQuery: { sort: 'price_asc' },
  },
  {
    slug: 'mais-recentes',
    title: 'Carros recém-anunciados | Carbi',
    description: 'Acompanhe os anúncios mais recentes de carros com atualização em tempo real.',
    h1: 'Carros recém-anunciados',
    intro: 'Atualização frequente de anúncios para quem gosta de acompanhar novidades.',
    listingQuery: { sort: 'recent' },
  },
  {
    slug: 'suv-ate-80-mil',
    title: 'SUVs até R$ 80 mil | Carbi',
    description: 'SUVs anunciados até R$ 80 mil com dados reais de preço e quilometragem.',
    h1: 'SUVs até R$ 80 mil',
    intro: 'Navegue por anúncios de SUVs nessa faixa de preço com ordenação inteligente.',
    listingQuery: { bodyType: 'suv', priceMax: 80000, sort: 'price_asc' },
  },
]

function decodeSlug(slug: string): string {
  return decodeURIComponent(slug || '').trim().toLowerCase()
}

export function resolveSeoPreset(slug: string): MarketplaceSeoPreset | null {
  const normalized = decodeSlug(slug)
  const direct = PRESETS.find((preset) => preset.slug === normalized)
  if (direct) return direct

  if (normalized.startsWith('marca-')) {
    const brandName = normalized.replace('marca-', '').replace(/-/g, ' ')
    const titleBrand = brandName.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Carros ${titleBrand} à venda | Carbi`,
      description: `Explore anúncios ativos da marca ${titleBrand} com preços e quilometragem atualizados.`,
      h1: `Carros ${titleBrand} à venda`,
      intro: `Anúncios reais da marca ${titleBrand} para quem quer acompanhar preços e oportunidades.`,
      listingQuery: { brand: `%${titleBrand}%`, sort: 'recent' },
    }
  }

  if (normalized.startsWith('cidade-')) {
    const cityName = normalized.replace('cidade-', '').replace(/-/g, ' ')
    const titleCity = cityName.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Carros em ${titleCity} | Carbi`,
      description: `Veja anúncios de carros em ${titleCity} com atualização constante de preço e disponibilidade.`,
      h1: `Carros em ${titleCity}`,
      intro: `Explore os anúncios ativos na cidade de ${titleCity} com foco em descoberta e comparação.`,
      listingQuery: { city: `%${titleCity}%`, sort: 'recent' },
    }
  }

  return null
}

export const QUICK_LINKS: Array<{ href: string; label: string }> = [
  { href: '/carros/ate-50-mil', label: 'Até R$ 50 mil' },
  { href: '/carros/ate-80-mil', label: 'Até R$ 80 mil' },
  { href: '/carros/suv', label: 'SUVs' },
  { href: '/carros/automaticos', label: 'Automáticos' },
  { href: '/carros/mais-baratos', label: 'Mais baratos' },
  { href: '/carros/mais-recentes', label: 'Mais recentes' },
]

export const ALLOWED_SORTS: ListingSort[] = ['recent', 'price_asc', 'price_desc', 'mileage_asc', 'year_desc']
