import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = {
  ...SEO_DATA.anunciar,
  h1: 'Anunciar Seminovo',
  subtitle: 'A melhor plataforma para quem tem um seminovo de qualidade e busca compradores exigentes.'
}

export const metadata: Metadata = {
  title: 'Anunciar Seminovo | Venda seu carro seminovo com valorização | Carbi',
  description: 'Anuncie seu carro seminovo na Carbi. Destaque para procedência, garantia e estado de conservação. Venda rápida e segura.',
  keywords: ['anunciar seminovo', 'anunciar carro grátis', 'seminovos à venda', 'vender seminovo', 'carro seminovo'],
  alternates: {
    canonical: '/anunciar-seminovo',
  },
  openGraph: {
    title: 'Anunciar Seminovo | Venda seu carro seminovo com valorização | Carbi',
    description: 'Anuncie seu carro seminovo na Carbi. Destaque para procedência, garantia e estado de conservação. Venda rápida e segura.',
    type: 'website',
    url: '/anunciar-seminovo',
  },
}

export default function AnunciarSeminovoPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro/fluxo" />
}
