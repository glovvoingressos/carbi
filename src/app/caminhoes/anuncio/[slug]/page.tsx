import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingBySlug, getRelatedListings, getSellerInfo } from '@/lib/marketplace-server'
import { getFipeComparison } from '@/lib/marketplace'
import VehicleDetailView from '@/components/marketplace/VehicleDetailView'
import { truckListingMetadata } from '@/lib/truck-seo'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const listing = await getPublicListingBySlug((await params).slug)
  if (!listing) return { title: 'Anúncio não encontrado' }
  return { ...truckListingMetadata(`/caminhoes/anuncio/${listing.slug}`), title: `${listing.title} | Caminhões à venda | Carbi`, description: `Comprar caminhão ${listing.brand} ${listing.model} ${listing.year_model} em ${listing.city}/${listing.state}.` }
}

export default async function TruckDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const listing = await getPublicListingBySlug((await params).slug)
  if (!listing || listing.vehicle_type !== 'truck') notFound()
  const [related, sellerInfo] = await Promise.all([getRelatedListings({ brand: listing.brand, model: listing.model, yearModel: listing.year_model, vehicle_type: 'truck', excludeId: listing.id, limit: 6 }), getSellerInfo(listing.user_id)])
  return <main className="fingen-shell"><div className="fingen-shell-content"><nav className="fingen-breadcrumb" style={{ paddingTop: 24 }}><Link href="/">Home</Link><span>/</span><Link href="/caminhoes">Caminhões à venda</Link><span>/</span><span>{listing.brand} {listing.model}</span></nav><VehicleDetailView listing={listing} sellerInfo={sellerInfo} relatedListings={related} comparison={getFipeComparison(Number(listing.price), listing.fipe_price)} /></div></main>
}
