import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { heroFont } from '@/components/home/home-font'
import '@/app/anunciar-carro/fluxo/flow-apple.css'

type CarListingFlowShellProps = {
  children: ReactNode
  context?: string
  title?: string
  subtitle?: string
  backHref?: string
  chips?: string[]
}

export default function CarListingFlowShell({
  children,
  context = 'Anunciar carro',
  title = 'Seu anúncio, do seu jeito.',
  subtitle = 'Preencha os dados, veja a prévia ao vivo e publique em poucos minutos.',
  backHref = '/carros-a-venda',
  chips = ['Grátis para publicar', 'Até 10 fotos', 'Chat interno'],
}: CarListingFlowShellProps) {
  return (
    <div className={`lf-apple listing-flow-app ${heroFont.variable}`}>
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
        <div className="lf-intro">
          <div className="lf-intro-copy">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="lf-intro-chips" aria-label="Vantagens do anúncio">
            {chips.map((chip) => <span key={chip}>{chip}</span>)}
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
