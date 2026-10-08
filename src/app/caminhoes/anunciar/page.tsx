import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import TruckListingForm from '@/components/trucks/TruckListingForm'
import { heroFont } from '@/components/home/home-font'

export const metadata: Metadata = {
  title: 'Anunciar caminhão grátis',
  description: 'Publique seu caminhão grátis na Carbi: ficha técnica completa, fotos e chat interno.',
  robots: { index: false, follow: false },
}

export default function TruckAnnouncePage() {
  return (
    <div className={`listing-flow-app ${heroFont.variable}`}>
      <header className="listing-flow-header">
        <Link href="/caminhoes" className="listing-flow-back">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Voltar</span>
        </Link>
        <div className="listing-flow-header-copy">
          <p className="listing-flow-eyebrow">Caminhões · Novidade</p>
          <h1>Anuncie seu caminhão</h1>
        </div>
        <div className="listing-flow-trust"><ShieldCheck size={16} aria-hidden="true" /> Seus dados protegidos</div>
      </header>
      <main className="listing-flow-main">
        <p className="listing-flow-intro">Consulte a placa, complete a ficha técnica, adicione fotos e publique gratuitamente.</p>
        <TruckListingForm />
      </main>
    </div>
  )
}
