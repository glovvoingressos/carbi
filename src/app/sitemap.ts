import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.carbi.com.br'
  
  const corePages = [
    '',
    '/anunciar-carro',
    '/anunciar-carro-bh',
    '/vender-carro',
    '/vender-carro-bh',
    '/carros-a-venda',
    '/carros-usados-bh',
  ]

  const brands = ['toyota', 'honda', 'volkswagen', 'fiat', 'chevrolet', 'ford', 'hyundai', 'jeep', 'renault', 'nissan']
  
  const sitemapEntries: MetadataRoute.Sitemap = [
    ...corePages.map(page => ({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1 : 0.8,
    })),
    ...brands.map(brand => ({
      url: `${baseUrl}/vender/${brand}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  ]

  return sitemapEntries
}
