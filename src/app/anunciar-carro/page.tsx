import type { Metadata } from 'next'
import SEOPageClient from '@/components/seo/SEOPageClient'
import { SEO_DATA } from '@/data/seo-content'

export const metadata: Metadata = {
  title: 'Anunciar carro grátis | Venda seu carro na Carbi',
  description: SEO_DATA.anunciar.description,
  keywords: ['anunciar carro', 'anunciar carro grátis', 'vender carro online', 'vender carro rápido'],
  alternates: { canonical: '/anunciar-carro' },
  openGraph: {
    title: 'Anunciar carro grátis | Venda seu carro na Carbi',
    description: SEO_DATA.anunciar.description,
    url: '/anunciar-carro',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function AnunciarCarroPage() {
  return <SEOPageClient data={SEO_DATA.anunciar} ctaHref="/anunciar-carro/fluxo" />
}
