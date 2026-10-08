import { MetadataRoute } from 'next'
import { MARKETPLACE_SEO_SLUGS, MAJOR_CITIES, buildTruckSeoPaths } from '@/lib/marketplace-seo'
import { TRUCK_SEO_SLUGS, TRUCK_BRANDS, TRUCK_YEAR_SLUGS, truckBrandSlug } from '@/lib/truck-seo'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import { slugifyBrand } from '@/lib/brand-utils'
import { getRankingSitemapPaths } from '@/lib/rankings-seo'
import { getAllPublicSitemapListings } from '@/lib/sitemap-listings'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

const CORE_PAGES: Array<{ path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '/', priority: 1.0, freq: 'daily' },
  { path: '/carros-a-venda', priority: 1.0, freq: 'daily' },
  { path: '/caminhoes', priority: 1.0, freq: 'daily' },
  { path: '/caminhoes/marcas', priority: 0.85, freq: 'weekly' },
  { path: '/caminhoes/categorias', priority: 0.85, freq: 'weekly' },
  { path: '/anunciar-carro', priority: 0.95, freq: 'weekly' },
  { path: '/anunciar-carro-bh', priority: 0.85, freq: 'weekly' },
  { path: '/anunciar-seminovo', priority: 0.95, freq: 'weekly' },
  { path: '/vender-carro', priority: 0.95, freq: 'weekly' },
  { path: '/vender-carro-bh', priority: 0.85, freq: 'weekly' },
  { path: '/vender-carro-belo-horizonte', priority: 0.85, freq: 'weekly' },
  { path: '/vender-carro-rapido', priority: 0.9, freq: 'weekly' },
  { path: '/carros-usados-bh', priority: 0.85, freq: 'weekly' },
  { path: '/marcas', priority: 0.8, freq: 'weekly' },
  { path: '/qual-carro', priority: 0.8, freq: 'weekly' },
  { path: '/rankings', priority: 0.8, freq: 'weekly' },
  { path: '/melhor-carro-aplicativo', priority: 0.8, freq: 'weekly' },

]

const YEAR_RANGE = Array.from({ length: 7 }, (_, i) => String(2020 + i))

const CATEGORY_INTENTS = [
  'ate-50-mil', 'ate-100-mil', 'economicos', 'para-familia',
  '7-lugares', 'hibridos', 'off-road', 'esportivos',
]

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
      lastModified: new Date(),
      changeFrequency: freq,
      priority,
    })
  }

  for (const slug of MARKETPLACE_SEO_SLUGS) {
    entries.push({
      url: `${SITE_URL}/carros/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    })
  }

  for (const brand of uniqueBrands) {
    entries.push({
      url: `${SITE_URL}/carros/marca-${brand}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }

  for (const city of MAJOR_CITIES) {
    entries.push({
      url: `${SITE_URL}/carros/cidade-${city.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }

  for (const year of YEAR_RANGE) {
    entries.push({
      url: `${SITE_URL}/carros/ano-${year}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  for (const brand of uniqueBrands) {
    entries.push({
      url: `${SITE_URL}/marcas/${brand}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const path of buildTruckSeoPaths().brands.slice(1).concat(buildTruckSeoPaths().categories.slice(1))) {
    entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 })
  }

  // Páginas de aterrissagem de SEO de caminhão (mesmo modelo de /carros/[slug])
  for (const slug of TRUCK_SEO_SLUGS) {
    entries.push({
      url: `${SITE_URL}/caminhoes/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    })
  }

  for (const brand of TRUCK_BRANDS) {
    entries.push({
      url: `${SITE_URL}/caminhoes/marca-${truckBrandSlug(brand)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }

  for (const city of MAJOR_CITIES) {
    entries.push({
      url: `${SITE_URL}/caminhoes/cidade-${city.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  for (const slug of TRUCK_YEAR_SLUGS) {
    entries.push({
      url: `${SITE_URL}/caminhoes/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  for (const brand of uniqueBrands) {
    entries.push({
      url: `${SITE_URL}/vender/${brand}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }

  for (const item of modelEntries) {
    const brand = slugifyBrand(item.representative.brand)
    entries.push({
      url: `${SITE_URL}/${brand}/${item.modelSlug}`,
      lastModified: new Date(),
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

  for (const intent of CATEGORY_INTENTS) {
    entries.push({
      url: `${SITE_URL}/categorias/${intent}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const path of getRankingSitemapPaths()) {
    entries.push({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  return entries
}

function getLastModified(value: string | null | undefined): { lastModified?: Date } {
  if (!value) return {}
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? {} : { lastModified: date }
}
