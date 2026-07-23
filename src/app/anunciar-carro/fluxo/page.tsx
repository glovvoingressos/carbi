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
        {/* Hero - exact copy from tráfego pago */}
        <section className="tfp-hero" style={{ padding: '60px 0 40px' }}>
          <div className="tfp-hero-inner" style={{ maxWidth: '90%', gap: '48px' }}>
            {/* Left side - Image + Text */}
            <div className="tfp-hero-content">
              <Link href="/carros-a-venda" className="tfp-btn-secondary">
                <ArrowLeft size={16} />
                Voltar
              </Link>
              <img src="/images/Midjourney 💅🏻.jpg" alt="Carro em movimento" className="w-full aspect-video sm:aspect-[21/9] object-cover rounded-2xl" />
              <div>
                <h1 className="tfp-hero-title">
                  Monte seu anúncio
                </h1>
                <p className="tfp-hero-sub">
                  Preencha os dados, adicione fotos e publique gratuitamente.
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div>
              <ListingForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
