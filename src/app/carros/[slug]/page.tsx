import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ListingCard from '@/components/marketplace/ListingCard'
import { fetchPublicListingsPage, ListingSort } from '@/lib/marketplace-server'
import { ALLOWED_SORTS, QUICK_LINKS, resolveSeoPreset } from '@/lib/marketplace-seo'

const SORT_OPTIONS: Array<{ value: ListingSort; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'mileage_asc', label: 'Menor km' },
  { value: 'year_desc', label: 'Mais novos' },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const preset = resolveSeoPreset(slug)
  if (!preset) {
    return {
      title: 'Carros à venda | Carbi',
      description: 'Explore anúncios ativos com filtros inteligentes e dados reais.',
    }
  }

  return {
    title: preset.title,
    description: preset.description,
    alternates: {
      canonical: `/carros/${preset.slug}`,
    },
  }
}

export default async function CarrosSeoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ordem?: ListingSort; pagina?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const preset = resolveSeoPreset(slug)
  if (!preset) notFound()

  const sort = ALLOWED_SORTS.includes(sp.ordem as ListingSort) ? (sp.ordem as ListingSort) : (preset.listingQuery.sort || 'recent')
  const page = Math.max(Number(sp.pagina || '1') || 1, 1)
  const result = await fetchPublicListingsPage({
    ...preset.listingQuery,
    sort,
    page,
    pageSize: 24,
  })
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))

  return (
    <main className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <h1 className="text-3xl font-black text-dark">{preset.h1}</h1>
      <p className="mt-2 text-sm font-semibold text-text-secondary">
        {preset.intro} • Página {page} de {totalPages}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full bg-[#f7f9fc] px-4 py-2 text-xs font-black uppercase tracking-wide text-dark"
          >
            {link.label}
          </a>
        ))}
      </div>

      <form action={`/carros/${slug}`} method="get" className="mt-5 flex gap-2">
        <select
          name="ordem"
          defaultValue={sort}
          className="h-11 rounded-2xl bg-[#f7f9fc] px-4 text-sm font-semibold text-dark outline-none focus:ring-2 focus:ring-dark/10"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input type="hidden" name="pagina" value="1" />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-dark px-5 text-sm font-black uppercase tracking-wider text-white"
        >
          Aplicar
        </button>
      </form>

      {result.items.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <a
              href={`/carros/${slug}?ordem=${sort}&pagina=${Math.max(page - 1, 1)}`}
              aria-disabled={page <= 1}
              className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wide ${page <= 1 ? 'pointer-events-none bg-surface text-text-tertiary' : 'bg-dark text-white'}`}
            >
              Anterior
            </a>
            <a
              href={`/carros/${slug}?ordem=${sort}&pagina=${Math.min(page + 1, totalPages)}`}
              aria-disabled={page >= totalPages}
              className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wide ${page >= totalPages ? 'pointer-events-none bg-surface text-text-tertiary' : 'bg-dark text-white'}`}
            >
              Próxima
            </a>
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-2xl bg-[#f7f9fc] p-6 text-sm font-semibold text-text-secondary">
          Nenhum anúncio encontrado para este filtro no momento.
        </div>
      )}
    </main>
  )
}
