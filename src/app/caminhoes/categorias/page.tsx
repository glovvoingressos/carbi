import type { Metadata } from 'next'
import Link from 'next/link'
import { truckCollectionJsonLd, truckListingMetadata, TRUCK_CATEGORIES } from '@/lib/truck-seo'

export const metadata: Metadata = {
  ...truckListingMetadata('/caminhoes/categorias'),
  title: 'Categorias de caminhões à venda | Carbi',
  description: 'Encontre caminhões à venda por categoria: truck, bitruck, toco e cavalo mecânico.',
}

export default function TruckCategoriesPage() {
  const jsonLd = truckCollectionJsonLd({ url: '/caminhoes/categorias', name: 'Categorias de caminhões', listings: [] })
  return <main className="cbi-page"><div className="cbi-main"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><section className="cbi-hero"><div className="cbi-hero-eyebrow">Caminhões</div><h1 className="cbi-hero-title">Categorias de caminhões</h1><p className="cbi-hero-sub">Encontre o tipo de caminhão ideal para sua operação, com anúncios reais e filtros detalhados.</p></section><section className="grid gap-4 sm:grid-cols-2">{TRUCK_CATEGORIES.map((category) => <Link key={category.slug} href={`/caminhoes?truck_type=${category.slug}`} className="rounded-xl border p-5 hover:border-black"><h2 className="font-semibold">{category.name}</h2><p className="mt-2 text-sm">Ver {category.name.toLowerCase()} à venda</p></Link>)}</section><section className="mt-12"><h2 className="text-2xl font-semibold">Qual categoria de caminhão escolher?</h2><p className="mt-3">Compare capacidade de carga, eixos e carroceria nos anúncios. Para uma busca ampla, <Link className="underline" href="/caminhoes">acesse o marketplace de caminhões</Link> e refine os resultados.</p></section></div></main>
}
