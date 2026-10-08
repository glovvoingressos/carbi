import type { Metadata } from 'next'
import { fetchPublicTruckListingsPage, getFilterOptions } from '@/lib/marketplace-server'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { canonicalTruckBrand, serializeJsonLd, truckBrandSlug, truckCollectionJsonLd, truckListingMetadata } from '@/lib/truck-seo'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const brand = canonicalTruckBrand(decodeURIComponent((await params).brand))
  const brandPath = `/caminhoes/marca/${truckBrandSlug(brand)}`
  return {
    ...truckListingMetadata(brandPath),
    title: `Caminhões ${brand} à venda`,
    description: `Caminhões ${brand} usados e seminovos com preço, ano, km e capacidade de carga. Compare com a tabela FIPE.`,
    alternates: { canonical: brandPath },
  }
}

export default async function TruckBrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const brand = canonicalTruckBrand(decodeURIComponent((await params).brand))
  const brandPath = `/caminhoes/marca/${truckBrandSlug(brand)}`
  const [result, filterOptions] = await Promise.all([
    fetchPublicTruckListingsPage({ brand, page: 1, pageSize: 24 }),
    getFilterOptions(),
  ])

  const jsonLd = truckCollectionJsonLd({
    url: brandPath,
    name: `Caminhões ${brand} à venda`,
    listings: result.items.slice(0, 24).map((listing) => ({
      slug: listing.slug,
      brand: listing.brand,
      model: listing.model,
      price: listing.price,
    })),
  })

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Caminhões à venda', url: '/caminhoes' },
            { name: 'Marcas', url: '/caminhoes/marcas' },
            { name: brand, url: brandPath },
          ]}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Caminhões</div>
          <h1 className="cbi-hero-title">Caminhões {brand} à venda</h1>
          <p className="cbi-hero-sub">
            {result.total > 0
              ? `${result.total} caminhões ${brand} ativos, com preço, ano, km e capacidade de carga.`
              : `Encontre caminhões ${brand} usados e seminovos anunciados na plataforma.`}
          </p>
        </section>

        <MarketplaceClient
          initialListings={result.items}
          initialTotal={result.total}
          initialPage={1}
          initialTotalPages={Math.max(1, Math.ceil(result.total / result.pageSize))}
          defaultFilters={{ vehicle_type: 'truck', brand }}
          filterOptions={filterOptions}
        />
      </div>
    </main>
  )
}
