import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = SEO_DATA.vender

export const metadata: Metadata = {
  title: 'Vender Carro em BH | Melhor Avaliação e Venda Rápida | Carbi',
  description: 'Quer vender seu carro em Belo Horizonte? Anuncie na Carbi e venda rápido para compradores reais de BH. Sem comissões, com segurança e preço justo.',
  alternates: {
    canonical: 'https://carbi.com.br/vender-carro-bh'
  }
}

export default function VenderCarroBHPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
