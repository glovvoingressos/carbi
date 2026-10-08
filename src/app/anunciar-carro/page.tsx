import type { Metadata } from 'next'
import AnnouncementLanding from '@/components/seo/AnnouncementLanding'

const description = 'Crie seu anúncio de carro grátis na Carbi. Informe os dados do veículo, inclua fotos e converse com pessoas interessadas.'

export const metadata: Metadata = {
  title: 'Anunciar carro grátis | Venda seu carro na Carbi',
  description,
  keywords: ['anunciar carro', 'anunciar carro grátis', 'vender carro online', 'vender carro rápido'],
  alternates: { canonical: '/anunciar-carro' },
  openGraph: {
    title: 'Anunciar carro grátis | Venda seu carro na Carbi',
    description,
    url: '/anunciar-carro',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function AnunciarCarroPage() {
  return <AnnouncementLanding />
}
