import { getAllPublicSitemapListings } from '@/lib/sitemap-listings'
import { buildImageSitemapXml } from '@/lib/sitemap-xml'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export async function GET() {
  let collections
  try {
    collections = await getAllPublicSitemapListings(true)
  } catch (error) {
    console.error('Erro ao gerar sitemap de imagens:', error)
    return new Response('Sitemap de imagens indisponível: falha ao carregar os anúncios.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
  const unique = [
    ...collections.cars.map((listing) => ({ ...listing, path: `/anuncios/${listing.slug}` })),
    ...collections.trucks.map((listing) => ({ ...listing, path: `/caminhoes/anuncio/${listing.slug}` })),
  ]

  const entries = unique.flatMap((listing) =>
    listing.images?.length ? [{ path: listing.path, images: listing.images }] : [],
  )
  const xml = buildImageSitemapXml(entries, SITE_URL)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
