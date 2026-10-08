import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { serializeJsonLd, truckBrandSlug, truckCollectionJsonLd, truckListingMetadata, TRUCK_BRANDS } from '@/lib/truck-seo'

export const metadata: Metadata = {
  ...truckListingMetadata('/caminhoes/marcas'),
  title: 'Caminhões por marca à venda',
  description: 'Encontre caminhões usados e seminovos por marca: Mercedes-Benz, Volvo, Scania, Volkswagen, Ford e Iveco.',
  alternates: { canonical: '/caminhoes/marcas' },
}

const BRAND_COPY: Record<string, string> = {
  'Mercedes-Benz': 'Linha pesada e extrapesada com forte presença no transporte rodoviário.',
  Volvo: 'Cavalos mecânicos e truck com foco em eficiência e consumo.',
  Scania: 'Referência em cavalos mecânicos e caminhões de longa distância.',
  Volkswagen: 'Caminhões leves e médios para distribuição urbana e regional.',
  Ford: 'Modelos de entrada e médios, com boa oferta de peças no mercado.',
  Iveco: 'Caminhões leves, médios e pesados para diferentes tipos de carga.',
}

export default function TruckBrandsPage() {
  const jsonLd = truckCollectionJsonLd({ url: '/caminhoes/marcas', name: 'Caminhões por marca', listings: [] })

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Caminhões à venda', url: '/caminhoes' },
            { name: 'Marcas', url: '/caminhoes/marcas' },
          ]}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Caminhões</div>
          <h1 className="cbi-hero-title">Caminhões por marca</h1>
          <p className="cbi-hero-sub">
            Pesquise caminhões à venda por fabricante e compare preço, ano, quilometragem e capacidade de carga.
          </p>
        </section>

        <section className="truck-hub-grid">
          {TRUCK_BRANDS.map((brand) => (
            <Link key={brand} href={`/caminhoes/marca-${truckBrandSlug(brand)}`} className="truck-hub-card">
              <h2>Caminhões {brand}</h2>
              <p>{BRAND_COPY[brand] || `Ver caminhões ${brand} à venda.`}</p>
              <span className="truck-hub-cta">Ver anúncios</span>
            </Link>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="truck-hub-title">Como encontrar um caminhão usado por marca?</h2>
          <p className="truck-hub-text">
            Escolha a marca para comparar preço, ano, quilometragem, capacidade e localização dos anúncios ativos. Você também
            pode <Link className="underline" href="/caminhoes/buscar">ver todos os caminhões</Link> e filtrar por categoria,
            como <Link className="underline" href="/caminhoes/cavalo-mecanico">cavalos mecânicos</Link> e{' '}
            <Link className="underline" href="/caminhoes/bitruck">bitrucks</Link>.
          </p>
        </section>
      </div>
    </main>
  )
}
