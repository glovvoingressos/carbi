import { MetadataRoute } from 'next'
import { MARKETPLACE_SEO_SLUGS, MAJOR_CITIES, matchesMarketplaceSeoQuery, resolveSeoPreset } from '@/lib/marketplace-seo'
import { getAllTruckSeoParams, hasTruckPresetInventory, resolveTruckPreset } from '@/lib/truck-seo'
import { CATEGORY_INTENT_SLUGS, hasCategoryIntentInventory } from '@/lib/category-intents'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import { slugifyBrand } from '@/lib/brand-utils'
import { getRankingSitemapPaths } from '@/lib/rankings-seo'
import { getAllPublicSitemapListings } from '@/lib/sitemap-listings'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

const CORE_PAGES: Array<{ path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '/', priority: 1.0, freq: 'daily' },
  { path: '/carros-a-venda', priority: 1.0, freq: 'daily' },
  { path: '/caminhoes', priority: 1.0, freq: 'daily' },
  { path: '/caminhoes/buscar', priority: 0.9, freq: 'daily' },
  { path: '/caminhoes/marcas', priority: 0.85, freq: 'weekly' },
  { path: '/caminhoes/categorias', priority: 0.85, freq: 'weekly' },
  { path: '/anunciar-carro', priority: 0.95, freq: 'weekly' },
  { path: '/anunciar-carro-bh', priority: 0.85, freq: 'weekly' },
  { path: '/anunciar-seminovo', priority: 0.95, freq: 'weekly' },
  { path: '/vender-carro', priority: 0.95, freq: 'weekly' },
  { path: '/vender-carro-bh', priority: 0.85, freq: 'weekly' },
  { path: '/vender-carro-belo-horizonte', priority: 0.85, freq: 'weekly' },
  { path: '/vender-carro-rapido', priority: 0.9, freq: 'weekly' },
  { path: '/vender-caminhao', priority: 0.95, freq: 'weekly' },
  { path: '/carros-usados-bh', priority: 0.85, freq: 'weekly' },
  { path: '/marcas', priority: 0.8, freq: 'weekly' },
  { path: '/qual-carro', priority: 0.8, freq: 'weekly' },
  { path: '/rankings', priority: 0.8, freq: 'weekly' },
  { path: '/melhor-carro-aplicativo', priority: 0.8, freq: 'weekly' },
  { path: '/trafego-pago-gratis', priority: 0.8, freq: 'weekly' },
  { path: '/blog', priority: 0.7, freq: 'weekly' },
  { path: '/sobre', priority: 0.5, freq: 'monthly' },
  { path: '/contato', priority: 0.5, freq: 'monthly' },

]

const YEAR_RANGE = Array.from({ length: 7 }, (_, i) => String(2020 + i))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, publicListings] = await Promise.all([
    getAllCars().catch(() => []),
    getAllPublicSitemapListings().catch((error) => {
      console.error('Erro ao gerar URLs de anúncios no sitemap:', error)
      return { cars: [], trucks: [] }
    }),
  ])

  const uniqueBrands = Array.from(new Set(cars.map((car) => slugifyBrand(car.brand)))).filter(Boolean)
  const modelEntries = groupCarsByModel(cars)

  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority, freq } of CORE_PAGES) {
    entries.push({
      url: `${SITE_URL}${path}`,
      changeFrequency: freq,
      priority,
    })
  }

  for (const slug of MARKETPLACE_SEO_SLUGS) {
    const preset = resolveSeoPreset(slug)
    if (!preset || !publicListings.cars.some((listing) => matchesMarketplaceSeoQuery(listing, preset.listingQuery))) continue
    entries.push({
      url: `${SITE_URL}/carros/${slug}`,
      changeFrequency: 'daily',
      priority: 0.85,
    })
  }

  for (const brand of uniqueBrands) {
    const preset = resolveSeoPreset(`marca-${brand}`)
    if (!preset || !publicListings.cars.some((listing) => matchesMarketplaceSeoQuery(listing, preset.listingQuery))) continue
    entries.push({
      url: `${SITE_URL}/carros/marca-${brand}`,
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }

  for (const city of MAJOR_CITIES) {
    const preset = resolveSeoPreset(`cidade-${city.slug}`)
    if (!preset || !publicListings.cars.some((listing) => matchesMarketplaceSeoQuery(listing, preset.listingQuery))) continue
    entries.push({
      url: `${SITE_URL}/carros/cidade-${city.slug}`,
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }

  for (const year of YEAR_RANGE) {
    const preset = resolveSeoPreset(`ano-${year}`)
    if (!preset || !publicListings.cars.some((listing) => matchesMarketplaceSeoQuery(listing, preset.listingQuery))) continue
    entries.push({
      url: `${SITE_URL}/carros/ano-${year}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  for (const brand of uniqueBrands) {
    entries.push({
      url: `${SITE_URL}/marcas/${brand}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Match every truck preset against the public listing snapshot already fetched.
  for (const { slug } of getAllTruckSeoParams()) {
    const preset = resolveTruckPreset(slug)
    if (!preset || !hasTruckPresetInventory(preset, publicListings.trucks)) continue
    const isBrand = slug.startsWith('marca-')
    const isCity = slug.startsWith('cidade-')
    const isYear = slug.startsWith('ano-')
    entries.push({
      url: `${SITE_URL}/caminhoes/${slug}`,
      changeFrequency: isYear ? 'monthly' : isCity ? 'weekly' : 'daily',
      priority: isYear || isCity ? 0.7 : isBrand ? 0.8 : 0.85,
    })
  }

  for (const brand of uniqueBrands) {
    entries.push({
      url: `${SITE_URL}/vender/${brand}`,
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }

  for (const item of modelEntries) {
    const brand = slugifyBrand(item.representative.brand)
    entries.push({
      url: `${SITE_URL}/${brand}/${item.modelSlug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const listing of publicListings.trucks) {
    entries.push({
      url: `${SITE_URL}/caminhoes/anuncio/${listing.slug}`,
      ...getLastModified(listing.updated_at || listing.published_at || listing.created_at),
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }

  for (const listing of publicListings.cars) {
    entries.push({
      url: `${SITE_URL}/anuncios/${listing.slug}`,
      ...getLastModified(listing.updated_at || listing.published_at || listing.created_at),
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }

  for (const intent of CATEGORY_INTENT_SLUGS) {
    if (!hasCategoryIntentInventory(intent, publicListings.cars)) continue
    entries.push({
      url: `${SITE_URL}/categorias/${intent}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const path of getRankingSitemapPaths()) {
    entries.push({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  const seenUrls = new Set<string>()
  return entries.filter((entry) => {
    if (seenUrls.has(entry.url)) return false
    seenUrls.add(entry.url)
    return true
  })
}

function getLastModified(value: string | null | undefined): { lastModified?: Date } {
  if (!value) return {}
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? {} : { lastModified: date }
}
