import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = SEO_DATA.vender

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  keywords: ['vender carro', 'vender carro rápido', 'vender seminovo', 'anunciar carro grátis', 'carros à venda'],
  alternates: {
    canonical: '/vender-carro',
  },
  openGraph: {
    title: data.title,
    description: data.description,
    type: 'website',
    url: '/vender-carro',
  },
  twitter: {
    card: 'summary_large_image',
    title: data.title,
    description: data.description,
  },
}

export default function VenderCarroPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro" />
}
