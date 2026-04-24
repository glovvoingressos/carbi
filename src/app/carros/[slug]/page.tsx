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
    <main className="bg-[#f5f5f3] min-h-screen pt-32 pb-24">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-white/50 border border-black/5 px-3 py-1 rounded-full mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-dark/40">Marketplace SEO</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-dark tracking-tight leading-none">
            {preset.h1}
          </h1>
          <p className="mt-4 text-dark/40 font-bold">
            {preset.intro} • Página {page} de {totalPages}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 mb-10">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-5 py-2 bg-white border border-black/5 rounded-full text-xs font-bold text-dark/60 hover:text-dark hover:border-black/10 transition-all shadow-sm"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="bg-white rounded-[32px] p-4 border border-black/5 mb-10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <form action={`/carros/${slug}`} method="get" className="flex items-center gap-3 w-full md:w-auto">
            <select
              name="ordem"
              defaultValue={sort}
              className="w-full md:w-48 h-12 bg-[#f5f5f3] rounded-2xl pl-4 pr-4 text-sm font-bold outline-none appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input type="hidden" name="pagina" value="1" />
            <button
              type="submit"
              className="h-12 px-8 bg-dark text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
            >
              Aplicar
            </button>
          </form>
        </div>

        {result.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {result.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-4">
                <a
                  href={`/carros/${slug}?ordem=${sort}&pagina=${Math.max(page - 1, 1)}`}
                  className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${page <= 1 ? 'pointer-events-none border-transparent text-dark/10' : 'border-black/5 bg-white text-dark hover:border-black/20 shadow-sm'}`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </a>
                <div className="px-6 h-14 bg-white rounded-full border border-black/5 flex items-center shadow-sm">
                  <span className="font-black text-dark tracking-widest">{page} / {totalPages}</span>
                </div>
                <a
                  href={`/carros/${slug}?ordem=${sort}&pagina=${Math.min(page + 1, totalPages)}`}
                  className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${page >= totalPages ? 'pointer-events-none border-transparent text-dark/10' : 'border-black/5 bg-white text-dark hover:border-black/20 shadow-sm'}`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center border border-black/5 mt-8">
            <h2 className="text-2xl font-black text-dark mb-2">Nenhum veículo encontrado</h2>
            <p className="text-dark/40 font-bold">Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        )}
      </div>
    </main>
  )
}
