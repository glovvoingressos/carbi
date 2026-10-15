import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = {
  ...SEO_DATA.anunciar,
  h1: 'Anunciar carro seminovo',
  subtitle: 'Informe versão, ano-modelo, quilometragem, estado e histórico que possa comprovar. O prazo de venda depende do veículo e da negociação.'
}

export const metadata: Metadata = {
  title: 'Anunciar carro seminovo | Publique na Carbi',
  description: 'Crie um anúncio de carro seminovo com versão, ano-modelo, quilometragem, fotos atuais e histórico documental disponível.',
  keywords: ['anunciar seminovo', 'anunciar carro grátis', 'seminovos à venda', 'vender seminovo', 'carro seminovo'],
  alternates: {
    canonical: '/anunciar-seminovo',
  },
  openGraph: {
    title: 'Anunciar carro seminovo | Publique na Carbi',
    description: 'Crie um anúncio de carro seminovo com versão, ano-modelo, quilometragem, fotos atuais e histórico documental disponível.',
    type: 'website',
    url: '/anunciar-seminovo',
  },
}

export default function AnunciarSeminovoPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro/fluxo" />
}
