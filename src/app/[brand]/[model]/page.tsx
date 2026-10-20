import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCarDetail, getCarVariants, isTiggoFamilyRoute } from '@/lib/data-fetcher'
import { getFipePrice, getFipeHistory, getFipeYearsByModelName } from '@/lib/fipe-api'
import { formatBRL } from '@/data/cars'
import CarCard from '@/components/car/CarCard'
import {
  Fuel, Zap, Gauge, Shield, Package, Timer, ChevronRight, TrendingDown, ArrowRight
} from 'lucide-react'
import { BreadcrumbSchema, VehicleSchema } from '@/components/seo/JSONLD'
import ReviewSection from '@/components/car/ReviewSection'
import VideoReviews from '@/components/car/VideoReviews'
import CarImage from '@/components/car/CarImage'
import YearSelector from '@/components/car/YearSelector'
import FipeHistory from '@/components/car/FipeHistory'
import { getListingVehicleId, getRelatedListings } from '@/lib/marketplace-server'
import MarketplaceListingCard from '@/components/marketplace/ListingCard'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import { getVehicleEnrichmentForPublic } from '@/lib/vehicle-enrichment-server'
import { slugifyBrand } from '@/lib/brand-utils'
import { heroFont } from '@/components/home/home-font'
import { getCatalogCarImage } from '@/data/unsafeCarAssets'
import './model-page.css'

export async function generateStaticParams() {
  const cars = await getAllCars()
  const params = groupCarsByModel(cars)
    .map((item) => ({
      brand: slugifyBrand(item.representative.brand),
      model: item.modelSlug,
    }))
    .slice(0, 250)

  if (cars.some((car) => slugifyBrand(car.brand) === 'caoa-chery' && /^tiggo/i.test(car.model))) {
    params.push({ brand: 'caoa-chery', model: 'tiggo' })
  }
  return params
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; model: string }>
  searchParams: Promise<{ year?: string; version?: string }>
}): Promise<Metadata> {
  const resolved = await params
  const sp = await searchParams
  if (sp.year?.trim() && !/^\d{4}$/.test(sp.year)) {
    return { title: 'Ano-modelo não encontrado', robots: { index: false, follow: true } }
  }
  if (isTiggoFamilyRoute(resolved.brand, resolved.model)) {
    const hasVariantParameters = Boolean(sp.year?.trim() || sp.version?.trim())
    const title = 'Linha CAOA Chery Tiggo: compare Tiggo 5X, 7 e 8'
    const description = 'Compare os modelos Tiggo 5X, Tiggo 7 e Tiggo 8 da CAOA Chery e acesse a ficha técnica da geração desejada.'
    return {
      title,
      description,
      alternates: { canonical: `/${resolved.brand}/${resolved.model}` },
      robots: hasVariantParameters ? { index: false, follow: true } : { index: true, follow: true },
      openGraph: {
        title: `${title} | Carbi`,
        description,
        url: `/${resolved.brand}/${resolved.model}`,
        type: 'website',
      },
    }
  }
  let car = await getCarDetail(resolved.brand, resolved.model)

  if (!car) return { title: 'Carro não encontrado' }
  if (sp.version?.trim()) {
    const variants = await getCarVariants(resolved.brand, resolved.model)
    const requestedVersion = sp.version.trim().toLocaleLowerCase('pt-BR')
    const matchingVariant = variants.find((variant) => variant.version.trim().toLocaleLowerCase('pt-BR') === requestedVersion)
    if (!matchingVariant) return { title: 'Versão não encontrada', robots: { index: false, follow: true } }
    car = matchingVariant
  }
  const catalogImage = getCatalogCarImage(car.brand, car.model, car.image)
  const modelName = `${car.brand} ${car.model}`
  const requestedYear = sp.year && /^\d{4}$/.test(sp.year) ? Number.parseInt(sp.year, 10) : Number.NaN
  let metadataYears: number[] = []
  try {
    metadataYears = await getFipeYearsByModelName(car.brand, car.model, 24, car.version)
  } catch (error) {
    console.error('Unable to resolve FIPE years for catalog metadata', error)
  }
  const titleYear = Number.isInteger(requestedYear) && (metadataYears.length === 0 || metadataYears.includes(requestedYear))
    ? requestedYear
    : (metadataYears.includes(car.year) ? car.year : metadataYears[0] || car.year)
  if (Number.isInteger(requestedYear) && metadataYears.length > 0 && !metadataYears.includes(requestedYear)) {
    return { title: 'Ano-modelo não encontrado', robots: { index: false, follow: true } }
  }
  const titleVersion = car.version
  const title = `${modelName} ${titleYear} ${titleVersion}: preço e ficha técnica`
  // O template do layout já adiciona "| Carbi"; OG/Twitter não passam por ele.
  const socialTitle = `${title} | Carbi`
  const description = `Consulte dados de catálogo e preço FIPE do ${modelName} ${titleYear} ${titleVersion}. A FIPE pode não ter valor disponível para todas as combinações de ano e versão.`
  const hasVariantParameters = Boolean(sp.year?.trim() || sp.version?.trim())

  return {
    title,
    description,
    keywords: [car.brand, car.model, car.version, 'preço FIPE', 'carros à venda', 'seminovos à venda', 'carro usado'],
    alternates: {
      canonical: `/${resolved.brand}/${resolved.model}`,
    },
    robots: hasVariantParameters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: socialTitle,
      description,
      url: `/${resolved.brand}/${resolved.model}`,
      type: 'website',
      ...(titleYear === car.year && catalogImage ? { images: [{ url: catalogImage, alt: modelName }] } : {}),
    },
  }
}

