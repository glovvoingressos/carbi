import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente, com até 10 fotos e chat interno seguro.',
}

export default function AnunciarFluxoPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] pb-24 pt-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="bg-white rounded-[32px] border border-black/5 p-8 sm:p-12 shadow-sm mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/30">Fluxo simples e seguro</p>
          <h1 className="mt-2 text-4xl sm:text-6xl font-black text-dark tracking-tight leading-[0.95]">Anuncie seu carro gratuitamente</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-dark/50">
            Experiência limpa, rápida e guiada: escolha o carro, informe preço e descrição, revise e publique.
          </p>
        </div>

        <ListingForm />
      </div>
    </main>
  )
}
