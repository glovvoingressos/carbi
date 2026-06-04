import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente em todo o Brasil, com até 10 fotos e chat interno seguro.',
}

export default function AnunciarFluxoPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] pb-24 pt-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="bg-white rounded-[32px] border border-black/5 p-8 sm:p-12 shadow-sm mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A3A3A3]">Plataforma Nacional</p>
          <h1 className="mt-2 text-4xl sm:text-6xl font-black text-[#0A0A0A] tracking-tight leading-[0.95]">Anuncie seu carro no Brasil</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-[#A3A3A3]">
            Experiência limpa, rápida e guiada: venda seu veículo com segurança em qualquer lugar do país.
          </p>
        </div>

        <ListingForm />
      </div>
    </main>
  )
}
