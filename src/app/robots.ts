import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/minha-conta/', '/admin/'],
    },
    sitemap: 'https://www.carbi.com.br/sitemap.xml',
  }
}
