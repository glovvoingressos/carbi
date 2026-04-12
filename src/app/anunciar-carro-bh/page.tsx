import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar carro em BH | Carbi',
  description: 'Publique seu anúncio gratuitamente, com até 10 fotos e chat interno seguro.',
}

export default function AnunciarCarroBHPage() {
  return (
    <div className="min-h-screen bg-surface pb-20">
      <section className="bg-[#dff7e8] pb-16 pt-24 text-dark">
        <div className="container mx-auto max-w-5xl px-4">
          <p className="inline-flex rounded-full border border-dark/20 bg-white/70 px-4 py-1 text-xs font-black uppercase tracking-widest text-dark/70">
            Rápido • Fácil • Gratuito
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Anuncie seu carro
            <span className="text-[var(--color-bento-red)]"> gratuitamente</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-dark/70 sm:text-lg">
            Fluxo completo para publicar com segurança: upload de até 10 fotos, anúncio em poucos passos e contato
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
