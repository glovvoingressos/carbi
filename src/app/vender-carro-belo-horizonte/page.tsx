import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = {
  ...SEO_DATA.vender,
  h1: 'Vender Carro em Belo Horizonte',
  subtitle: 'A solução definitiva para quem busca vender veículos seminovos na capital mineira.'
}

export const metadata: Metadata = {
  title: 'Vender Carro em Belo Horizonte | Anuncie Grátis | Carbi',
  description: 'Procurando como vender carro em Belo Horizonte? A Carbi conecta você a milhares de compradores interessados em BH. Venda rápida e segura.',
  alternates: {
    canonical: '/vender-carro-belo-horizonte',
  },
  keywords: ['vender carro belo horizonte', 'vender carro bh', 'anunciar carro grátis', 'seminovos bh', 'carros usados bh'],
  openGraph: {
    title: 'Vender Carro em Belo Horizonte | Anuncie Grátis | Carbi',
    description: 'Procurando como vender carro em Belo Horizonte? A Carbi conecta você a milhares de compradores interessados em BH. Venda rápida e segura.',
    type: 'website',
    url: '/vender-carro-belo-horizonte',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vender Carro em Belo Horizonte | Anuncie Grátis | Carbi',
    description: 'Procurando como vender carro em Belo Horizonte? A Carbi conecta você a milhares de compradores interessados em BH. Venda rápida e segura.',
  },
}

export default function VenderCarroBeloHorizontePage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
