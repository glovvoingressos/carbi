import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = {
  ...SEO_DATA.vender,
  h1: 'Vender Carro Rápido',
  subtitle: 'Anuncie hoje e venda em tempo recorde com nossa tecnologia de visibilidade acelerada.'
}

export const metadata: Metadata = {
  title: 'Vender Carro Rápido | Como vender seu veículo em poucos dias | Carbi',
  description: 'Quer vender seu carro rápido? Siga nossas dicas, use nossa plataforma e venda seu veículo para compradores reais em tempo recorde.',
}

export default function VenderCarroRapidoPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
