import type { Metadata } from 'next'
import Link from 'next/link'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { fetchPublicTruckListingsPage, getFilterOptions, type ListingSort } from '@/lib/marketplace-server'
import { truckListingMetadata } from '@/lib/truck-seo'

export const metadata: Metadata = truckListingMetadata()

type Params = { q?: string; ordem?: ListingSort; pagina?: string; brand?: string | string[]; model?: string | string[]; transmission?: string | string[]; truck_type?: string | string[]; axles?: string | string[]; load_capacity_min?: string; load_capacity_max?: string }

export default async function TrucksPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const page = Math.max(Number(sp.pagina || 1) || 1, 1)
  const result = await fetchPublicTruckListingsPage({ q: sp.q, brand: sp.brand, model: sp.model, transmission: sp.transmission, truckType: sp.truck_type, axles: Array.isArray(sp.axles) ? sp.axles.map(Number) : sp.axles ? Number(sp.axles) : undefined, loadCapacityMin: sp.load_capacity_min ? Number(sp.load_capacity_min) : undefined, loadCapacityMax: sp.load_capacity_max ? Number(sp.load_capacity_max) : undefined, sort: sp.ordem || 'recent', page, pageSize: 24 })
  return <main className="cbi-page"><div className="cbi-main"><section className="cbi-hero"><div className="cbi-hero-eyebrow">Marketplace</div><h1 className="cbi-hero-title">Caminhões à venda</h1><p className="cbi-hero-sub">{result.total} anúncios ativos de caminhões. Compare e negocie com segurança.</p></section><MarketplaceClient initialListings={result.items} initialTotal={result.total} initialPage={page} initialTotalPages={Math.max(1, Math.ceil(result.total / result.pageSize))} defaultFilters={{ vehicle_type: 'truck' }} filterOptions={await getFilterOptions()} /></div><nav className="cbi-nav"><Link href="/">Home</Link><Link href="/caminhoes" className="active">Buscar</Link><Link href="/anunciar-carro">Anunciar</Link></nav></main>
}
