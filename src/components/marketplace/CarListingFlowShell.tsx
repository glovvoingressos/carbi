import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, ShieldCheck } from 'lucide-react'
import '@/app/anunciar-carro/fluxo/flow-apple.css'

type CarListingFlowShellProps = {
  children: ReactNode
  context?: string
  title?: string
  subtitle?: string
  backHref?: string
}

export default function CarListingFlowShell({
  children,
  context = 'Anunciar carro',
  title = 'Anuncie seu carro',
  subtitle = 'Preencha os detalhes e publique em poucos minutos.',
  backHref = '/carros-a-venda',
}: CarListingFlowShellProps) {
  return (
    <div className="lf-apple listing-flow-app">
      <div className="lf-ambient" aria-hidden="true" />

      <main className="lf-main">
        <section className="lf-hero" aria-labelledby="lf-hero-title">
          <div className="lf-hero-top">
            <div className="lf-hero-copy">
              <p className="lf-hero-context">{context}</p>
              <h1 id="lf-hero-title">{title}</h1>
              <p className="lf-hero-sub">{subtitle}</p>
            </div>
            <div className="lf-hero-actions">
              <Link href={backHref} className="lf-pill lf-pill-white">
                <ArrowLeft size={15} aria-hidden="true" />
                Voltar
              </Link>
              <Link href="/contato" className="lf-pill lf-pill-outline">
                <HelpCircle size={15} aria-hidden="true" />
                Ajuda
              </Link>
            </div>
          </div>
          <div className="lf-hero-divider" />
          <div className="lf-hero-chips">
            <span className="lf-pill lf-pill-outline lf-pill-static">
              <ShieldCheck size={15} aria-hidden="true" />
              Ambiente seguro
            </span>
            <span className="lf-pill lf-pill-outline lf-pill-static">Grátis para publicar</span>
            <span className="lf-pill lf-pill-outline lf-pill-static">Até 10 fotos</span>
            <span className="lf-pill lf-pill-outline lf-pill-static">Chat interno</span>
          </div>
        </section>

        {children}
      </main>
    </div>
  )
}
