import { getAllPublicSitemapListings } from '@/lib/sitemap-listings'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export async function GET() {
  const { cars, trucks } = await getAllPublicSitemapListings(true)
  const listings = [
    ...cars.map((listing) => ({ ...listing, path: `/anuncios/${listing.slug}` })),
    ...trucks.map((listing) => ({ ...listing, path: `/caminhoes/anuncio/${listing.slug}` })),
  ]

  const urls = listings
    .filter((l) => l.images && l.images.length > 0)
    .map((listing) => {
      const images = [...listing.images]
      const imageTags = images
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 5)
        .map(
          (img) => `    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
    </image:image>`,
        )
        .join('\n')

      return `  <url>
    <loc>${escapeXml(`${SITE_URL}${listing.path}`)}</loc>
${imageTags}
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
