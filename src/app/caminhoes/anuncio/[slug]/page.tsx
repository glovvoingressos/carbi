import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingBySlug, getRelatedListings, getSellerInfo } from '@/lib/marketplace-server'
import { getFipeComparison } from '@/lib/marketplace'
import VehicleDetailView from '@/components/marketplace/VehicleDetailView'
import { heroFont } from '@/components/home/home-font'
import { BreadcrumbSchema, VehicleSchema } from '@/components/seo/JSONLD'
import { truckListingMetadata } from '@/lib/truck-seo'
import { formatBRL } from '@/data/cars'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const listing = await getPublicListingBySlug((await params).slug)
  if (!listing || listing.vehicle_type !== 'truck') {
    return { title: 'Anúncio não encontrado', robots: { index: false, follow: false } }
  }

  const listingName = [listing.brand, listing.model, listing.version, listing.year_model]
    .filter(Boolean)
    .join(' ')
  const price = formatBRL(Number(listing.price))
  const title = `${listingName} por ${price} em ${listing.city}`
  const socialTitle = `${title} | Carbi`
  const fipeText = listing.fipe_price
    ? ' Comparação com a FIPE disponível.'
    : ''
  const description = truncateDescription(
    `${listingName} por ${price} em ${listing.city}/${listing.state}. Veja preço, ${listing.mileage.toLocaleString('pt-BR')} km e ficha técnica do caminhão na Carbi.${fipeText}`,
  )
  const imageUrl = listing.images?.find((image) => image.is_primary)?.url || listing.images?.[0]?.url
  const canonical = `/caminhoes/anuncio/${listing.slug}`

  return {
    ...truckListingMetadata(canonical),
    title,
    description,
    keywords: [
      'comprar caminhão',
      `${listing.brand} ${listing.model} ${listing.year_model}`,
      `caminhão em ${listing.city}`,
    ],
    alternates: { canonical },
    openGraph: {
      title: socialTitle,
      description,
      url: canonical,
      type: 'website',
      ...(imageUrl ? { images: [{ url: imageUrl, alt: listingName }] } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: socialTitle,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

function truncateDescription(value: string, maxLength = 160): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export default async function TruckDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const listing = await getPublicListingBySlug((await params).slug)
  if (!listing || listing.vehicle_type !== 'truck') notFound()
  const [related, sellerInfo] = await Promise.all([getRelatedListings({ brand: listing.brand, model: listing.model, yearModel: listing.year_model, vehicle_type: 'truck', excludeId: listing.id, limit: 6 }), getSellerInfo(listing.user_id)])
  return (
    <main className={`fingen-shell vehicle-detail-page ${heroFont.variable}`}>
      <VehicleSchema vehicle={listing} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Caminhões à venda', url: '/caminhoes' },
          { name: listing.brand, url: '/caminhoes/marcas' },
          { name: `${listing.brand} ${listing.model}`, url: `/caminhoes/anuncio/${listing.slug}` },
        ]}
      />
      <div className="fingen-shell-content">
        <nav className="fingen-breadcrumb" style={{ paddingTop: 24 }}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/caminhoes">Caminhões à venda</Link>
          <span>/</span>
          <span>{listing.brand} {listing.model}</span>
        </nav>
        <VehicleDetailView
          listing={listing}
          sellerInfo={sellerInfo}
          relatedListings={related}
          comparison={getFipeComparison(Number(listing.price), listing.fipe_price)}
        />
      </div>
    </main>
  )
}
