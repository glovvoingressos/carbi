import type { Metadata } from 'next'
import type { ListingsPageInput, TruckListingFilters } from '@/lib/marketplace-server'
import { MAJOR_CITIES } from '@/lib/marketplace-seo'

export const TRUCK_BRANDS = ['Mercedes-Benz', 'Volvo', 'Scania', 'Volkswagen', 'Ford', 'Iveco']
export const TRUCK_CATEGORIES = [
  { slug: 'truck', name: 'Caminhões truck' },
  { slug: 'bitruck', name: 'Bitrucks' },
  { slug: 'cavalo-mecanico', name: 'Cavalos mecânicos' },
  { slug: 'toco', name: 'Caminhões toco' },
]

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export function truckBrandSlug(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/gi, '-')
}

export function canonicalTruckBrand(value: string) {
  const normalized = value.trim().toLowerCase()
  return TRUCK_BRANDS.find((brand) => truckBrandSlug(brand) === normalized || brand.toLowerCase() === normalized) || value
}

/* ────────────────────────────────────────────────────────────
   Páginas de aterrissagem de SEO (mesmo modelo de /carros/[slug])
   ──────────────────────────────────────────────────────────── */

export type TruckSeoPreset = {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  listingQuery: TruckListingFilters
}

export const TRUCK_CATEGORY_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'cavalo-mecanico',
    title: 'Cavalos mecânicos à venda',
    description: 'Cavalos mecânicos usados e seminovos com preço, ano, km e comparação FIPE. Anúncios reais de todo o Brasil.',
    h1: 'Cavalos mecânicos à venda',
    intro: 'Compare cavalos mecânicos anunciados na Carbi por marca, ano, eixos e capacidade de carga.',
    listingQuery: { truckType: 'cavalo-mecanico', sort: 'recent' },
  },
  {
    slug: 'bitruck',
    title: 'Bitrucks à venda',
    description: 'Bitrucks usados e seminovos anunciados na Carbi. Compare preços, ano, km e capacidade de carga.',
    h1: 'Bitrucks à venda',
    intro: 'Bitrucks com dados completos de ano, quilometragem e capacidade de carga.',
    listingQuery: { truckType: 'bitruck', sort: 'recent' },
  },
  {
    slug: 'truck',
    title: 'Caminhões truck à venda',
    description: 'Caminhões truck usados e seminovos na Carbi. Preço, ano, eixos e comparação com a tabela FIPE.',
    h1: 'Caminhões truck à venda',
    intro: 'Caminhões truck anunciados com ficha técnica completa e comparação FIPE.',
    listingQuery: { truckType: 'truck', sort: 'recent' },
  },
  {
    slug: 'toco',
    title: 'Caminhões toco à venda',
    description: 'Caminhões toco usados e seminovos na Carbi, com filtros de preço, ano e capacidade de carga.',
    h1: 'Caminhões toco à venda',
    intro: 'Caminhões toco anunciados na plataforma, prontos para comparar preço e capacidade.',
    listingQuery: { truckType: 'toco', sort: 'recent' },
  },
  {
    slug: 'diesel',
    title: 'Caminhões a diesel à venda',
    description: 'Caminhões a diesel de todas as categorias anunciados na Carbi. Compare preço, ano e km.',
    h1: 'Caminhões a diesel à venda',
    intro: 'Todos os caminhões a diesel anunciados, com dados reais de preço e quilometragem.',
    listingQuery: { fuel: 'diesel', sort: 'recent' },
  },
]

