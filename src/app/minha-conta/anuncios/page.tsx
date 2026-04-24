import { Metadata } from 'next'
import MyListingsDashboard from '@/components/marketplace/MyListingsDashboard'

export const metadata: Metadata = {
  title: 'Meus anúncios | Carbi',
  description: 'Gerencie seus anúncios com edição real de preço, descrição e fotos.',
}

export default function MyListingsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] pb-16 pt-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="bg-white rounded-[32px] border border-black/5 p-8 sm:p-12 shadow-sm mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/30">Gerenciamento</p>
          <h1 className="mt-2 text-4xl font-black text-dark tracking-tight">Meus anúncios</h1>
          <p className="mt-3 text-lg font-medium text-dark/50">
            Ajuste seu anúncio em tempo real: título, preço, descrição e fotos.
          </p>
        </div>
        <MyListingsDashboard />
      </div>
    </main>
  )
}
