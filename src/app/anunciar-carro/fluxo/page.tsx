import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente em todo o Brasil, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnunciarFluxoPage() {
  return (
    <main className="min-h-screen pb-24 pt-28">
      <div className="container">
        <div className="hero-bento p-8 sm:p-12 mb-6">
          <p className="section-kicker bg-[#17170F] text-[#FFFDF3] border-[#17170F]">100% grátis</p>
          <h1 className="mt-3 text-balance">
            Anuncie seu carro no Brasil <span className="text-[#16855C]">sem pagar nada</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-[#52607A]">
            Experiência limpa, rápida e guiada para publicar gratuitamente seu veículo com segurança em qualquer lugar do país.
          </p>
        </div>

        <ListingForm />
      </div>
    </main>
  )
}
