import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'
import { serializeJsonLd, truckBrandSlug, truckCollectionJsonLd, truckListingMetadata, TRUCK_BRANDS } from '@/lib/truck-seo'

export const metadata: Metadata = {
  ...truckListingMetadata('/caminhoes/marcas'),
  title: 'Caminhões por marca à venda',
  description:
    'Encontre caminhões usados e seminovos por marca: Mercedes-Benz, Volvo, Scania, Volkswagen, Ford e Iveco. Compare preço, ano, km e capacidade.',
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

const BRAND_FAQ = [
  {
    q: 'Como escolher a marca do caminhão usado?',
    a: 'Comece pelo trabalho que o veículo vai fazer: tipo de carroceria, capacidade de carga e distância percorrida. Depois compare preço, disponibilidade de peças e assistência na região onde o caminhão vai circular.',
  },
  {
    q: 'Qual a melhor marca de caminhão para longa distância?',
    a: 'Cavalos mecânicos e trucks de cabine com beliche dominam as rotas longas. Entre os anúncios da Carbi você filtra por categoria, eixos e capacidade para comparar os modelos disponíveis em cada marca.',
  },
  {
    q: 'Consigo comparar caminhões de marcas diferentes?',
    a: 'Sim. Compare preço, ano, quilometragem e capacidade de carga dos anúncios de diferentes marcas. Quando houver referência FIPE disponível, o anúncio também mostra a comparação com a tabela.',
  },
  {
    q: 'Anunciar caminhão de qualquer marca é grátis?',
    a: 'Sim. O anúncio é gratuito para qualquer marca e categoria, com ficha técnica completa, fotos e chat interno para negociar.',
  },
]

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
        <FAQSchema items={BRAND_FAQ} />

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
            como <Link className="underline" href="/caminhoes/cavalo-mecanico">cavalos mecânicos</Link>,{' '}
            <Link className="underline" href="/caminhoes/bitruck">bitrucks</Link>,{' '}
            <Link className="underline" href="/caminhoes/truck">trucks</Link> e{' '}
            <Link className="underline" href="/caminhoes/toco">tocos</Link>, ou por carroceria —{' '}
            <Link className="underline" href="/caminhoes/caminhoes-bau">baú</Link>,{' '}
            <Link className="underline" href="/caminhoes/caminhoes-sider">sider</Link> e{' '}
            <Link className="underline" href="/caminhoes/caminhoes-graneleiro">graneleiro</Link>.
          </p>
        </section>

        <FAQSection items={BRAND_FAQ} />
      </div>
    </main>
  )
}
