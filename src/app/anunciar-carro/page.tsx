import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = SEO_DATA.anunciar

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  alternates: {
    canonical: 'https://carbi.com.br/anunciar-carro'
  }
}

export default function AnunciarCarroPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh" />
}
