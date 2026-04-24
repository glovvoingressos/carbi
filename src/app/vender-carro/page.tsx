import { Metadata } from 'next'
import { SEO_DATA } from '@/data/seo-content'
import SEOPageClient from '@/components/seo/SEOPageClient'

const data = SEO_DATA.vender

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  alternates: {
    canonical: 'https://carbi.com.br/vender-carro'
  }
}

export default function VenderCarroPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh" />
}
