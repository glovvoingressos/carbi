import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = SEO_DATA.anunciar

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  keywords: ['anunciar carro grátis', 'anunciar carro', 'vender carro', 'seminovos à venda', 'carros usados'],
  alternates: {
    canonical: '/anunciar-carro',
  },
  openGraph: {
    title: data.title,
    description: data.description,
    type: 'website',
    url: '/anunciar-carro',
  },
  twitter: {
    card: 'summary_large_image',
    title: data.title,
    description: data.description,
  },
}

export default function AnunciarCarroPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro/fluxo" />
}
