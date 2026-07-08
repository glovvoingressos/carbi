import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import ListingForm from '@/components/marketplace/ListingForm'
import FlowProgress from '@/components/animations/FlowProgress'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente em todo o Brasil, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

const flow = ['Marca', 'Modelo', 'Ano', 'Versão', 'Preço', 'FIPE', 'Fotos', 'Publicar']

export default function AnunciarFluxoPage() {
  return (
    <main className="ref-flow-page">
      <section className="ref-flow-hero">
        <div className="ref-flow-hero-inner">
          <div>
            <span className="ref-hero-badge"><span className="ref-dot" /> Anúncio 100% grátis</span>
            <h1>Publique seu anúncio em poucos minutos.</h1>
            <p>
              Fluxo guiado com consulta FIPE, upload de fotos e revisão final — tudo com a identidade premium da Carbi.
            </p>
          </div>
          <Link href="/carros-a-venda" className="ref-btn ref-btn-ghost" style={{ border: '1px solid rgba(255,255,255,.2)', color: '#fff' }}>
            <ArrowLeft size={16} /> Voltar ao marketplace
          </Link>
        </div>
        <FlowProgress steps={flow} currentStep={0} />
      </section>

      <section className="ref-flow-form-section">
        <div className="ref-flow-form-grid">
          <aside className="ref-flow-side-card">
            <span className="ref-sec-label">Onboarding</span>
            <h2>Preencha pouco, publique bem.</h2>
            <p>
              Dados estruturados, FIPE real no fluxo, até 10 fotos e contato protegido por chat interno.
            </p>
            <div className="ref-flow-side-list">
              {['FIPE durante o preenchimento', 'Upload real de imagens', 'Preview e revisão final', 'Negociação protegida'].map((item) => (
                <div key={item}><CheckCircle2 size={17} /> {item}</div>
              ))}
            </div>
          </aside>
          <div className="ref-flow-form-wrap">
            <ListingForm />
          </div>
        </div>
      </section>
    </main>
  )
}
