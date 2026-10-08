import type { Metadata } from 'next'
import Link from 'next/link'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'
import { fetchPublicTruckListingsPage, getFilterOptions, type ListingSort } from '@/lib/marketplace-server'
import { TRUCK_CATEGORIES, TRUCK_FAQ, TRUCK_QUICK_LINKS, serializeJsonLd, truckBrowseJsonLd, truckListingMetadata } from '@/lib/truck-seo'

export const metadata: Metadata = truckListingMetadata()

type Params = { q?: string; ordem?: ListingSort; pagina?: string; brand?: string | string[]; model?: string | string[]; transmission?: string | string[]; fuel?: string | string[]; color?: string | string[]; body_type?: string | string[]; city?: string | string[]; state?: string; truck_type?: string | string[]; axles?: string | string[]; mileage_min?: string; mileage_max?: string; price_min?: string; price_max?: string; year_min?: string; year_max?: string; load_capacity_min?: string; load_capacity_max?: string }

export default async function TrucksPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const page = Math.max(Number(sp.pagina || 1) || 1, 1)
  const [result, filterOptions] = await Promise.all([
    fetchPublicTruckListingsPage({
      q: sp.q,
      brand: sp.brand,
      model: sp.model,
      transmission: sp.transmission,
      fuel: sp.fuel,
      color: sp.color,
      bodyType: sp.body_type,
      city: sp.city,
      state: sp.state,
      truckType: sp.truck_type,
      axles: Array.isArray(sp.axles) ? sp.axles.map(Number) : sp.axles ? Number(sp.axles) : undefined,
      mileageMin: sp.mileage_min ? Number(sp.mileage_min) : undefined,
      mileageMax: sp.mileage_max ? Number(sp.mileage_max) : undefined,
      priceMin: sp.price_min ? Number(sp.price_min) : undefined,
      priceMax: sp.price_max ? Number(sp.price_max) : undefined,
      yearMin: sp.year_min ? Number(sp.year_min) : undefined,
      yearMax: sp.year_max ? Number(sp.year_max) : undefined,
      loadCapacityMin: sp.load_capacity_min ? Number(sp.load_capacity_min) : undefined,
      loadCapacityMax: sp.load_capacity_max ? Number(sp.load_capacity_max) : undefined,
      sort: sp.ordem || 'recent',
      page,
      pageSize: 24,
    }),
    getFilterOptions(),
  ])

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'
  const browseJsonLd = truckBrowseJsonLd({
    name: 'Caminhões à venda',
    description: 'Caminhões usados e seminovos anunciados na Carbi, com comparação FIPE e ficha técnica.',
    url: `${SITE_URL}/caminhoes`,
    items: [
      ...TRUCK_CATEGORIES.map((category) => ({ name: category.name, url: `${SITE_URL}/caminhoes/${category.slug}` })),
      ...TRUCK_QUICK_LINKS.map((link) => ({ name: link.label, url: `${SITE_URL}${link.href}` })),
    ],
  })

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Caminhões à venda', url: '/caminhoes' }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(browseJsonLd) }} />

        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Caminhões</div>
          <h1 className="cbi-hero-title">Caminhões à venda</h1>
          <p className="cbi-hero-sub">
            {result.total > 0
              ? `${result.total} caminhões ativos. Compare preço, ano, eixos e capacidade de carga com a tabela FIPE.`
              : 'Caminhões usados e seminovos com ficha técnica completa, capacidade de carga e comparação FIPE.'}
          </p>
        </section>

        <nav className="truck-links" aria-label="Atalhos de caminhões">
          {TRUCK_QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="truck-link">
              {link.label}
            </Link>
          ))}
          <Link href="/caminhoes/categorias" className="truck-link">Todas as categorias</Link>
          <Link href="/caminhoes/marcas" className="truck-link">Todas as marcas</Link>
        </nav>

        <MarketplaceClient
          initialListings={result.items}
          initialTotal={result.total}
          initialPage={page}
          initialTotalPages={Math.max(1, Math.ceil(result.total / result.pageSize))}
          defaultFilters={{
            vehicle_type: 'truck',
            q: sp.q,
            brand: sp.brand,
            model: sp.model,
            fuel: sp.fuel,
            color: sp.color,
            bodyType: sp.body_type,
            city: sp.city,
            state: sp.state,
            transmission: sp.transmission,
            mileageMin: sp.mileage_min ? Number(sp.mileage_min) : undefined,
            mileageMax: sp.mileage_max ? Number(sp.mileage_max) : undefined,
            priceMin: sp.price_min ? Number(sp.price_min) : undefined,
            priceMax: sp.price_max ? Number(sp.price_max) : undefined,
            yearMin: sp.year_min ? Number(sp.year_min) : undefined,
            yearMax: sp.year_max ? Number(sp.year_max) : undefined,
            truckType: sp.truck_type,
            axles: Array.isArray(sp.axles) ? sp.axles.map(Number) : sp.axles ? Number(sp.axles) : undefined,
            loadCapacityMin: sp.load_capacity_min ? Number(sp.load_capacity_min) : undefined,
            loadCapacityMax: sp.load_capacity_max ? Number(sp.load_capacity_max) : undefined,
          }}
          filterOptions={filterOptions}
        />

        <FAQSchema items={TRUCK_FAQ} />
        <FAQSection items={TRUCK_FAQ} />
      </div>

      <nav className="cbi-nav" aria-label="Navegação de caminhões">
        <Link href="/">Home</Link>
        <Link href="/caminhoes" className="active">Buscar</Link>
        <Link href="/anunciar-caminhao">Anunciar caminhão</Link>
      </nav>
    </main>
  )
}
