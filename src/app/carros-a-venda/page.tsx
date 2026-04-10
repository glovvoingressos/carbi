import type { Metadata } from 'next'
import ListingCard from '@/components/marketplace/ListingCard'
import { searchPublicListings } from '@/lib/marketplace-server'

export const metadata: Metadata = {
  title: 'Carros à venda | Carbi',
  description: 'Listagem completa de carros anunciados na plataforma com dados reais.',
}

export default async function CarrosAVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const sp = await searchParams
  const query = (sp.q || '').trim()
  const listings = await searchPublicListings(query, 48)

  return (
    <main className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <h1 className="text-3xl font-black text-dark">Carros à venda</h1>
      <p className="mt-2 text-sm font-semibold text-text-secondary">
        {query ? `Resultados para "${query}"` : 'Listagem completa dos anúncios mais recentes.'}
      </p>

      <form action="/carros-a-venda" method="get" className="mt-5 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Filtrar por marca ou modelo"
          className="h-11 flex-1 rounded-2xl border border-border bg-white px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-dark/10"
        />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-dark px-5 text-sm font-black uppercase tracking-wider text-white"
        >
          Buscar
        </button>
      </form>

      {listings.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-border bg-white p-6 text-sm font-semibold text-text-secondary">
          Nenhum anúncio encontrado no momento.
        </div>
      )}
    </main>
  )
}