export const TRUCK_PRICE_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'ate-100-mil',
    title: 'Caminhões até R$ 100 mil',
    description: 'Anúncios de caminhões até R$ 100 mil com ano, km e comparação FIPE. Oportunidades reais.',
    h1: 'Caminhões até R$ 100 mil',
    intro: 'Caminhões anunciados com teto de R$ 100 mil, ordenados do menor para o maior preço.',
    listingQuery: { priceMax: 100000, sort: 'price_asc' },
  },
  {
    slug: 'ate-150-mil',
    title: 'Caminhões até R$ 150 mil',
    description: 'Caminhões até R$ 150 mil anunciados na Carbi, com dados reais e comparação FIPE.',
    h1: 'Caminhões até R$ 150 mil',
    intro: 'Seleção de caminhões até R$ 150 mil para comparar oportunidade e estado de conservação.',
    listingQuery: { priceMax: 150000, sort: 'price_asc' },
  },
  {
    slug: 'ate-200-mil',
    title: 'Caminhões até R$ 200 mil',
    description: 'Caminhões usados e seminovos até R$ 200 mil. Veja preços, ano, km e a ficha técnica completa.',
    h1: 'Caminhões até R$ 200 mil',
    intro: 'Anúncios ativos de caminhões até R$ 200 mil, com ficha técnica e comparação FIPE.',
    listingQuery: { priceMax: 200000, sort: 'price_asc' },
  },
  {
    slug: 'ate-300-mil',
    title: 'Caminhões até R$ 300 mil',
    description: 'Caminhões até R$ 300 mil anunciados na Carbi, incluindo cavalos mecânicos e bitrucks.',
    h1: 'Caminhões até R$ 300 mil',
    intro: 'Caminhões com valor até R$ 300 mil, incluindo categorias de maior capacidade.',
    listingQuery: { priceMax: 300000, sort: 'price_asc' },
  },
  {
    slug: 'ate-500-mil',
    title: 'Caminhões até R$ 500 mil',
    description: 'Caminhões seminovos e novos até R$ 500 mil anunciados na Carbi com comparação FIPE.',
    h1: 'Caminhões até R$ 500 mil',
    intro: 'Caminhões de maior valor agregado anunciados na plataforma, com ficha completa.',
    listingQuery: { priceMax: 500000, sort: 'price_asc' },
  },
  {
    slug: 'acima-de-300-mil',
    title: 'Caminhões acima de R$ 300 mil',
    description: 'Caminhões acima de R$ 300 mil anunciados na Carbi. Cavalos mecânicos e bitrucks de alto valor.',
    h1: 'Caminhões acima de R$ 300 mil',
    intro: 'Caminhões de alto valor anunciados, para quem precisa de capacidade e tecnologia mais recentes.',
    listingQuery: { priceMin: 300000, sort: 'price_desc' },
  },
]

export const TRUCK_COMBINED_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'cavalo-mecanico-ate-300-mil',
    title: 'Cavalos mecânicos até R$ 300 mil',
    description: 'Cavalos mecânicos até R$ 300 mil anunciados na Carbi. Compare preço, ano, eixos e FIPE.',
    h1: 'Cavalos mecânicos até R$ 300 mil',
    intro: 'Cavalos mecânicos nessa faixa de preço com ficha técnica completa.',
    listingQuery: { truckType: 'cavalo-mecanico', priceMax: 300000, sort: 'price_asc' },
  },
  {
    slug: 'cavalo-mecanico-ate-500-mil',
    title: 'Cavalos mecânicos até R$ 500 mil',
    description: 'Cavalos mecânicos seminovos até R$ 500 mil com comparação FIPE e dados reais.',
    h1: 'Cavalos mecânicos até R$ 500 mil',
    intro: 'Cavalos mecânicos mais recentes e completos anunciados na plataforma.',
    listingQuery: { truckType: 'cavalo-mecanico', priceMax: 500000, sort: 'price_asc' },
  },
  {
    slug: 'bitruck-ate-200-mil',
    title: 'Bitrucks até R$ 200 mil',
    description: 'Bitrucks até R$ 200 mil anunciados na Carbi, com ano, km e capacidade de carga.',
    h1: 'Bitrucks até R$ 200 mil',
    intro: 'Bitrucks nessa faixa de preço para comparar capacidade de carga e estado.',
    listingQuery: { truckType: 'bitruck', priceMax: 200000, sort: 'price_asc' },
  },
  {
    slug: 'truck-ate-150-mil',
    title: 'Caminhões truck até R$ 150 mil',
    description: 'Caminhões truck até R$ 150 mil anunciados na Carbi com dados reais de preço e ano.',
    h1: 'Caminhões truck até R$ 150 mil',
    intro: 'Caminhões truck até R$ 150 mil, ordenados pelo menor preço.',
    listingQuery: { truckType: 'truck', priceMax: 150000, sort: 'price_asc' },
  },
  {
    slug: 'toco-ate-150-mil',
    title: 'Caminhões toco até R$ 150 mil',
    description: 'Caminhões toco até R$ 150 mil anunciados na Carbi. Compare preço, ano e capacidade.',
    h1: 'Caminhões toco até R$ 150 mil',
    intro: 'Caminhões toco até R$ 150 mil anunciados na plataforma.',
    listingQuery: { truckType: 'toco', priceMax: 150000, sort: 'price_asc' },
  },
  {
    slug: 'caminhoes-bau',
    title: 'Caminhões baú à venda',
    description: 'Caminhões com carroceria baú anunciados na Carbi. Compare preço, ano, km e categoria.',
    h1: 'Caminhões baú à venda',
    intro: 'Caminhões com carroceria baú para transporte de carga seca e volume.',
    listingQuery: { bodyType: 'bau', sort: 'recent' },
  },
]

