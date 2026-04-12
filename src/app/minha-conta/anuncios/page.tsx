import { Metadata } from 'next'
import MyListingsDashboard from '@/components/marketplace/MyListingsDashboard'

export const metadata: Metadata = {
  title: 'Meus anúncios | Carbi',
  description: 'Gerencie seus anúncios com edição real de preço, descrição e fotos.',
}

export default function MyListingsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <div className="pastel-card p-5 sm:p-6" style={{ backgroundColor: '#edf2f7' }}>
        <h1 className="text-3xl font-black text-dark">Meu painel de anúncios</h1>
        <p className="mt-2 text-base font-medium text-text-secondary">
          Ajuste seu anúncio em tempo real: título, preço, descrição e fotos.
        </p>
      </div>
      <div className="mt-6">
        <MyListingsDashboard />
      </div>
    </div>
  )
}
