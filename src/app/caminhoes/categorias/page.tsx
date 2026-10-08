import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { serializeJsonLd, truckCollectionJsonLd, truckListingMetadata, TRUCK_CATEGORIES } from '@/lib/truck-seo'

export const metadata: Metadata = {
  ...truckListingMetadata('/caminhoes/categorias'),
  title: 'Categorias de caminhões à venda',
  description: 'Encontre caminhões à venda por categoria: truck, bitruck, toco e cavalo mecânico, com preço, km e capacidade de carga.',
  alternates: { canonical: '/caminhoes/categorias' },
}

const CATEGORY_COPY: Record<string, string> = {
  truck: 'Dois eixos traseiros, muito usado em carga pesada e longas distâncias.',
  bitruck: 'Combina eixos para maior capacidade de carga mantendo a agilidade.',
  'cavalo-mecanico': 'Feito para tracionar semirreboques em transporte rodoviário.',
  toco: 'Eixo traseiro simples, ideal para distribuição urbana e cargas menores.',
}

export default function TruckCategoriesPage() {
  const jsonLd = truckCollectionJsonLd({ url: '/caminhoes/categorias', name: 'Categorias de caminhões', listings: [] })

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Caminhões à venda', url: '/caminhoes' },
            { name: 'Categorias', url: '/caminhoes/categorias' },
          ]}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Caminhões</div>
          <h1 className="cbi-hero-title">Categorias de caminhões</h1>
          <p className="cbi-hero-sub">
            Encontre o tipo de caminhão ideal para sua operação, com anúncios reais e filtros de preço, ano, eixos e capacidade de carga.
          </p>
        </section>

        <section className="truck-hub-grid">
          {TRUCK_CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/caminhoes/${category.slug}`} className="truck-hub-card">
              <h2>{category.name}</h2>
              <p>{CATEGORY_COPY[category.slug] || `Ver ${category.name.toLowerCase()} à venda.`}</p>
              <span className="truck-hub-cta">Ver anúncios</span>
            </Link>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="truck-hub-title">Qual categoria de caminhão escolher?</h2>
          <p className="truck-hub-text">
            Compare capacidade de carga, eixos e carroceria nos anúncios antes de decidir. Para uma busca ampla,{' '}
            <Link className="underline" href="/caminhoes">acesse o marketplace de caminhões</Link> e refine os resultados
            por preço, ano e estado.
          </p>
        </section>
      </div>
    </main>
  )
}
