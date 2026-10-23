import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
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

      <header className="lf-topbar">
        <div className="lf-topbar-inner">
          <Link href={backHref} className="lf-back">
            <span className="lf-back-icon"><ArrowLeft size={18} aria-hidden="true" /></span>
            <span>Voltar</span>
          </Link>

          <div className="lf-brand" aria-label="Carbi">
            <span className="lf-brand-mark" aria-hidden="true">C</span>
            <span className="lf-brand-name">Carbi</span>
            <span className="lf-brand-sep" aria-hidden="true" />
            <span className="lf-brand-context">{context}</span>
          </div>

          <div className="lf-topbar-actions">
            <span className="lf-secure"><ShieldCheck size={15} aria-hidden="true" /> Ambiente seguro</span>
            <Link href="/contato" className="lf-help">Ajuda</Link>
          </div>
        </div>
      </header>

      <main className="lf-main">
        <header className="lf-intro">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>

        {children}
      </main>
    </div>
  )
}
