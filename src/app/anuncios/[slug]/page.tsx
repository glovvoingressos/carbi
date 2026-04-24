import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Calendar, MessageCircle } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { getFipeComparison } from '@/lib/marketplace'
import { getListingVehicleId, getPublicListingBySlug, getRelatedListings, getSellerInfo } from '@/lib/marketplace-server'
import { getVehicleEnrichmentForPublic } from '@/lib/vehicle-enrichment-server'
import VehicleDetailView from '@/components/marketplace/VehicleDetailView'

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
    <main className="bg-[#f5f5f3] min-h-screen pt-32 pb-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 text-sm font-bold text-dark/30 flex items-center gap-2">
          <Link href="/" className="hover:text-dark transition-colors">Home</Link> 
          <span className="text-dark/10">/</span> 
          <Link href="/carros-a-venda" className="hover:text-dark transition-colors">Marketplace</Link> 
          <span className="text-dark/10">/</span> 
          <span className="text-dark/60 truncate">{listing.brand} {listing.model}</span>
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
