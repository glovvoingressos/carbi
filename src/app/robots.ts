import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/minha-conta/', '/entrar', '/admin/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'}/sitemap.xml`,
  }
}
