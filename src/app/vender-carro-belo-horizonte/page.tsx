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
    canonical: 'https://carbi.com.br/vender-carro-belo-horizonte'
  }
}

export default function VenderCarroBeloHorizontePage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