export default async function CarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; model: string }>
  searchParams: Promise<{ year?: string; version?: string }>
}) {
  const resolved = await params
  const { year: searchYear, version: searchVersion } = await searchParams
  if (isTiggoFamilyRoute(resolved.brand, resolved.model)) {
    const familyModels = groupCarsByModel((await getAllCars()).filter((car) =>
      slugifyBrand(car.brand) === 'caoa-chery' && /^tiggo\s/i.test(car.model),
    )).sort((a, b) => a.modelSlug.localeCompare(b.modelSlug))
    if (familyModels.length === 0) notFound()
    return <TiggoFamilyHub models={familyModels} />
  }
  let car = await getCarDetail(resolved.brand, resolved.model)

  if (!car) notFound()
  const modelVariants = await getCarVariants(resolved.brand, resolved.model)
  if (searchVersion?.trim()) {
    const desired = searchVersion.trim().toLocaleLowerCase('pt-BR')
    const matched = modelVariants.find((variant) => variant.version.trim().toLocaleLowerCase('pt-BR') === desired)
    if (!matched) notFound()
    car = matched
  }
  const catalogImage = getCatalogCarImage(car.brand, car.model, car.image)

  const hasValidSearchYear = searchYear && /^\d{4}$/.test(searchYear)
  if (searchYear && !hasValidSearchYear) notFound()

  const allCars = await getAllCars()
  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const segmentCars = allCars.filter((c) => c.segment === car.segment)
  const similarCars = segmentCars.filter((c) => c.id !== car.id).slice(0, 4)

  let availableYears: number[] = []
  try {
    availableYears = await getFipeYearsByModelName(car.brand, car.model, 24, car.version)
  } catch {
    console.error('Failed to fetch years for selector')
  }

  const requestedYear = hasValidSearchYear ? Number.parseInt(searchYear, 10) : car.year
  if (hasValidSearchYear && availableYears.length > 0 && !availableYears.includes(requestedYear)) notFound()
  const displayYear = Number.isInteger(requestedYear) && availableYears.includes(requestedYear)
    ? requestedYear
    : hasValidSearchYear
      ? requestedYear
      : (availableYears.includes(car.year) ? car.year : availableYears[0] || car.year)

  const fipeData = displayYear ? await getFipePrice(car.brand, car.model, displayYear, car.version) : null
  const priceHistory = await getFipeHistory(car.brand, car.model, 6, car.version)
  const isCatalogYear = displayYear === car.year
  const selectedCatalogImage = isCatalogYear ? catalogImage : null
  const relatedListings = await getRelatedListings({
    brand: car.brand,
    model: car.model,
    yearModel: displayYear || undefined,
    limit: 4,
  })
  const primaryListing = relatedListings[0]
  const listingVehicleId = primaryListing?.vehicle_id || (primaryListing ? await getListingVehicleId(primaryListing.id) : null)
  const modelEnrichment = listingVehicleId ? (await getVehicleEnrichmentForPublic(listingVehicleId)).enrichment : null

  const parseFipeValue = (val: string) => parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));

  const fipePrice = fipeData ? parseFipeValue(fipeData.price) : null
  const displayPriceLabel = fipePrice ? formatBRL(fipePrice) : 'Não disponível'

  const displayHp = isCatalogYear ? car.horsepower : 0
  const displayTorque = isCatalogYear ? car.torque : 0
  const displayWeight = isCatalogYear ? car.weightKg : 0
  const displacementValue = Number.parseFloat(String(car.displacement).replace(',', '.'))
  const displacementText = String(car.displacement || '').trim()
  const displacementParts = displacementText.match(/^(\d+(?:[.,]\d+)?)(.*)$/)
  const displayEngine = isCatalogYear
    ? Number.isFinite(displacementValue) && displacementValue > 0
      ? `${displacementParts?.[1]?.replace(',', '.') || displacementText} L${displacementParts?.[2] ? ` ${displacementParts[2].trim()}` : ''}${car.turbo && !/turbo/i.test(displacementParts?.[2] || '') ? ' Turbo' : ''}`
      : car.engineType === 'Elétrico' ? 'Elétrico' : 'Não informado'
    : 'Não informado'
  const displayTransmission = isCatalogYear && car.transmission && car.transmission !== 'Não informado' ? car.transmission : 'Não informado'
  const displayFuel = isCatalogYear && ['Gasolina', 'Flex', 'Diesel', 'Elétrico', 'Híbrido', 'Híbrido plug-in'].includes(car.engineType)
    ? car.engineType
    : 'Não informado'
  const displayConsumption = isCatalogYear && car.fuelEconomyCityGas > 0
    ? car.engineType === 'Flex' && car.fuelEconomyCityEthanol
      ? `${car.fuelEconomyCityGas} km/l (gasolina) · ${car.fuelEconomyCityEthanol} km/l (etanol)`
      : `${car.fuelEconomyCityGas} km/l (${car.engineType.toLocaleLowerCase('pt-BR')})`
    : 'Não informado'
  const displayTrunk = isCatalogYear && car.trunkCapacity > 0 ? `${car.trunkCapacity} L` : 'Não informado'
  const cargoLabel = car.segment === 'pickup' ? 'Caçamba' : 'Porta-malas'
  const displayWeightLabel = displayWeight > 0 ? `${displayWeight} kg` : 'Não informado'
  const catalogMeasure = (value: number, unit: string) => isCatalogYear && Number.isFinite(value) && value > 0 ? `${value} ${unit}` : 'Não informado'
  const schemaVehicle = isCatalogYear
    ? { ...car, image: selectedCatalogImage || undefined, year_model: displayYear }
    : { ...car, image: undefined, year_model: displayYear, engineType: undefined, transmission: undefined, fuel: undefined, fuelType: undefined, color: undefined }

  return (
    <div className={`car-model-page ${heroFont.variable}`}>
      <div className="cmp-container">
      <VehicleSchema vehicle={schemaVehicle} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Marcas', url: '/marcas' },
        { name: car.brand, url: `/marcas/${brandSlug}` },
        { name: car.model, url: `/${resolved.brand}/${resolved.model}` },
      ]} />

      {/* Breadcrumb */}
      <nav className="cmp-breadcrumb flex items-center gap-1.5 text-sm text-[#A3A3A3] mb-6 overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-[#0A0A0A] transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href="/marcas" className="hover:text-[#0A0A0A] transition-colors shrink-0">Marcas</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href={`/marcas/${brandSlug}`} className="hover:text-[#0A0A0A] transition-colors shrink-0">{car.brand}</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-[#0A0A0A] font-medium truncate">{car.model}</span>
      </nav>

      {/* Main Grid */}
      <div className="cmp-main-grid grid items-start gap-8 lg:grid-cols-[1fr_360px] max-[330px]:gap-5">

        {/* ── MAIN COLUMN ── */}
        <div className="cmp-content-column space-y-8">

          {/* Hero */}
          <section className="cmp-hero card-elevated grid overflow-hidden md:grid-cols-2">
            <div className="cmp-hero-photo relative flex items-center justify-center overflow-hidden bg-[#FAFAF9]">
              {isCatalogYear ? <CarImage
                id={car.id}
                brand={car.brand}
                model={car.model}
                year={car.year}
                src={selectedCatalogImage || undefined}
                priority
                strict
                fit="contain"
                aspectRatio="1/1"
                className="h-full w-full"
              /> : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-[#737373]">
                  Imagem não confirmada para o ano-modelo {displayYear}.
                </div>
              )}
              {selectedCatalogImage?.startsWith('https://cloudfront.alpes.one/') && (
                <span className="cmp-photo-caption">Imagem oficial CAOA Chery</span>
              )}
            </div>
            <div className="cmp-hero-copy flex flex-col justify-center p-6 md:p-8 max-[330px]:p-4">
              <div className="cmp-badges mb-4 flex flex-wrap gap-2">
                <span className="badge badge-brand text-[10px]">{car.segment}</span>
                {car.turbo && <span className="badge badge-neutral text-[10px]">Turbo</span>}
              </div>
              <h1 className="cmp-title mb-1 text-2xl font-bold leading-tight text-[#0A0A0A] md:text-3xl max-[330px]:text-xl">{car.brand} {car.model} {displayYear} {car.version}</h1>
              <p className="cmp-intro">Ficha técnica e referência de preço para a versão e o ano selecionados.</p>
              <div className="cmp-price-panel">
                <p className="cmp-price-label">Preço FIPE · {fipeData ? 'consulta confirmada' : 'sem valor confirmado'}</p>
                <p className="cmp-price-value">{displayPriceLabel}</p>
                {fipeData
                  ? <p className="cmp-price-source">Fonte: FIPE · referência {fipeData.referenceMonth} · ano-modelo {fipeData.modelYear}</p>
                  : <p className="cmp-price-source">Não exibimos estimativa sem uma correspondência confirmada de ano e versão.</p>}
              </div>
              <div className="flex gap-3 mt-5 items-center">
                <YearSelector currentYear={displayYear || 'Sem ano'} availableYears={availableYears} />
              </div>

              {searchYear && (
                <div className="mt-3 px-3 py-2 bg-[#ECFDF5] rounded-lg text-xs font-medium text-[#10B981]">
                  Versão de catálogo: {car.version}, ano-modelo selecionado: {displayYear}. O valor FIPE só aparece quando a versão coincide.
                </div>
              )}

              <p className="text-sm text-[#525252] mt-5 leading-relaxed">{car.shortDesc}</p>
              <p className="text-sm text-[#0A0A0A] mt-2">
                <span className="font-medium">Ideal para:</span> {car.idealFor}
              </p>
            </div>
          </section>

          {/* Advertise CTA */}
          <section className="card p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">Destaque</p>
                <p className="text-sm font-semibold text-[#0A0A0A] mt-1">Quer anunciar seu carro?</p>
                <p className="text-xs text-[#525252] mt-0.5">Publique em minutos, com fotos e contato direto.</p>
              </div>
              <Link href="/anunciar-carro" className="btn btn-primary btn-sm shrink-0">
                Anunciar meu carro
              </Link>
            </div>
          </section>

          {/* Key Stats Mobile */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <StatCard label="Preço FIPE" value={displayPriceLabel} />
            <StatCard label="Consumo" value={displayConsumption} />
            <StatCard label="Potência" value={displayHp > 0 ? `${displayHp} cv` : 'Não informado'} />
            <StatCard label="Torque" value={displayTorque > 0 ? `${displayTorque} Nm` : 'Não informado'} />
          </div>

          {/* Specs Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <p className="label mb-4">Especificações</p>
              <div className="space-y-3 text-sm">
                {isCatalogYear && car.catalogSourceUrl && (
                  <p className="text-xs leading-relaxed text-[#737373]">
                    Fonte: <a className="underline" href={car.catalogSourceUrl} target="_blank" rel="noreferrer">{car.catalogSourceLabel || 'ficha técnica do fabricante'}</a>
                    {car.catalogReference ? ` · ${car.catalogReference}` : ''}
                  </p>
                )}
                <SpecRow label="Motor" value={displayEngine} />
                <SpecRow label="Câmbio" value={displayTransmission} />
                <SpecRow label="Combustível" value={displayFuel} />
                <SpecRow label="Tração" value={isCatalogYear ? car.drive : 'Não informado'} />
                <SpecRow label="Peso" value={displayWeightLabel} />
                <SpecRow label="Comprimento" value={catalogMeasure(car.lengthMm, 'mm')} />
                <SpecRow label="Entre-eixos" value={catalogMeasure(car.wheelbaseMm, 'mm')} />
                <SpecRow label={cargoLabel} value={displayTrunk} />
                <SpecRow label="Vel. máxima" value={catalogMeasure(car.topSpeed, 'km/h')} />
                <SpecRow label="0-100 km/h" value={catalogMeasure(car.acceleration0100, 's')} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <p className="label mb-4">Motor ({displayYear})</p>
                <div className="space-y-3 text-sm">
                  <SpecRow label="Potência" value={displayHp > 0 ? `${displayHp} cv` : 'Não informado'} />
                  <SpecRow label="Torque" value={displayTorque > 0 ? `${displayTorque} Nm` : 'Não informado'} />
                  <SpecRow label="Tipo Motor" value={displayEngine} />
                  <SpecRow label="Aspiração" value={isCatalogYear ? (car.turbo ? 'Turbo' : 'Natural') : 'Não informado'} />
                </div>
              </div>

              <div className="card p-6">
                <p className="label mb-4">Segurança & Tech</p>
                <div className="space-y-3 text-sm">
                  <SpecRow label="Airbags" value={isCatalogYear && car.airbagsCount > 0 ? `${car.airbagsCount}` : 'Não informado'} />
                  <SpecRow label="Latin NCAP" value={isCatalogYear && car.latinNcap > 0 ? `${car.latinNcap}/5` : 'Não informado'} />
                  <SpecRow label="Multimídia" value={isCatalogYear ? (car.hasMultimedia ? 'Sim' : 'Não') : 'Não informado'} />
                  <SpecRow label="Smartphone" value={isCatalogYear ? (car.hasCarplay ? 'Apple/Android' : 'Não') : 'Não informado'} />
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          {modelVariants.length > 1 && (
            <section className="card p-5">
              <h2 className="text-base font-bold text-[#0A0A0A] mb-1">Versões do {car.model}</h2>
              <p className="text-xs text-[#525252] mb-3">Selecione uma versão para atualizar preço e ficha.</p>
              <div className="flex flex-wrap gap-1.5">
                {modelVariants.slice(0, 20).map((variant) => (
                  <Link
                    key={`${variant.id}-${variant.year}-${variant.version}`}
                    href={`/${brandSlug}/${car.slug}?version=${encodeURIComponent(variant.version)}${displayYear ? `&year=${displayYear}` : ''}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      variant.version === car.version
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#FAFAF9] text-[#525252] hover:bg-[#ECFDF5] hover:text-[#10B981]'
                    }`}
                  >
                    {variant.version} &bull; {variant.year}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Verdict */}
          <div className="card p-6 md:p-8">
            <p className="label mb-5">Veredito Final</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[#FAFAF9] p-5 rounded-xl">
                <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-3">✓ Pontos fortes</p>
                <ul className="space-y-2 text-sm text-[#0A0A0A]">
                  {car.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-success rounded-full mt-1.5 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#FAFAF9] p-5 rounded-xl">
                <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-3">✗ Pontos fracos</p>
                <ul className="space-y-2 text-sm text-[#0A0A0A]">
                  {car.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full mt-1.5 shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* FIPE History */}
          <FipeHistory history={priceHistory} />

          {/* SEO Section */}
          <section className="card p-6 md:p-8">
              <h2 className="text-lg font-bold text-[#0A0A0A] mb-4">
              Dados de catálogo e referência FIPE do {car.brand} {car.model}
            </h2>
            <div className="text-sm text-[#525252] space-y-3 leading-relaxed">
              <p>
                Esta página reúne os dados de catálogo da versão <strong>{car.brand} {car.model} {car.version} {displayYear}</strong>.
                {displayEngine !== 'Não informado' ? ` Motorização informada: ${displayEngine}.` : ''}
                {displayConsumption !== 'Não informado' ? ` Consumo urbano informado no catálogo: ${displayConsumption}.` : ''}
                {displayTrunk !== 'Não informado' ? ` Capacidade da ${cargoLabel.toLocaleLowerCase('pt-BR')} informada: ${displayTrunk}.` : ''}
              </p>
              <p>
                {fipeData
                  ? `O valor exibido é da FIPE para ${fipeData.modelYear}, referência ${fipeData.referenceMonth}.`
                  : 'Não exibimos um valor FIPE porque não foi possível confirmar a combinação exata de ano e versão.'}
              </p>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-[#737373]">
              Responsabilidade editorial: Carbi. A ficha técnica corresponde ao ano de catálogo exibido; a referência FIPE, quando disponível, identifica a fonte e o mês consultado acima.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#EAEAE8]">
              <Link href={`/carros-a-venda?q=${encodeURIComponent(`${car.brand} ${car.model}`)}`} className="btn btn-primary btn-sm">
                Ver ofertas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          <ReviewSection carId={car.id} />
          <VideoReviews brand={car.brand} model={car.model} year={displayYear || car.year} />
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:block sticky top-24 space-y-4">
          <div className="card p-5">
            <p className="label mb-4">Estatísticas</p>
            <div className="space-y-3">
              <StatCard label="Preço FIPE" value={displayPriceLabel} />
              <StatCard label="Consumo" value={displayConsumption} />
              <StatCard label="Potência" value={displayHp > 0 ? `${displayHp} cv` : 'Não informado'} />
              <StatCard label="Torque" value={displayTorque > 0 ? `${displayTorque} Nm` : 'Não informado'} />
              <StatCard label={cargoLabel} value={displayTrunk} />
            </div>
          </div>

        </aside>

      </div>

      {/* Similar Cars */}
      {similarCars.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-[#0A0A0A] mb-6">Carros similares</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {similarCars.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </div>
      )}

      {/* Related Listings */}
      {relatedListings.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-[#0A0A0A] mb-6">Anúncios deste modelo</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {relatedListings.map((listing) => (
              <MarketplaceListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function TiggoFamilyHub({ models }: { models: ReturnType<typeof groupCarsByModel> }) {
  return (
    <div className={`car-model-page ${heroFont.variable}`}>
      <div className="cmp-container">
        <BreadcrumbSchema items={[
          { name: 'Home', url: '/' },
          { name: 'Marcas', url: '/marcas' },
          { name: 'CAOA Chery', url: '/marcas/caoa-chery' },
          { name: 'Linha Tiggo', url: '/caoa-chery/tiggo' },
        ]} />
        <nav className="cmp-breadcrumb flex items-center gap-1.5 text-sm text-[#A3A3A3] mb-6">
          <Link href="/">Home</Link><ChevronRight className="w-3 h-3" />
          <Link href="/marcas">Marcas</Link><ChevronRight className="w-3 h-3" />
          <Link href="/marcas/caoa-chery">CAOA Chery</Link><ChevronRight className="w-3 h-3" />
          <span className="text-[#0A0A0A] font-medium">Linha Tiggo</span>
        </nav>
        <header className="cmp-family-intro card-elevated">
          <p className="cmp-family-eyebrow">CAOA Chery</p>
          <h1 className="cmp-title">Compare os modelos da linha Tiggo</h1>
          <p>Escolha a geração para consultar ficha técnica e referência FIPE da versão e do ano disponíveis.</p>
        </header>
        <section aria-label="Modelos CAOA Chery Tiggo" className="cmp-family-grid">
          {models.map(({ modelSlug, representative }) => {
            const image = getCatalogCarImage(representative.brand, representative.model, representative.image)
            return (
              <article key={modelSlug} className="cmp-family-card">
                <CarImage
                  id={representative.id}
                  brand={representative.brand}
                  model={representative.model}
                  year={representative.year}
                  src={image || undefined}
                  strict
                  fit="contain"
                  aspectRatio="4/3"
                  className="cmp-family-image"
                />
                <div className="cmp-family-copy">
                  <h2>{representative.brand} {representative.model}</h2>
                  <p>Versão de catálogo: {representative.version} · ano {representative.year}</p>
                  <Link href={`/caoa-chery/${modelSlug}`} className="btn btn-primary btn-sm">
                    Ver ficha e preço FIPE
                  </Link>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, isWinner }: { label: string; value: string; isWinner?: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    'Preço': <Fuel className="w-3.5 h-3.5" />,
    'Preço FIPE': <Fuel className="w-3.5 h-3.5" />,
    'Consumo': <Fuel className="w-3.5 h-3.5" />,
    'Potência': <Gauge className="w-3.5 h-3.5" />,
    'Torque': <Timer className="w-3.5 h-3.5" />,
    'Porta-malas': <Package className="w-3.5 h-3.5" />,
    'Caçamba': <Package className="w-3.5 h-3.5" />,
  }

  return (
    <div className={`rounded-lg p-3 ${isWinner ? 'bg-success/10' : 'bg-[#FAFAF9]'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[#A3A3A3]">{icons[label] || null}</span>
        <p className="text-xs text-[#A3A3A3] font-medium">{label}</p>
      </div>
      <p className="text-sm font-bold text-[#0A0A0A]">{value}</p>
      {isWinner && <p className="text-xs font-medium text-success mt-0.5">Melhor do segmento</p>}
    </div>
  )
}

function SpecRow({ label, value, isWinner }: { label: string; value: string; isWinner?: boolean }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[#525252]">{label}</span>
      <span className={`font-medium ${isWinner ? 'text-success' : 'text-[#0A0A0A]'}`}>{value}</span>
    </div>
  )
}
