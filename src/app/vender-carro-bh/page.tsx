import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = {
  ...SEO_DATA.vender,
  h1: 'Vender Carro em Belo Horizonte',
  subtitle: 'A solução definitiva para quem busca vender veículos seminovos na capital mineira com segurança e preço justo.',
  sections: [
    {
      badge: 'Local BH',
      title: 'O mercado de carros em Belo Horizonte',
      subtitle: 'BH tem um dos mercados mais aquecidos de seminovos do Brasil.',
      content: `Vender carro em Belo Horizonte exige estratégia. Com a Carbi, seu anúncio é otimizado para buscas locais como "carros usados bh" e "seminovos belo horizonte", garantindo que as pessoas certas vejam seu veículo no momento da decisão.`
    },
    ...SEO_DATA.vender.sections.slice(1)
  ]
}

export const metadata: Metadata = {
  title: 'Vender Carro em BH | Melhor Avaliação e Venda Rápida | Carbi',
  description: 'Quer vender seu carro em Belo Horizonte? Anuncie na Carbi e venda rápido para compradores reais de BH. Sem comissões, com segurança e preço justo.',
  keywords: ['vender carro bh', 'vender carro belo horizonte', 'seminovos bh', 'carros usados bh', 'anunciar carro grátis'],
  alternates: {
    canonical: '/vender-carro-bh',
  },
  openGraph: {
    title: 'Vender Carro em BH | Melhor Avaliação e Venda Rápida | Carbi',
    description: 'Quer vender seu carro em Belo Horizonte? Anuncie na Carbi e venda rápido para compradores reais de BH. Sem comissões, com segurança e preço justo.',
    type: 'website',
    url: '/vender-carro-bh',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vender Carro em BH | Melhor Avaliação e Venda Rápida | Carbi',
    description: 'Quer vender seu carro em Belo Horizonte? Anuncie na Carbi e venda rápido para compradores reais de BH. Sem comissões, com segurança e preço justo.',
  },
}

export default function VenderCarroBHPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