export const TRUCK_TOPIC_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'mais-baratos',
    title: 'Caminhões mais baratos à venda',
    description: 'Os caminhões com menor preço anunciados na Carbi, em ordem crescente.',
    h1: 'Caminhões mais baratos',
    intro: 'Ordenação por menor preço para encontrar rapidamente as entradas do mercado.',
    listingQuery: { sort: 'price_asc' },
  },
  {
    slug: 'mais-recentes',
    title: 'Caminhões recém-anunciados',
    description: 'Acompanhe os caminhões anunciados mais recentemente na Carbi.',
    h1: 'Caminhões recém-anunciados',
    intro: 'Atualização frequente de anúncios de caminhões na plataforma.',
    listingQuery: { sort: 'recent' },
  },
  {
    slug: 'anunciar-gratis',
    title: 'Anunciar caminhão grátis',
    description: 'Publique seu caminhão grátis na Carbi, com ficha técnica, fotos e chat interno.',
    h1: 'Anunciar caminhão grátis',
    intro: 'Publique seu caminhão sem custo e alcance compradores de todo o Brasil.',
    listingQuery: { sort: 'recent' },
  },
]

export const TRUCK_SEO_PRESETS: TruckSeoPreset[] = [
  ...TRUCK_TOPIC_PRESETS,
  ...TRUCK_PRICE_PRESETS,
  ...TRUCK_CATEGORY_PRESETS,
  ...TRUCK_COMBINED_PRESETS,
]

export const TRUCK_SEO_SLUGS = TRUCK_SEO_PRESETS.map((preset) => preset.slug)

export const TRUCK_QUICK_LINKS: Array<{ href: string; label: string }> = [
  { href: '/caminhoes/cavalo-mecanico', label: 'Cavalos mecânicos' },
  { href: '/caminhoes/bitruck', label: 'Bitrucks' },
  { href: '/caminhoes/truck', label: 'Caminhões truck' },
  { href: '/caminhoes/toco', label: 'Toco' },
  { href: '/caminhoes/ate-150-mil', label: 'Até R$ 150 mil' },
  { href: '/caminhoes/ate-300-mil', label: 'Até R$ 300 mil' },
  { href: '/caminhoes/acima-de-300-mil', label: 'Acima de R$ 300 mil' },
  { href: '/caminhoes/mais-baratos', label: 'Mais baratos' },
  { href: '/caminhoes/mais-recentes', label: 'Mais recentes' },
  { href: '/caminhoes/diesel', label: 'A diesel' },
]

const TRUCK_YEAR_RANGE = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']

export const TRUCK_YEAR_SLUGS = TRUCK_YEAR_RANGE.map((year) => `ano-${year}`)

/** Aceita os presets fixos e também marca-, cidade- e ano- (como em /carros/[slug]). */
export function resolveTruckPreset(slug: string): TruckSeoPreset | null {
  const normalized = decodeURIComponent(slug || '').trim().toLowerCase()
  const direct = TRUCK_SEO_PRESETS.find((preset) => preset.slug === normalized)
  if (direct) return direct

  if (normalized.startsWith('marca-')) {
    const brandSlug = normalized.replace('marca-', '')
    const brand = canonicalTruckBrand(brandSlug.replace(/-/g, ' '))
    const label = brand.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Caminhões ${label} à venda`,
      description: `Caminhões ${label} usados e seminovos anunciados na Carbi, com preço, ano, km e comparação FIPE.`,
      h1: `Caminhões ${label} à venda`,
      intro: `Anúncios de caminhões ${label} para comparar preço, ano e categoria.`,
      listingQuery: { brand: `%${label}%`, sort: 'recent' },
    }
  }

  if (normalized.startsWith('cidade-')) {
    const cityName = normalized.replace('cidade-', '').replace(/-/g, ' ')
    const label = cityName.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Caminhões em ${label}`,
      description: `Caminhões à venda em ${label} com atualização constante de preço e disponibilidade.`,
      h1: `Caminhões em ${label}`,
      intro: `Anúncios ativos de caminhões na cidade de ${label}.`,
      listingQuery: { city: `%${label}%`, sort: 'recent' },
    }
  }

  if (normalized.startsWith('ano-')) {
    const year = normalized.replace('ano-', '')
    if (/^\d{4}$/.test(year)) {
      return {
        slug: normalized,
        title: `Caminhões ${year} à venda`,
        description: `Caminhões do ano ${year} anunciados na Carbi. Compare preço, km e categoria.`,
        h1: `Caminhões ${year} à venda`,
        intro: `Anúncios de caminhões do ano ${year} publicados na plataforma.`,
        listingQuery: { yearMin: Number(year), yearMax: Number(year), sort: 'recent' },
      }
    }
  }

  return null
}

