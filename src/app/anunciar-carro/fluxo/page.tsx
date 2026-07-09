import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
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
        {/* Hero — mesmo padrão da home */}
        <section className="fingen-flow-hero">
          <div className="fingen-flow-hero-inner">
            <div className="fingen-balance-header">
              <span className="fingen-section-label">Anúncio gratuito</span>
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
              Consulta FIPE, upload de fotos e revisão final — tudo rápido e seguro.
            </p>
          </div>
        </section>

        {/* Formulário + Side card */}
        <section className="fingen-flow-form-section">
          <div className="fingen-flow-form-grid">
            {/* Side card — dark card */}
            <aside className="fingen-flow-side-card">
              <span className="fingen-section-label">Onboarding</span>
              <h2>Preencha pouco, publique bem.</h2>
              <p>
                Dados estruturados, FIPE real no fluxo, até 10 fotos e contato protegido por chat interno.
              </p>
              <div className="fingen-flow-side-list">
                {['FIPE durante o preenchimento', 'Upload real de imagens', 'Preview e revisão final', 'Negociação protegida'].map((item) => (
                  <div key={item}><CheckCircle2 size={17} /> {item}</div>
                ))}
              </div>
            </aside>

            {/* Formulário */}
            <div className="fingen-flow-form-wrap">
              <ListingForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
