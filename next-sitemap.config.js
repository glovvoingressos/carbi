module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.carbi.com.br',
  generateRobotsTxt: true, // Automate robots.txt generation
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/minha-conta/', '/entrar', '/admin/'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.carbi.com.br'}/sitemap-images`,
    ],
  },
  exclude: ['/api/*', '/minha-conta/*', '/entrar', '/admin/*', '/trafego-pago-gratis', '/vender-carro-belo-horizonte', '/anunciar-carro-bh', '/carros/anunciar-gratis', '/carros/cidade-belo-horizonte'],
  sitemapSize: 45000,
  // Keep this legacy generator aligned with app/robots.ts. Its size limit is a
  // split plan; the App Router sitemap throws before emitting an oversized file.
}
