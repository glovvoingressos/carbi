import { MetadataRoute } from 'next'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { MARKETPLACE_SEO_SLUGS, MAJOR_CITIES } from '@/lib/marketplace-seo'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import { slugifyBrand } from '@/lib/brand-utils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

const CORE_PAGES: Array<{ path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '/', priority: 1.0, freq: 'daily' },
  { path: '/carros-a-venda', priority: 1.0, freq: 'daily' },
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
  'eletricos', 'suv-automaticos', 'sedan-automaticos', 'picapes-diesel',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, listingsPage1, listingsPage2] = await Promise.all([
    getAllCars().catch(() => []),
    fetchPublicListingsPage({ page: 1, pageSize: 48, sort: 'recent' }).catch(() => ({ items: [] })),
    fetchPublicListingsPage({ page: 2, pageSize: 48, sort: 'recent' }).catch(() => ({ items: [] })),
  ])

  const uniqueBrands = Array.from(new Set(cars.map((car) => slugifyBrand(car.brand)))).filter(Boolean)
  const modelEntries = groupCarsByModel(cars)

  const allListings = [...listingsPage1.items, ...listingsPage2.items]
  const seenSlugs = new Set<string>()
  const uniqueListings = allListings.filter((l) => {
    if (seenSlugs.has(l.slug)) return false
    seenSlugs.add(l.slug)
    return true
  })

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

  for (const listing of uniqueListings) {
    entries.push({
      url: `${SITE_URL}/anuncios/${listing.slug}`,
      lastModified: new Date(listing.updated_at || listing.published_at || listing.created_at),
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

  return entries
}
