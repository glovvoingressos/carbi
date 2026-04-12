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
import ListingImageGallery from '@/components/marketplace/ListingImageGallery'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)

  if (!listing) {
    return { title: 'Anúncio não encontrado' }
  }

  return {
    title: `${listing.title} | Comprar carro com preço FIPE na Carbi`,
    description: `Comprar carro ${listing.brand} ${listing.model} ${listing.year_model} em ${listing.city}/${listing.state}. Preço do anúncio e preço FIPE como referência.`,
    keywords: [
      'comprar carro',
      `preço FIPE ${listing.brand} ${listing.model}`,
      `${listing.brand} ${listing.model} ${listing.year_model}`,
      `carro em ${listing.city}`,
    ],
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
  const hasDescription = Boolean(listing.description?.trim())
  const hasMainSpecs = Boolean(listing.transmission || listing.fuel || listing.color || listing.city || listing.state)

  const highlights: string[] = []
  if ((listing.mileage || 0) <= 40_000) highlights.push('Baixa quilometragem')
  if ((listing.badges || []).some((item) => item.key === 'new')) highlights.push('Recém-anunciado')
  if ((listing.badges || []).some((item) => item.key === 'price_drop')) highlights.push('Preço revisado recentemente')
  if (comparison.status === 'below') highlights.push('Preço abaixo da FIPE')
  if (Array.isArray(listing.optional_items) && listing.optional_items.length > 0) {
    highlights.push(...listing.optional_items.slice(0, 4))
  }

  const engineRows = [
    { label: 'Motor', value: enrichment?.powertrain.engine || listing.engine || null },
    { label: 'Potência', value: enrichment?.powertrain.horsepower ? `${enrichment.powertrain.horsepower} cv` : (listing.horsepower ? `${listing.horsepower} cv` : null) },
    { label: 'Torque', value: enrichment?.powertrain.torque ? `${enrichment.powertrain.torque} Nm` : null },
    { label: 'Câmbio', value: enrichment?.powertrain.transmission || listing.transmission || null },
    { label: 'Tração', value: enrichment?.powertrain.drivetrain || null },
    { label: 'Combustível', value: enrichment?.powertrain.fuelType || listing.fuel || null },
  ].filter((row) => row.value)

  const efficiencyRows = [
    { label: 'Consumo cidade (ref.)', value: enrichment?.efficiency.cityMpg ? `${enrichment.efficiency.cityMpg} mpg` : null },
    { label: 'Consumo estrada (ref.)', value: enrichment?.efficiency.highwayMpg ? `${enrichment.efficiency.highwayMpg} mpg` : null },
    { label: 'Consumo combinado (ref.)', value: enrichment?.efficiency.combinedMpg ? `${enrichment.efficiency.combinedMpg} mpg` : null },
  ].filter((row) => row.value)

  const dimensionsRows = [
    { label: 'Comprimento', value: enrichment?.dimensions.length ? `${enrichment.dimensions.length}` : null },
    { label: 'Largura', value: enrichment?.dimensions.width ? `${enrichment.dimensions.width}` : null },
    { label: 'Altura', value: enrichment?.dimensions.height ? `${enrichment.dimensions.height}` : null },
    { label: 'Entre-eixos', value: enrichment?.dimensions.wheelbase ? `${enrichment.dimensions.wheelbase}` : null },
    { label: 'Peso', value: enrichment?.dimensions.curbWeight ? `${enrichment.dimensions.curbWeight}` : null },
    { label: 'Porta-malas', value: enrichment?.dimensions.cargoCapacity ? `${enrichment.dimensions.cargoCapacity}` : null },
  ].filter((row) => row.value)

  const seriesItems = [
    ...(enrichment?.features.technology || []),
    ...(enrichment?.features.safety || []),
    ...(enrichment?.features.comfort || []),
    ...(enrichment?.features.convenience || []),
    ...(enrichment?.features.other || []),
    ...(listing.optional_items || []),
  ].filter(Boolean).slice(0, 16)

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <div className="mb-4 text-sm font-semibold text-text-secondary">
        <Link href="/" className="underline">Home</Link> / <Link href="/carros-usados-bh" className="underline">Anúncios</Link> / {listing.title}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="pastel-card pastel-card-blue p-5">
            <h1 className="text-3xl font-black text-dark sm:text-4xl">{listing.brand} {listing.model}</h1>
            <p className="mt-2 text-sm font-semibold text-text-secondary">
              {listing.version || 'Versão não informada'} • {listing.year}/{listing.year_model}
            </p>
            <div className="mt-5">
              <ListingImageGallery images={displayGallery} title={listing.title} />
            </div>
          </div>

          {hasMainSpecs ? (
            <div className="pastel-card pastel-card-yellow p-5">
              <h2 className="text-xl font-black text-dark">Informações principais</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-dark sm:grid-cols-3">
                <div className="rounded-2xl bg-white/65 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Ano</p><p className="mt-1 font-bold">{listing.year}/{listing.year_model}</p></div>
                <div className="rounded-2xl bg-white/65 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">KM</p><p className="mt-1 font-bold">{listing.mileage.toLocaleString('pt-BR')} km</p></div>
                <div className="rounded-2xl bg-white/65 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Combustível</p><p className="mt-1 font-bold">{listing.fuel}</p></div>
                <div className="rounded-2xl bg-white/65 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Câmbio</p><p className="mt-1 font-bold">{listing.transmission}</p></div>
                <div className="rounded-2xl bg-white/65 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Cor</p><p className="mt-1 font-bold">{listing.color}</p></div>
                <div className="rounded-2xl bg-white/65 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Cidade</p><p className="mt-1 font-bold">{listing.city}/{listing.state}</p></div>
              </div>
            </div>
          ) : null}

          {highlights.length > 0 ? (
            <div className="pastel-card pastel-card-lilac p-5">
              <h2 className="text-xl font-black text-dark">Destaques do veículo</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlights.slice(0, 8).map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-dark"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {engineRows.length > 0 || efficiencyRows.length > 0 || dimensionsRows.length > 0 || seriesItems.length > 0 ? (
            <div className="pastel-card pastel-card-blue p-5">
              <h2 className="text-xl font-black text-dark">Especificações técnicas</h2>

              {engineRows.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text-tertiary">Motor e conjunto</h3>
                  <div className="mt-2 grid gap-2 text-sm text-dark sm:grid-cols-2">
                    {engineRows.map((row) => <p key={row.label}><strong>{row.label}:</strong> {row.value}</p>)}
                  </div>
                </div>
              ) : null}

              {efficiencyRows.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text-tertiary">Consumo</h3>
                  <div className="mt-2 grid gap-2 text-sm text-dark sm:grid-cols-2">
                    {efficiencyRows.map((row) => <p key={row.label}><strong>{row.label}:</strong> {row.value}</p>)}
                  </div>
                </div>
              ) : null}

              {dimensionsRows.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text-tertiary">Dimensões</h3>
                  <div className="mt-2 grid gap-2 text-sm text-dark sm:grid-cols-2">
                    {dimensionsRows.map((row) => <p key={row.label}><strong>{row.label}:</strong> {row.value}</p>)}
                  </div>
                </div>
              ) : null}

              {seriesItems.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text-tertiary">Itens de série</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {seriesItems.map((item, index) => (
                      <span key={`${item}-${index}`} className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-dark">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {hasDescription ? (
            <div className="pastel-card pastel-card-yellow p-5">
              <h2 className="text-xl font-black text-dark">Sobre o veículo</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">{listing.description}</p>
            </div>
          ) : null}

          {hasRecalls ? (
            <div className="pastel-card pastel-card-yellow p-5">
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

        <aside id="contato-vendedor" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="pastel-card pastel-card-green p-5">
            <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">Preço do anúncio</p>
            <p className="mt-1 text-4xl font-black text-dark">{formatBRL(Number(listing.price))}</p>

            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm">
              <p className="font-semibold text-text-secondary">Preço FIPE: {listing.fipe_price ? formatBRL(Number(listing.fipe_price)) : 'Indisponível'}</p>
              <p className="mt-2 font-bold text-dark">
                {comparison.status === 'below' && 'Este anúncio está abaixo da FIPE'}
                {comparison.status === 'near' && 'Este anúncio está próximo da FIPE'}
                {comparison.status === 'above' && 'Este anúncio está acima da FIPE'}
                {comparison.status === 'unknown' && 'Referência FIPE indisponível no momento'}
              </p>
              {listing.fipe_reference_month ? (
                <p className="mt-1 text-xs font-semibold text-text-tertiary">Referência FIPE: {listing.fipe_reference_month}</p>
              ) : null}
            </div>
          </div>

          <div className="pastel-card pastel-card-lilac p-5">
            <h3 className="text-lg font-black text-dark">Contato com vendedor</h3>
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

      <div className="fixed inset-x-0 bottom-3 z-40 px-4 lg:hidden">
        <a
          href="#contato-vendedor"
          className="mx-auto flex h-12 w-full max-w-md items-center justify-center rounded-full bg-dark px-5 text-sm font-black text-white"
        >
          Conversar com vendedor
        </a>
      </div>
    </div>
  )
}
