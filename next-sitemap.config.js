module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.carbi.com.br',
  generateRobotsTxt: true, // Automate robots.txt generation
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      // You can add disallow rules here if needed later (e.g. /admin)
    ],
  },
  exclude: ['/api/*'], // Exclude inner API routes from indexation
  // Automatically ping search engines when robots.txt is requested isn't natively supported,
  // but it generates a sitemap index and sitemaps array structure perfectly for thousands of pages.
}
