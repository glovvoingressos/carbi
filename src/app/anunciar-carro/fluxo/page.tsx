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
        <section className="tfp-hero" style={{ minHeight: 'auto', padding: '60px 0 40px' }}>
          <div className="tfp-hero-inner" style={{ gridTemplateColumns: '1fr', gap: '0' }}>
            <div className="tfp-hero-content" style={{ alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <Link href="/carros-a-venda" className="tfp-btn-secondary" style={{ marginBottom: '8px' }}>
                <ArrowLeft size={16} />
                Voltar
              </Link>
              <h1 className="tfp-hero-title" style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>
                Monte seu anúncio
              </h1>
              <p className="tfp-hero-sub" style={{ maxWidth: '400px' }}>
                Preencha os dados, adicione fotos e publique gratuitamente.
              </p>
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section className="tfp-section" style={{ paddingTop: '0' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 40px' }}>
            <ListingForm />
          </div>
        </section>
      </main>
    </div>
  )
}
