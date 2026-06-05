import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Calendar, MessageCircle } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { getFipeComparison } from '@/lib/marketplace'
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

  return {
    title: `${listing.title} | Comprar carro com preço FIPE na Carbi`,
    description: `Comprar carro ${listing.brand} ${listing.model} ${listing.year_model} em ${listing.city}/${listing.state}. Preço do anúncio e preço FIPE como referência.`,
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
      title: `${listing.title} | Comprar carro com preço FIPE na Carbi`,
      description: `Comprar carro ${listing.brand} ${listing.model} ${listing.year_model} em ${listing.city}/${listing.state}. Preço do anúncio e preço FIPE como referência.`,
      url: `/anuncios/${listing.slug}`,
      type: 'website',
    },
  }
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

  const comparison = getFipeComparison(Number(listing.price), listing.fipe_price)
  const listingVehicleId = listing.vehicle_id || await getListingVehicleId(listing.id)
  const enrichmentData = listingVehicleId ? await getVehicleEnrichmentForPublic(listingVehicleId) : null
  const enrichment = enrichmentData?.enrichment || null
  const sellerInfo = await getSellerInfo(listing.user_id)

  return (
    <main className="min-h-screen pt-28 pb-24">
      <div className="container">
        <VehicleSchema vehicle={listing} />
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Carros à venda', url: '/carros-a-venda' },
            { name: listing.brand, url: '/marcas' },
            { name: listing.model, url: `/anuncios/${listing.slug}` },
          ]}
        />
        <div className="mb-8 text-sm font-medium text-[#8A95A8] flex items-center gap-2">
          <Link href="/" className="hover:text-[#0A0A0A] transition-colors">Home</Link> 
          <span className="text-[#0A0A0A]/10">/</span> 
          <Link href="/carros-a-venda" className="hover:text-[#0A0A0A] transition-colors">Marketplace</Link> 
          <span className="text-[#0A0A0A]/10">/</span> 
          <span className="text-[#525252] truncate">{listing.brand} {listing.model}</span>
        </div>

        <VehicleDetailView 
          listing={listing}
          sellerInfo={sellerInfo}
          relatedListings={related}
          enrichment={enrichment}
          comparison={comparison}
        />
      </div>
    </main>
  )
}
