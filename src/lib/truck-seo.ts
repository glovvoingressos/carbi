import type { Metadata } from 'next'

export const TRUCK_BRANDS = ['Mercedes-Benz', 'Volvo', 'Scania', 'Volkswagen', 'Ford', 'Iveco']
export const TRUCK_CATEGORIES = [
  { slug: 'truck', name: 'Caminhões truck' },
  { slug: 'bitruck', name: 'Bitrucks' },
  { slug: 'cavalo-mecanico', name: 'Cavalos mecânicos' },
  { slug: 'toco', name: 'Caminhões toco' },
]

export function truckListingMetadata(path = '/caminhoes'): Metadata {
  return {
    title: 'Caminhões à venda | Carbi',
    description: 'Encontre caminhões usados e seminovos à venda, compare preços e negocie com segurança na Carbi.',
    keywords: ['caminhões à venda', 'caminhão usado', 'caminhão seminovo', 'comprar caminhão'],
    alternates: { canonical: path },
    openGraph: { title: 'Caminhões à venda | Carbi', description: 'Caminhões usados e seminovos com negociação segura.', url: path, type: 'website' },
  }
}

type TruckCollectionListing = { slug: string; brand: string; model: string; price?: number | null }

export function truckCollectionJsonLd({ url, name, listings }: { url: string; name: string; listings: TruckCollectionListing[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: listings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `/caminhoes/anuncio/${listing.slug}`,
        name: `${listing.brand} ${listing.model}`,
        item: { '@type': 'Product', name: `${listing.brand} ${listing.model}`, offers: listing.price ? { '@type': 'Offer', price: listing.price, priceCurrency: 'BRL' } : undefined },
      })),
    },
  }
}
