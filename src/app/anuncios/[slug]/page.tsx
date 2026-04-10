import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { formatBRL } from '@/data/cars'
import { getFipeComparison } from '@/lib/marketplace'
import { getListingVehicleId, getPublicListingBySlug, getRelatedListings } from '@/lib/marketplace-server'
import ListingCard from '@/components/marketplace/ListingCard'
import ChatStarter from '@/components/marketplace/ChatStarter'
import { resolveMarketplaceCarImage } from '@/lib/car-image-fallback'
import { getVehicleEnrichmentForPublic } from '@/lib/vehicle-enrichment-server'

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
  const galleryImages = (listing.images && listing.images.length > 0)
    ? listing.images.map((image) => image.url)
    : (fallbackCover ? [fallbackCover] : [])
  const listingVehicleId = listing.vehicle_id || await getListingVehicleId(listing.id)
  const enrichmentData = listingVehicleId ? await getVehicleEnrichmentForPublic(listingVehicleId) : null
  const enrichment = enrichmentData?.enrichment || null
  const enrichmentPhotos = enrichment?.photos?.gallery || []
  const displayGallery = enrichmentPhotos.length > 0 ? enrichmentPhotos : galleryImages
  const hasPowertrainData = Boolean(
    enrichment?.powertrain?.engine
    || enrichment?.powertrain?.horsepower
    || enrichment?.powertrain?.torque
    || enrichment?.powertrain?.transmission
    || enrichment?.powertrain?.drivetrain
    || enrichment?.powertrain?.fuelType,
  )
  const hasDimensions = Boolean(
    enrichment?.dimensions?.length
    || enrichment?.dimensions?.width
    || enrichment?.dimensions?.height
    || enrichment?.dimensions?.wheelbase
    || enrichment?.dimensions?.curbWeight
    || enrichment?.dimensions?.seatingCapacity
    || enrichment?.dimensions?.cargoCapacity,
  )
  const hasFeatures = Boolean(
    (enrichment?.features?.comfort?.length || 0) > 0
    || (enrichment?.features?.technology?.length || 0) > 0
    || (enrichment?.features?.safety?.length || 0) > 0
    || (enrichment?.features?.convenience?.length || 0) > 0
    || (enrichment?.features?.other?.length || 0) > 0,
  )
  const hasRecalls = (enrichment?.recalls?.count || 0) > 0

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <div className="mb-4 text-sm font-semibold text-text-secondary">
        <Link href="/" className="underline">Home</Link> / <Link href="/carros-usados-bh" className="underline">Anúncios</Link> / {listing.title}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="pastel-card pastel-card-blue p-5">
            <h1 className="text-3xl font-black text-dark sm:text-4xl">{listing.title}</h1>
            <p className="mt-2 text-sm font-semibold text-text-secondary">
              {listing.brand} {listing.model} {listing.version ? `• ${listing.version}` : ''}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {displayGallery.map((url, index) => (
                <div key={`${url}-${index}`} className="aspect-square overflow-hidden rounded-2xl bg-white/70">
                  <img
                    src={url}
                    alt={`${listing.title} foto ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pastel-card pastel-card-yellow p-5">
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

          {hasPowertrainData ? (
            <div className="pastel-card pastel-card-blue p-5">
              <h2 className="text-xl font-black text-dark">Ficha técnica complementar</h2>
              <div className="mt-4 grid gap-2 text-sm text-dark sm:grid-cols-2">
                <p><strong>Motor:</strong> {enrichment?.powertrain.engine || 'Não informado'}</p>
                <p><strong>Potência:</strong> {enrichment?.powertrain.horsepower ? `${enrichment.powertrain.horsepower} cv` : 'Não informado'}</p>
                <p><strong>Torque:</strong> {enrichment?.powertrain.torque ? `${enrichment.powertrain.torque} Nm` : 'Não informado'}</p>
                <p><strong>Câmbio:</strong> {enrichment?.powertrain.transmission || 'Não informado'}</p>
                <p><strong>Tração:</strong> {enrichment?.powertrain.drivetrain || 'Não informado'}</p>
                <p><strong>Combustível:</strong> {enrichment?.powertrain.fuelType || 'Não informado'}</p>
              </div>
            </div>
          ) : null}

          {hasDimensions ? (
            <div className="pastel-card pastel-card-green p-5">
              <h2 className="text-xl font-black text-dark">Dimensões e espaço</h2>
              <div className="mt-4 grid gap-2 text-sm text-dark sm:grid-cols-2">
                <p><strong>Comprimento:</strong> {enrichment?.dimensions.length ? `${enrichment.dimensions.length}` : 'Não informado'}</p>
                <p><strong>Largura:</strong> {enrichment?.dimensions.width ? `${enrichment.dimensions.width}` : 'Não informado'}</p>
                <p><strong>Altura:</strong> {enrichment?.dimensions.height ? `${enrichment.dimensions.height}` : 'Não informado'}</p>
                <p><strong>Entre-eixos:</strong> {enrichment?.dimensions.wheelbase ? `${enrichment.dimensions.wheelbase}` : 'Não informado'}</p>
                <p><strong>Peso:</strong> {enrichment?.dimensions.curbWeight ? `${enrichment.dimensions.curbWeight}` : 'Não informado'}</p>
                <p><strong>Lugares:</strong> {enrichment?.dimensions.seatingCapacity || 'Não informado'}</p>
              </div>
            </div>
          ) : null}

          {hasFeatures ? (
            <div className="pastel-card pastel-card-lilac p-5">
              <h2 className="text-xl font-black text-dark">Tecnologia e segurança</h2>
              <div className="mt-3 space-y-2 text-sm text-dark">
                {(enrichment?.features.technology || []).length > 0 ? <p><strong>Tecnologia:</strong> {enrichment?.features.technology.join(', ')}</p> : null}
                {(enrichment?.features.safety || []).length > 0 ? <p><strong>Segurança:</strong> {enrichment?.features.safety.join(', ')}</p> : null}
                {(enrichment?.features.comfort || []).length > 0 ? <p><strong>Conforto:</strong> {enrichment?.features.comfort.join(', ')}</p> : null}
                {(enrichment?.features.convenience || []).length > 0 ? <p><strong>Conveniência:</strong> {enrichment?.features.convenience.join(', ')}</p> : null}
              </div>
            </div>
          ) : null}

          {hasRecalls ? (
            <div className="pastel-card p-5 bg-[#fff3e8]">
              <h2 className="text-xl font-black text-dark">Avisos de recall (opcional)</h2>
              <p className="mt-1 text-xs font-semibold text-text-secondary">
                Referência internacional (EUA). Confirme no Brasil com rede autorizada e órgãos locais.
              </p>
              <div className="mt-3 space-y-3">
                {enrichment?.recalls.items.slice(0, 3).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl bg-white/80 p-3 text-sm text-dark">
                    <p className="font-black">{item.title}</p>
                    {item.description ? <p className="mt-1 text-text-secondary">{item.description}</p> : null}
                    {item.remedy ? <p className="mt-1"><strong>Solução:</strong> {item.remedy}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="pastel-card pastel-card-green p-5">
            <p className="text-sm font-black uppercase tracking-widest text-text-tertiary">Preço pedido</p>
            <p className="mt-1 text-4xl font-black text-dark">{formatBRL(Number(listing.price))}</p>

            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm">
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

          <div className="pastel-card pastel-card-lilac p-5">
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