export function getAllTruckSeoParams(): Array<{ slug: string }> {
  const slugs = [
    ...TRUCK_SEO_SLUGS,
    ...TRUCK_BRANDS.map((brand) => `marca-${truckBrandSlug(brand)}`),
    ...MAJOR_CITIES.map((city) => `cidade-${city.slug}`),
    ...TRUCK_YEAR_SLUGS,
  ]
  return slugs.map((slug) => ({ slug }))
}

export function truckPresetMetadata(preset: TruckSeoPreset, hasParameters = false): Metadata {
  const canonicalUrl = `${SITE_URL}/caminhoes/${preset.slug}`
  return {
    title: preset.title,
    description: preset.description,
    keywords: ['caminhões à venda', 'caminhão usado', preset.h1.toLowerCase()],
    alternates: { canonical: canonicalUrl },
    // Filtros aplicados na URL não devem competir com a página limpa no índice
    robots: hasParameters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: preset.title,
      description: preset.description,
      url: canonicalUrl,
      type: 'website',
    },
  }
}

export function truckListingMetadata(path = '/caminhoes'): Metadata {
  return {
    title: 'Caminhões à venda',
    description: 'Encontre caminhões usados e seminovos à venda, compare preços e negocie com segurança na Carbi.',
    keywords: ['caminhões à venda', 'caminhão usado', 'caminhão seminovo', 'comprar caminhão'],
    alternates: { canonical: path },
    openGraph: { title: 'Caminhões à venda', description: 'Caminhões usados e seminovos com negociação segura.', url: path, type: 'website' },
  }
}

type TruckCollectionListing = { slug: string; brand: string; model: string; price?: number | null }

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function truckCollectionJsonLd({ url, name, listings }: { url: string; name: string; listings: TruckCollectionListing[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: listings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `/caminhoes/anuncio/${listing.slug}`,
        name: `${listing.brand} ${listing.model}`,
        item: { '@type': 'Product', name: `${listing.brand} ${listing.model}`, offers: listing.price ? { '@type': 'Offer', price: listing.price, priceCurrency: 'BRL' } : undefined },
      })),
    },
  }
}

export function truckBrowseJsonLd({ name, description, url, items }: { name: string; description: string; url: string; items: Array<{ name: string; url: string }> }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  }
}

export type TruckFaq = { q: string; a: string }

export function truckFaqJsonLd(faqs: TruckFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

export const TRUCK_FAQ: TruckFaq[] = [
  {
    q: 'Como comparar o preço de um caminhão usado?',
    a: 'Cada anúncio na Carbi mostra o preço pedido, o ano, a quilometragem e a comparação com a tabela FIPE. Use esses dados para avaliar se o valor está justo antes de negociar.',
  },
  {
    q: 'O que significam truck, bitruck, cavalo mecânico e toco?',
    a: 'São categorias de caminhão. O toco tem um eixo traseiro simples, o truck tem dois eixos traseiros, o bitruck combina eixos com maior capacidade de carga e o cavalo mecânico é feito para tracionar semirreboques.',
  },
  {
    q: 'Posso anunciar meu caminhão gratuitamente?',
    a: 'Sim. O anúncio de caminhão é gratuito, com ficha técnica, fotos e chat interno para negociar sem expor seu telefone.',
  },
  {
    q: 'A consulta pela placa funciona para caminhões?',
    a: 'Sim. A busca por placa retorna marca, modelo, ano e versão do caminhão para preencher o anúncio em poucos passos.',
  },
]

export function buildTruckSeoPaths() {
  return {
    brands: ['/caminhoes/marcas', ...TRUCK_BRANDS.map((brand) => `/caminhoes/marca/${truckBrandSlug(brand)}`)],
    categories: ['/caminhoes/categorias', ...TRUCK_CATEGORIES.map((category) => `/caminhoes?truck_type=${category.slug}`)],
  }
}

export type TruckSeoInput = ListingsPageInput
