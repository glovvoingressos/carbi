import { Metadata } from 'next'
import ListingForm from '@/components/marketplace/ListingForm'
import CarListingFlowShell from '@/components/marketplace/CarListingFlowShell'

export const metadata: Metadata = {
  title: 'Anunciar meu carro',
  description: 'Publique seu anúncio gratuitamente em todo o Brasil, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnunciarFluxoPage() {
  return (
    <CarListingFlowShell>
      <ListingForm />
    </CarListingFlowShell>
  )
}
