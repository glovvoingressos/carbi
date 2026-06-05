import { MetadataRoute } from 'next'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { MARKETPLACE_SEO_SLUGS } from '@/lib/marketplace-seo'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import { slugifyBrand } from '@/lib/brand-utils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

const CORE_PAGES = [
  '/',
  '/carros-a-venda',
  '/anunciar-carro',
  '/anunciar-carro-bh',
  '/anunciar-seminovo',
  '/vender-carro',
  '/vender-carro-bh',
  '/vender-carro-belo-horizonte',
  '/vender-carro-rapido',
  '/carros-usados-bh',
  '/marcas',
  '/qual-carro',
  '/rankings',
  '/melhor-carro-aplicativo',
  '/caminhoes',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, listingsPage] = await Promise.all([
    getAllCars().catch(() => []),
    fetchPublicListingsPage({ page: 1, pageSize: 100, sort: 'recent' }).catch(() => ({ items: [] })),
  ])

  const modelEntries = groupCarsByModel(cars)
    .map((item) => {
      const brand = slugifyBrand(item.representative.brand)
      const model = item.modelSlug
      return {
        url: `${SITE_URL}/${brand}/${model}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })

  const brandEntries = Array.from(
    new Set(cars.map((car) => slugifyBrand(car.brand))),
  ).slice(0, 80).map((brand) => ({
    url: `${SITE_URL}/vender/${brand}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const seoPresetEntries = MARKETPLACE_SEO_SLUGS.map((slug) => ({
    url: `${SITE_URL}/carros/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  const listingEntries = listingsPage.items.slice(0, 100).map((listing) => ({
    url: `${SITE_URL}/anuncios/${listing.slug}`,
    lastModified: new Date(listing.updated_at || listing.published_at || listing.created_at),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  return [
    ...CORE_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: path === '/' ? 1 : 0.9,
    })),
    ...seoPresetEntries,
    ...brandEntries,
    ...modelEntries,
    ...listingEntries,
  ]
}
