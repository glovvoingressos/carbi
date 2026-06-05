import { Metadata } from 'next'
import MyListingsDashboard from '@/components/marketplace/MyListingsDashboard'

export const metadata: Metadata = {
  title: 'Meus anúncios | Carbi',
  description: 'Gerencie seus anúncios com edição real de preço, descrição e fotos.',
}

export default function MyListingsPage() {
  return (
    <main className="min-h-screen pb-16 pt-28">
      <div className="container max-w-6xl">
        <div className="hero-bento p-8 sm:p-12 mb-6">
          <p className="section-kicker">Gerenciamento</p>
          <h1 className="mt-3 text-balance">Meus anúncios</h1>
          <p className="mt-3 text-lg font-medium text-[#52607A]">
            Ajuste seu anúncio em tempo real: título, preço, descrição e fotos.
          </p>
        </div>
        <MyListingsDashboard />
      </div>
    </main>
  )
}
