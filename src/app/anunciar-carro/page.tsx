import type { Metadata } from 'next'
import AnnouncementLanding from '@/components/seo/AnnouncementLanding'

const description = 'Crie seu anúncio de carro sem custo no plano gratuito: até 5 anúncios ativos por conta e até 10 fotos em cada anúncio.'

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
