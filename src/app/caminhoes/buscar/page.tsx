import type { Metadata } from 'next'
import Link from 'next/link'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { fetchPublicTruckListingsPage, getFilterOptions, type ListingSort } from '@/lib/marketplace-server'
import { TRUCK_QUICK_LINKS } from '@/lib/truck-seo'

type Params = { q?: string; ordem?: ListingSort; pagina?: string; brand?: string | string[]; model?: string | string[]; transmission?: string | string[]; fuel?: string | string[]; color?: string | string[]; body_type?: string | string[]; city?: string | string[]; state?: string; truck_type?: string | string[]; axles?: string | string[]; mileage_min?: string; mileage_max?: string; price_min?: string; price_max?: string; year_min?: string; year_max?: string; load_capacity_min?: string; load_capacity_max?: string }

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const sp = await searchParams
  // Página de busca: com filtros na URL não deve competir no índice com as
  // páginas de aterrissagem (/caminhoes/ate-150-mil, /caminhoes/cavalo-mecanico...).
  const hasParameters = Object.values(sp).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : typeof value === 'string' && value.trim().length > 0,
  )
  return {
    title: 'Buscar caminhões à venda',
    description:
      'Busque caminhões usados e seminovos por marca, categoria, preço, ano, estado e capacidade de carga. Ficha técnica e comparação FIPE quando houver referência disponível.',
    keywords: ['caminhões à venda', 'buscar caminhão', 'caminhão usado', 'cavalo mecânico', 'bitruck'],
    alternates: { canonical: '/caminhoes/buscar' },
    robots: hasParameters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: 'Buscar caminhões à venda | Carbi',
      description: 'Caminhões usados e seminovos com ficha técnica completa e comparação FIPE quando houver referência disponível.',
      url: '/caminhoes/buscar',
      type: 'website',
    },
  }
}

export default async function TruckSearchPage({ searchParams }: { searchParams: Promise<Params> }) {
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

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Caminhões à venda', url: '/caminhoes' },
            { name: 'Buscar', url: '/caminhoes/buscar' },
          ]}
        />

        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Caminhões</div>
          <h1 className="cbi-hero-title">Buscar caminhões</h1>
          <p className="cbi-hero-sub">
            {result.total > 0
              ? `${result.total} caminhões ativos. Filtre por categoria, marca, preço, ano, estado e capacidade de carga.`
              : 'Filtre por categoria, marca, preço, ano, estado e capacidade de carga. Ficha técnica e comparação FIPE quando houver referência disponível.'}
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
      </div>

      <nav className="cbi-nav" aria-label="Navegação de caminhões">
        <Link href="/caminhoes">Home</Link>
        <Link href="/caminhoes/buscar" className="active">Buscar</Link>
        <Link href="/caminhoes/anunciar">Anunciar</Link>
      </nav>
    </main>
  )
}
