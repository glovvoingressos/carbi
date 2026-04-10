import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { formatBRL } from '@/data/cars'
import { getFipeComparison } from '@/lib/marketplace'
import { getPublicListingBySlug, getRelatedListings } from '@/lib/marketplace-server'
import ListingCard from '@/components/marketplace/ListingCard'
import ChatStarter from '@/components/marketplace/ChatStarter'
import { resolveMarketplaceCarImage } from '@/lib/car-image-fallback'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)

  if (!listing) {
    return { title: 'Anúncio não encontrado' }
  }

  return {
    title: `${listing.title} | Carbi`,
    description: `${listing.brand} ${listing.model} ${listing.year_model} em ${listing.city}/${listing.state}.`,
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)
  if (!listing) notFound()

  const related = await getRelatedListings({
    brand: listing.brand,
    model: listing.model,
    yearModel: listing.year_model,
    excludeId: listing.id,
    limit: 6,
  })

  const comparison = getFipeComparison(Number(listing.price), listing.fipe_price)
  const fallbackCover = resolveMarketplaceCarImage({
    brand: listing.brand,
    model: listing.model,
    year: listing.year_model,
    preferredUrl: null,
  })

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <div className="mb-4 text-sm font-semibold text-text-secondary">
        <Link href="/" className="underline">Home</Link> / <Link href="/carros-usados-bh" className="underline">Anúncios</Link> / {listing.title}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="rounded-[34px] border-2 border-dark bg-white p-5 shadow-[5px_5px_0_#000]">
            <h1 className="text-3xl font-black text-dark sm:text-4xl">{listing.title}</h1>
            <p className="mt-2 text-sm font-semibold text-text-secondary">
              {listing.brand} {listing.model} {listing.version ? `• ${listing.version}` : ''}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(listing.images || []).map((image, index) => (
                <img key={image.id || image.url || index} src={image.url} alt={`${listing.title} foto ${index + 1}`} className="h-56 w-full rounded-2xl object-cover" />
              ))}
              {(!listing.images || listing.images.length === 0) && fallbackCover ? (
                <img src={fallbackCover} alt={`${listing.title} imagem de referência`} className="h-56 w-full rounded-2xl object-cover sm:col-span-2" />
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-border bg-white p-5">
            <h2 className="text-xl font-black text-dark">Detalhes do anúncio</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{listing.description}</p>

            <div className="mt-4 grid gap-2 text-sm text-dark sm:grid-cols-2">
              <p><strong>Ano:</strong> {listing.year}</p>
              <p><strong>Ano/modelo:</strong> {listing.year_model}</p>
              <p><strong>Quilometragem:</strong> {listing.mileage.toLocaleString('pt-BR')} km</p>
              <p><strong>Câmbio:</strong> {listing.transmission}</p>
              <p><strong>Combustível:</strong> {listing.fuel}</p>
              <p><strong>Cor:</strong> {listing.color}</p>
              <p><strong>Carroceria:</strong> {listing.body_type}</p>
              <p><strong>Cidade/UF:</strong> {listing.city}/{listing.state}</p>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-border bg-white p-5">
            <p className="text-sm font-black uppercase tracking-widest text-text-tertiary">Preço pedido</p>
            <p className="mt-1 text-4xl font-black text-dark">{formatBRL(Number(listing.price))}</p>

            <div className="mt-4 rounded-2xl bg-surface p-4 text-sm">
              <p><strong>Preço médio:</strong> {listing.fipe_price ? formatBRL(Number(listing.fipe_price)) : 'Indisponível'}</p>
              <p><strong>Diferença:</strong> {comparison.diffValue === null ? '-' : formatBRL(comparison.diffValue)}</p>
              <p><strong>Percentual:</strong> {comparison.diffPercent === null ? '-' : `${comparison.diffPercent.toFixed(2)}%`}</p>
              <p className="mt-2 font-bold">
                {comparison.status === 'below' && 'Anúncio abaixo do preço médio'}
                {comparison.status === 'near' && 'Anúncio próximo do preço médio'}
                {comparison.status === 'above' && 'Anúncio acima do preço médio'}
                {comparison.status === 'unknown' && 'Sem referência de preço'}
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-border bg-white p-5">
            <h3 className="text-lg font-black text-dark">Contato seguro</h3>
            <p className="mt-1 text-sm text-text-secondary">Nenhum telefone ou e-mail é exposto. Conversa apenas no chat interno.</p>
            <div className="mt-3">
              <ChatStarter listingId={listing.id} />
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black text-dark">Anúncios deste modelo</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
          {related.length === 0 ? <p className="text-sm text-text-secondary">Ainda não há anúncios similares ativos.</p> : null}
        </div>
      </section>
    </div>
  )
}
