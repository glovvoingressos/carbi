import type { Metadata } from 'next'
import Link from 'next/link'
import { truckCollectionJsonLd, truckListingMetadata, TRUCK_BRANDS } from '@/lib/truck-seo'

export const metadata: Metadata = {
  ...truckListingMetadata('/caminhoes/marcas'),
  title: 'Caminhões por marca à venda | Carbi',
  description: 'Encontre caminhões usados e seminovos por marca, compare modelos e veja anúncios ativos na Carbi.',
}

export default function TruckBrandsPage() {
  const jsonLd = truckCollectionJsonLd({ url: '/caminhoes/marcas', name: 'Caminhões por marca', listings: [] })
  return <main className="cbi-page"><div className="cbi-main"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><section className="cbi-hero"><div className="cbi-hero-eyebrow">Caminhões</div><h1 className="cbi-hero-title">Caminhões por marca</h1><p className="cbi-hero-sub">Pesquise caminhões à venda por fabricante e encontre ofertas de veículos usados e seminovos.</p></section><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{TRUCK_BRANDS.map((brand) => <Link key={brand} href={`/caminhoes/marca/${brand.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`} className="rounded-xl border p-5 hover:border-black"><h2 className="font-semibold">Caminhões {brand}</h2><p className="mt-2 text-sm">Ver caminhões {brand} à venda</p></Link>)}</section><section className="mt-12"><h2 className="text-2xl font-semibold">Como encontrar um caminhão usado por marca?</h2><p className="mt-3">Escolha a marca para comparar preço, ano, quilometragem, capacidade e localização dos anúncios ativos. Você também pode <Link className="underline" href="/caminhoes">ver todos os caminhões</Link> e filtrar por categoria.</p></section></div></main>
}
