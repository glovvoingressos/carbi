import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Calendar, MessageCircle } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { getFipeComparison } from '@/lib/marketplace'
import { getListingVehicleId, getPublicListingBySlug, getRelatedListings, getSellerInfo } from '@/lib/marketplace-server'
import ListingCard from '@/components/marketplace/ListingCard'
import ChatStarter from '@/components/marketplace/ChatStarter'
import { resolveMarketplaceCarImage } from '@/lib/car-image-fallback'
import { getVehicleEnrichmentForPublic } from '@/lib/vehicle-enrichment-server'
import ListingImageGallery from '@/components/marketplace/ListingImageGallery'
import { getAllCars } from '@/lib/data-fetcher'
import { enrichVehicle } from '@/lib/vehicle-enrichment'
import { brandsAreEquivalent, normalizeBrand } from '@/lib/brand-normalization'

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
  const catalogCars = await getAllCars()
  const sellerInfo = await getSellerInfo(listing.user_id)
  const norm = (value?: string | null) =>
    (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const targetBrand = norm(listing.brand)
  const targetModel = norm(listing.model)
  const targetVersion = norm(listing.version || '')
  const targetYear = Number(listing.year_model) || Number(listing.year) || 0

  // Função para extrair o modelo base (ex: "5 1.5 TGDI" -> "5")
  const extractBaseModel = (modelName: string): string => {
    // Remove versão do modelo (ex: "5 1.5 TGDI" -> "5")
    const parts = modelName.split(' ')
    // Se o primeiro parte é um número ou palavra curta, é provavelmente o modelo base
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts[0]
    }
    // Para modelos como "Omoda 5", retorna tudo
    return modelName
  }

  const targetBaseModel = extractBaseModel(targetModel)

  // Função para verificar se marcas são equivalentes (usa normalização)
  const brandsMatch = (brand1: string, brand2: string): boolean => {
    return brandsAreEquivalent(brand1, brand2)
  }

  // Função para verificar se modelos são equivalentes
  const modelsMatch = (model1: string, model2: string): boolean => {
    // Matching exato
    if (model1 === model2) return true
    // Model1 contém model2 ou vice-versa
    if (model1.includes(model2) || model2.includes(model1)) return true
    // Modelos base são iguais (ex: "5" de "5 1.5 TGDI")
    const base1 = extractBaseModel(model1)
    const base2 = extractBaseModel(model2)
    if (base1 === base2) return true
    return false
  }

  const catalogMatch = catalogCars
    .filter((car) => {
      const carBrand = norm(car.brand)
      const carModel = norm(car.model)
      
      // Estratégia 1: Matching exato
      if (carBrand === targetBrand && carModel === targetModel) return true
      
      // Estratégia 2: Matching parcial de marca + modelo exato
      if (carModel === targetModel && brandsMatch(carBrand, targetBrand)) return true
      
      // Estratégia 3: Matching exato de marca + modelo parcial
      if (carBrand === targetBrand && modelsMatch(carModel, targetModel)) return true
      
      // Estratégia 4: Matching parcial de ambos
      if (brandsMatch(carBrand, targetBrand) && modelsMatch(carModel, targetModel)) return true
      
      return false
    })
    .map((car) => {
      const versionNorm = norm(car.version)
      let score = 0
      if (targetYear && car.year === targetYear) score += 30
      if (targetYear && Math.abs(car.year - targetYear) <= 1) score += 12
      if (targetVersion && versionNorm.includes(targetVersion)) score += 20
      if (targetVersion && targetVersion.split(' ').some((part) => part && versionNorm.includes(part))) score += 8
      if (car.horsepower > 0) score += 5
      if (car.trunkCapacity > 0) score += 5
      // Bônus para matching exato de marca e modelo
      if (norm(car.brand) === targetBrand) score += 15
      if (norm(car.model) === targetModel) score += 15
      // Bônus para modelo base
      if (extractBaseModel(norm(car.model)) === targetBaseModel) score += 10
      return { car, score }
    })
    .sort((a, b) => b.score - a.score)[0]?.car || null
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
  const hasCatalogFallback = Boolean(catalogMatch)

  // ENRIQUECIMENTO AUTOMÁTICO: Funciona para QUALQUER carro anunciado
  // Hierarquia: Auto.dev > Catálogo Estático > Inferência Inteligente
  const autoEnriched = enrichVehicle(
    {
      brand: listing.brand,
      model: listing.model,
      version: listing.version,
      year: listing.year,
      yearModel: listing.year_model,
    },
    catalogMatch
  )

  const highlights: string[] = []
  if ((listing.mileage || 0) <= 40_000) highlights.push('Baixa quilometragem')
  if ((listing.badges || []).some((item) => item.key === 'new')) highlights.push('Recém-anunciado')
  if ((listing.badges || []).some((item) => item.key === 'price_drop')) highlights.push('Preço revisado recentemente')
  if (comparison.status === 'below') highlights.push('Preço abaixo da FIPE')
  if (Array.isArray(listing.optional_items) && listing.optional_items.length > 0) {
    highlights.push(...listing.optional_items.slice(0, 4))
  }

  // Hierarquia de dados: Auto.dev > listing > autoEnriched
  const engineText = enrichment?.powertrain.engine || listing.engine || autoEnriched.engine || null
  const transmissionText = enrichment?.powertrain.transmission || listing.transmission || autoEnriched.transmission || null
  const fuelText = enrichment?.powertrain.fuelType || listing.fuel || autoEnriched.fuel || null
  const driveText = enrichment?.powertrain.drivetrain || autoEnriched.drive || null
  const horsepowerValue = enrichment?.powertrain.horsepower || listing.horsepower || autoEnriched.horsepower || null
  const torqueValue = enrichment?.powertrain.torque || autoEnriched.torque || null

  const lengthValue = enrichment?.dimensions.length || autoEnriched.lengthMm || null
  const wheelbaseValue = enrichment?.dimensions.wheelbase || autoEnriched.wheelbaseMm || null
  const weightValue = enrichment?.dimensions.curbWeight || autoEnriched.weightKg || null
  const cargoValue = enrichment?.dimensions.cargoCapacity || autoEnriched.trunkCapacity || null
  const topSpeedValue = autoEnriched.topSpeed || null
  const accelValue = autoEnriched.acceleration0100 || null
  const airbagsValue = autoEnriched.airbagsCount || null
  const ncapValue = autoEnriched.latinNcap || null
  const hasMultimedia = autoEnriched.hasMultimedia || false
  const smartphoneValue = (autoEnriched.hasCarplay && autoEnriched.hasAndroidAuto)
    ? 'Apple CarPlay / Android Auto'
    : autoEnriched.hasCarplay
      ? 'Apple CarPlay'
      : autoEnriched.hasAndroidAuto
        ? 'Android Auto'
        : 'Não informado'
  const aspiration = (engineText || '').toLowerCase().includes('turbo') || autoEnriched.turbo ? 'Turbo' : (engineText ? 'Aspirado' : 'Não informado')

  const baseRows = [
    { label: 'Motor', value: engineText || 'Não informado' },
    { label: 'Câmbio', value: transmissionText || 'Não informado' },
    { label: 'Combustível', value: fuelText || 'Não informado' },
    { label: 'Tração', value: driveText || 'Não informado' },
    { label: 'Peso', value: weightValue ? `${weightValue} kg` : 'Não informado' },
    { label: 'Comprimento', value: lengthValue ? `${lengthValue} mm` : 'Não informado' },
    { label: 'Entre-eixos', value: wheelbaseValue ? `${wheelbaseValue} mm` : 'Não informado' },
    { label: 'Porta-malas', value: cargoValue ? `${cargoValue} L` : 'Não informado' },
    { label: 'Vel. máxima', value: topSpeedValue ? `${topSpeedValue} km/h` : 'Não informado' },
    { label: '0-100 km/h', value: accelValue ? `${accelValue}s` : 'Não informado' },
  ]

  const motorRows = [
    { label: 'Potência', value: horsepowerValue ? `${horsepowerValue} cv` : 'Não informado' },
    { label: 'Torque', value: torqueValue ? `${torqueValue} Nm` : 'Não informado' },
    { label: 'Tipo motor', value: engineText || 'Não informado' },
    { label: 'Aspiração', value: engineText ? aspiration : 'Não informado' },
  ]

  const safetyRows = [
    { label: 'Airbags', value: airbagsValue ? `${airbagsValue}` : 'Não informado' },
    { label: 'Latin NCAP', value: ncapValue ? `${ncapValue}/5` : 'Não informado' },
    { label: 'Multimídia', value: hasMultimedia ? 'Sim' : 'Não informado' },
    { label: 'Smartphone', value: smartphoneValue },
  ]

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
            <div
              className="pastel-card pastel-card-yellow rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #fef9e7 0%, #fdf3cd 50%, #faedb7 100%)' }}
            >
              <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-white/40 blur-xl" />
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#eab308]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#a16207]">
                  Veículo
                </span>
              </div>
              <h2 className="text-xl font-black text-dark">Informações principais</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-dark sm:grid-cols-3">
                <div className="rounded-2xl bg-white/75 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Ano</p><p className="mt-1 font-bold">{listing.year}/{listing.year_model}</p></div>
                <div className="rounded-2xl bg-white/75 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">KM</p><p className="mt-1 font-bold">{listing.mileage.toLocaleString('pt-BR')} km</p></div>
                <div className="rounded-2xl bg-white/75 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Combustível</p><p className="mt-1 font-bold">{listing.fuel}</p></div>
                <div className="rounded-2xl bg-white/75 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Câmbio</p><p className="mt-1 font-bold">{listing.transmission}</p></div>
                <div className="rounded-2xl bg-white/75 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Cor</p><p className="mt-1 font-bold">{listing.color}</p></div>
                <div className="rounded-2xl bg-white/75 p-3"><p className="text-[11px] font-black uppercase text-text-tertiary">Cidade</p><p className="mt-1 font-bold">{listing.city}/{listing.state}</p></div>
              </div>
            </div>
          ) : null}

          {highlights.length > 0 ? (
            <div
              className="pastel-card pastel-card-lilac rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #f3e8ff 0%, #ede9fe 50%, #e9d5ff 100%)' }}
            >
              <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -left-4 bottom-2 h-14 w-14 rounded-full bg-white/40 blur-xl" />
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#a855f7]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#7e22ce]">
                  Destaques
                </span>
              </div>
              <h2 className="text-xl font-black text-dark">Características do veículo</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {highlights.slice(0, 8).map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-wide text-dark"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-8 md:gap-10">
            <div className="bg-[#f0f4f8] rounded-[40px] p-8 sm:p-10 relative shadow-sm">
              <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[-3deg] shadow-sm uppercase">
                1. Especificações
              </div>
              <div className="space-y-4 text-sm mt-4 font-medium">
                {baseRows.map((row) => (
                  <p key={row.label} className="flex items-center justify-between gap-3">
                    <strong>{row.label}</strong>
                    <span className="text-right">{row.value}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-8 md:space-y-10">
              <div className="bg-[var(--color-bento-blue)] rounded-[40px] p-8 sm:p-10 relative shadow-sm text-dark">
                <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[2deg] shadow-sm uppercase">
                  2. Especificações do Motor ({listing.year_model})
                </div>
                <div className="space-y-4 text-sm font-semibold mt-4">
                  {motorRows.map((row) => (
                    <p key={row.label} className="flex items-center justify-between gap-3">
                      <strong>{row.label}</strong>
                      <span className="text-right">{row.value}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--color-bento-yellow)] rounded-[40px] p-8 sm:p-10 relative shadow-sm text-dark">
                <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[-1deg] shadow-sm uppercase">
                  3. Segurança e Tech
                </div>
                <div className="space-y-4 text-sm font-semibold mt-4">
                  {safetyRows.map((row) => (
                    <p key={row.label} className="flex items-center justify-between gap-3">
                      <strong>{row.label}</strong>
                      <span className="text-right">{row.value}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {seriesItems.length > 0 ? (
            <div
              className="pastel-card pastel-card-blue rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #dbeafe 0%, #d0e0fc 50%, #c5d6f9 100%)' }}
            >
              <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -left-4 bottom-2 h-14 w-14 rounded-full bg-white/40 blur-xl" />
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#3b82f6]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">
                  Equipamentos
                </span>
              </div>
              <h2 className="text-xl font-black text-dark">Itens de série</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {seriesItems.map((item, index) => (
                  <span key={`${item}-${index}`} className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-dark">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {hasDescription ? (
            <div
              className="pastel-card pastel-card-yellow rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #fef9e7 0%, #fdf3cd 50%, #faedb7 100%)' }}
            >
              <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-white/40 blur-xl" />
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#eab308]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#a16207]">
                  Descrição
                </span>
              </div>
              <h2 className="text-xl font-black text-dark">Sobre o veículo</h2>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{listing.description}</p>
            </div>
          ) : null}

          {hasRecalls ? (
            <div
              className="pastel-card pastel-card-yellow rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #fef9e7 0%, #fdf3cd 50%, #faedb7 100%)' }}
            >
              <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-white/40 blur-xl" />
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#eab308]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#a16207]">
                  Recall
                </span>
              </div>
              <h2 className="text-xl font-black text-dark">Avisos de recall</h2>
              <p className="mt-2 text-xs font-semibold text-text-secondary">
                Referência internacional (EUA). Confirme no Brasil com rede autorizada e órgãos locais.
              </p>
              <div className="mt-5 space-y-3">
                {enrichment?.recalls.items.slice(0, 3).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl bg-white/80 p-4 text-sm text-dark">
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
          <div
            className="pastel-card pastel-card-green rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #d4f7d4 0%, #c9f0c9 50%, #b8e8b8 100%)' }}
          >
            <div className="pointer-events-none absolute -right-6 -top-4 h-20 w-20 rounded-full bg-white/40 blur-2xl" />
            <div className="pointer-events-none absolute -left-4 bottom-2 h-14 w-14 rounded-full bg-white/35 blur-xl" />
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-[#22c55e]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#15803d]">
                Preço
              </span>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-dark">{formatBRL(Number(listing.price))}</p>

            <div className="mt-5 rounded-2xl bg-white/75 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">Preço FIPE</span>
                <span className="font-bold text-dark">{listing.fipe_price ? formatBRL(Number(listing.fipe_price)) : 'Indisponível'}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-dark/10">
                <p className="text-sm font-black text-dark">
                  {comparison.status === 'below' && (
                    <span className="inline-flex items-center gap-1 text-[#16a34a]">
                      <TrendingDown className="h-4 w-4" /> Abaixo da FIPE
                    </span>
                  )}
                  {comparison.status === 'near' && (
                    <span className="inline-flex items-center gap-1 text-[#ca8a04]">
                      <TrendingUp className="h-4 w-4" /> Próximo da FIPE
                    </span>
                  )}
                  {comparison.status === 'above' && (
                    <span className="inline-flex items-center gap-1 text-[#dc2626]">
                      <TrendingUp className="h-4 w-4" /> Acima da FIPE
                    </span>
                  )}
                  {comparison.status === 'unknown' && 'Referência FIPE indisponível'}
                </p>
                {listing.fipe_reference_month ? (
                  <p className="mt-1 text-xs font-semibold text-text-tertiary">Referência: {listing.fipe_reference_month}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="pastel-card pastel-card-lilac rounded-[32px] p-6 sm:p-7 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #e8d4f8 0%, #dbc5f0 50%, #d0b5e8 100%)' }}
          >
            <div className="pointer-events-none absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
            <div className="pointer-events-none absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-white/35 blur-xl" />
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center rounded-full bg-[#a855f7]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#7e22ce]">
                Contato
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              {sellerInfo?.avatarUrl ? (
                <img 
                  src={sellerInfo.avatarUrl} 
                  alt={sellerInfo.name || 'Vendedor'} 
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#a855f7]/30"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#a855f7]/20 text-[#7e22ce]">
                  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-text-secondary">Vendedor</p>
                <p className="text-lg font-black text-dark">
                  {sellerInfo?.name || (sellerInfo?.activeListings ? `${sellerInfo.activeListings} anúncios ativos` : 'Anunciante')}
                </p>
              </div>
            </div>

            {sellerInfo?.memberSince && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <Calendar className="h-4 w-4 text-[#a855f7]" />
                <span className="text-text-secondary">
                  Membro desde {new Date(sellerInfo.memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}

            <div className="mb-5 rounded-2xl bg-white/60 p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-[#a855f7] mt-0.5" />
                <div>
                  <p className="font-bold text-dark text-sm">Chat interno seguro</p>
                  <p className="text-xs text-text-secondary mt-1">Sua privacidade protegida. Sem expor telefone ou e-mail.</p>
                </div>
              </div>
            </div>

            <ChatStarter listingId={listing.id} />
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
