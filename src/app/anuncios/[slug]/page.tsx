import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Calendar, MessageCircle } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { getFipeComparison, parseFipePriceToNumber } from '@/lib/marketplace'
import { getFipePrice } from '@/lib/fipe-api'
import { getListingVehicleId, getPublicListingBySlug, getRelatedListings, getSellerInfo } from '@/lib/marketplace-server'
import { getVehicleEnrichmentForPublic } from '@/lib/vehicle-enrichment-server'
import VehicleDetailView from '@/components/marketplace/VehicleDetailView'
import { BreadcrumbSchema, VehicleSchema } from '@/components/seo/JSONLD'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)

  if (!listing) {
    return { title: 'Anúncio não encontrado' }
  }

  const listingName = [listing.brand, listing.model, listing.version, listing.year_model]
    .filter(Boolean)
    .join(' ')
  const price = formatBRL(Number(listing.price))
  const listingTitle = `${listingName} por ${price} em ${listing.city} | Carbi`
  const listingDescription = truncateDescription(
    `${listingName} por ${price} em ${listing.city}/${listing.state}. Veja preço, ${listing.mileage.toLocaleString('pt-BR')} km, ${listing.transmission}, ${listing.fuel} e comparação com a Tabela FIPE na Carbi.`,
  )
  const imageUrl = listing.images?.[0]?.url

  return {
    title: listingTitle,
    description: listingDescription,
    keywords: [
      'comprar carro',
      `preço FIPE ${listing.brand} ${listing.model}`,
      `${listing.brand} ${listing.model} ${listing.year_model}`,
      `carro em ${listing.city}`,
    ],
    alternates: {
      canonical: `/anuncios/${listing.slug}`,
    },
    openGraph: {
      title: listingTitle,
      description: listingDescription,
      url: `/anuncios/${listing.slug}`,
      type: 'website',
      ...(imageUrl ? { images: [{ url: imageUrl, alt: listingName }] } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: listingTitle,
      description: listingDescription,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

function truncateDescription(value: string, maxLength = 160): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)
  if (!listing) notFound()

  const related = await getRelatedListings({
    brand: listing.brand,
    model: listing.model,
    yearModel: listing.year_model,
    excludeId: listing.id,
    limit: 6,
  })

  const currentFipeResult = await getFipePrice(listing.brand, listing.model, listing.year_model, listing.version || undefined)
  const currentFipePrice = currentFipeResult?.price
    ? parseFipePriceToNumber(currentFipeResult.price) || null
    : listing.fipe_price ? Number(listing.fipe_price) : null
  const comparison = getFipeComparison(Number(listing.price), currentFipePrice)
  const listingVehicleId = listing.vehicle_id || await getListingVehicleId(listing.id)
  const enrichmentData = listingVehicleId ? await getVehicleEnrichmentForPublic(listingVehicleId) : null
  const enrichment = enrichmentData?.enrichment || null
  const sellerInfo = await getSellerInfo(listing.user_id)

  return (
    <main className="fingen-shell">
      <div className="fingen-shell-content">
        <VehicleSchema vehicle={listing} />
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Carros à venda', url: '/carros-a-venda' },
            { name: listing.brand, url: '/marcas' },
            { name: listing.model, url: `/anuncios/${listing.slug}` },
          ]}
        />
        <nav className="fingen-breadcrumb" style={{ paddingTop: '24px' }} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/carros-a-venda">Carros à venda</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{listing.brand} {listing.model}</span>
        </nav>

        <VehicleDetailView
          listing={listing}
          sellerInfo={sellerInfo}
          relatedListings={related}
          enrichment={enrichment || undefined}
          comparison={comparison}
          currentFipePrice={currentFipePrice}
        />
      </div>
    </main>
  )
}
