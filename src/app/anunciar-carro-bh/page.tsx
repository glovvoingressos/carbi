import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar carro em BH | Carbi',
  description: 'Publique seu anúncio com FIPE em tempo real, até 10 fotos e chat interno seguro.',
}

export default function AnunciarCarroBHPage() {
  return (
    <div className="min-h-screen bg-surface pb-20">
      <section className="border-b-8 border-[var(--color-bento-red)] bg-dark pb-16 pt-24 text-white">
        <div className="container mx-auto max-w-5xl px-4">
          <p className="inline-flex rounded-full border border-white/20 px-4 py-1 text-xs font-black uppercase tracking-widest text-white/80">
            Anúncio Real • Sem Mock
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Venda seu carro com
            <span className="text-[var(--color-bento-yellow)]"> FIPE ao vivo</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-white/75 sm:text-lg">
            Fluxo completo para publicar em produção: upload de até 10 fotos, cálculo FIPE em tempo real e contato
            exclusivo por chat interno.
          </p>
        </div>
      </section>

      <section className="container mx-auto -mt-10 max-w-5xl px-4">
        <ListingForm />
      </section>
    </div>
  )
}
