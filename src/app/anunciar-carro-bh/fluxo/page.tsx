import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'
import CarListingFlowShell from '@/components/marketplace/CarListingFlowShell'

export const metadata: Metadata = {
  title: 'Anunciar meu carro',
  description: 'Publique seu anúncio gratuitamente, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default function AnunciarFluxoPage() {
  return (
    <CarListingFlowShell
      context="Anunciar carro · BH"
      subtitle="Consulta FIPE, fotos e revisão final em poucos minutos."
    >
      <ListingForm />
    </CarListingFlowShell>
  )
}
