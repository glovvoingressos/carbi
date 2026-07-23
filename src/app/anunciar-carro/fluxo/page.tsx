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
    <div className="fingen-flow-page">
      <main className="fingen-main">
        {/* Hero */}
        <section className="fingen-flow-hero">
          <div className="fingen-flow-hero-inner">
            <div className="fingen-balance-header">
              <Link href="/carros-a-venda" className="fingen-section-link">
                <ArrowLeft size={14} /> Voltar
              </Link>
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section className="fingen-flow-form-section">
          <div className="max-w-[680px] mx-auto">
            <ListingForm />
          </div>
        </section>
      </main>
    </div>
  )
}
