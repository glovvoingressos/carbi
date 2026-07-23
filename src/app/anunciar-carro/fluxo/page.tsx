import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente em todo o Brasil, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnunciarFluxoPage() {
  return (
    <div className="fingen-page">
      <main className="fingen-main">
        {/* Hero */}
        <section className="tfp-hero" style={{ minHeight: 'auto', padding: '40px 0 0' }}>
          <div className="tfp-hero-inner" style={{ alignItems: 'start' }}>
            {/* Left side - Image + Text */}
            <div className="tfp-hero-content" style={{ gap: '24px' }}>
              <Link href="/carros-a-venda" className="tfp-btn-secondary">
                <ArrowLeft size={16} />
                Voltar
              </Link>
              <img src="/images/Midjourney 💅🏻.jpg" alt="Carro em movimento" className="w-full aspect-video sm:aspect-[21/9] object-cover rounded-2xl" />
              <div>
                <h1 className="tfp-hero-title" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                  Monte seu anúncio
                </h1>
                <p className="tfp-hero-sub" style={{ maxWidth: '400px', marginTop: '12px' }}>
                  Preencha os dados, adicione fotos e publique gratuitamente.
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div style={{ width: '100%' }}>
              <ListingForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
