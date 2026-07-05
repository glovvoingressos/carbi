import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
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
            <h1>Monte seu anúncio com a mesma experiência premium da Carbi.</h1>
            <p>
              Um fluxo guiado para selecionar veículo, consultar FIPE, enviar até 10 fotos e publicar com dados reais.
            </p>
          </div>
          <Link href="/carros-a-venda" className="ref-btn ref-btn-lavender">
            Ver ofertas <ArrowRight size={16} />
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
              O formulário usa FIPE real, valida fotos, salva o anúncio no banco e mantém contato por chat interno.
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
