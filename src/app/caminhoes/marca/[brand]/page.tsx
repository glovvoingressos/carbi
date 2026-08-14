import type { Metadata } from 'next'
import { fetchPublicTruckListingsPage, getFilterOptions } from '@/lib/marketplace-server'
import { canonicalTruckBrand, truckListingMetadata } from '@/lib/truck-seo'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const brand = canonicalTruckBrand(decodeURIComponent((await params).brand))
  return { ...truckListingMetadata(`/caminhoes/marca/${encodeURIComponent(brand)}`), title: `Caminhões ${brand} à venda | Carbi` }
}

export default async function TruckBrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const brand = canonicalTruckBrand(decodeURIComponent((await params).brand))
  const [result, filterOptions] = await Promise.all([fetchPublicTruckListingsPage({ brand, page: 1, pageSize: 24 }), getFilterOptions()])
  return <main className="cbi-page"><div className="cbi-main"><section className="cbi-hero"><div className="cbi-hero-eyebrow">Caminhões</div><h1 className="cbi-hero-title">Caminhões {brand} à venda</h1><p className="cbi-hero-sub">Encontre caminhões {brand} usados e seminovos.</p></section><MarketplaceClient initialListings={result.items} initialTotal={result.total} initialPage={1} initialTotalPages={Math.max(1, Math.ceil(result.total / result.pageSize))} defaultFilters={{ vehicle_type: 'truck', brand }} filterOptions={filterOptions} /></div></main>
}
