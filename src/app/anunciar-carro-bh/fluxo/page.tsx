import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnunciarFluxoPage() {
  return (
    <div className="fingen-flow-page">
      <main className="fingen-main">
        <section className="fingen-flow-hero">
          <div className="fingen-flow-hero-inner">
            <div className="fingen-balance-header">
              <span className="fingen-section-label">BH</span>
              <Link href="/carros-a-venda" className="fingen-section-link">
                <ArrowLeft size={14} /> Voltar
              </Link>
            </div>
            <h1>
              Monte seu anúncio em
              <br />
              <span className="fingen-hero-title-accent">poucos minutos.</span>
            </h1>
            <p>
              Fluxo guiado com consulta FIPE, upload de fotos e revisão final — tudo com a identidade premium da Carbi.
            </p>
          </div>
        </section>

        <section className="fingen-flow-form-section">
          <div className="fingen-flow-form-grid">
            <ListingForm />
          </div>
        </section>
      </main>
    </div>
  )
}
