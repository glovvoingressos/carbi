import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { formatBRL } from '@/data/cars'
import { getCarDetail, getCarVariants } from '@/lib/data-fetcher'
import { getFipePrice, getFipeHistory, getFipeYearsByModelName } from '@/lib/fipe-api'
import CarCard from '@/components/car/CarCard'
import {
  Fuel, Zap, Gauge, Shield, Package, Timer, ChevronRight, TrendingDown, ArrowRight
} from 'lucide-react'
import { VehicleSchema } from '@/components/seo/JSONLD'
import ReviewSection from '@/components/car/ReviewSection'
import VideoReviews from '@/components/car/VideoReviews'
import CarImage from '@/components/car/CarImage'
import YearSelector from '@/components/car/YearSelector'
import FipeHistory from '@/components/car/FipeHistory'
import { getEnhancedSpecs } from '@/lib/car-query-service'
import { getListingVehicleId, getRelatedListings } from '@/lib/marketplace-server'
import MarketplaceListingCard from '@/components/marketplace/ListingCard'
import { getAllCars } from '@/lib/data-fetcher'
import { getVehicleEnrichmentForPublic } from '@/lib/vehicle-enrichment-server'

export async function generateMetadata({ params }: { params: Promise<{ brand: string; model: string }> }): Promise<Metadata> {
  const resolved = await params
  const car = await getCarDetail(resolved.brand, resolved.model)

  if (!car) return { title: 'Carro não encontrado' }
  return {
    title: `${car.brand} ${car.model} ${car.version} (${car.year}) — Preço e Especificações`,
    description: car.shortDesc,
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
  let car = await getCarDetail(resolved.brand, resolved.model)

  if (!car) notFound()
  const modelVariants = await getCarVariants(resolved.brand, resolved.model)
  if (searchVersion && modelVariants.length > 0) {
    const desired = searchVersion.trim().toLowerCase()
    const matched = modelVariants.find((variant) => variant.version.trim().toLowerCase() === desired)
      || modelVariants.find((variant) => variant.version.trim().toLowerCase().includes(desired))
    if (matched) {
      car = matched
    }
  }

  const requestedYear = searchYear ? parseInt(searchYear, 10) : car.year

  const allCars = await getAllCars()
  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const segmentCars = allCars.filter((c) => c.segment === car.segment)
  const similarCars = segmentCars.filter((c) => c.id !== car.id).slice(0, 4)
  const benchmarkCars = segmentCars.length > 0 ? segmentCars : [car]
  const bestPrice = Math.min(...benchmarkCars.map((c) => c.priceBrl))
  const bestConsumption = Math.max(...benchmarkCars.map((c) => c.fuelEconomyCityGas))
  const bestHp = Math.max(...benchmarkCars.map((c) => c.horsepower))
  const bestTorque = Math.max(...benchmarkCars.map((c) => c.torque))
  const bestTrunk = Math.max(...benchmarkCars.map((c) => c.trunkCapacity))

  let availableYears: number[] = []
  try {
    availableYears = await getFipeYearsByModelName(car.brand, car.model, 24, car.version)
  } catch {
    console.error('Failed to fetch years for selector')
  }

  const displayYear = Number.isFinite(requestedYear) && availableYears.includes(requestedYear)
    ? requestedYear
    : (availableYears[0] || null)

  const fipeData = displayYear ? await getFipePrice(car.brand, car.model, displayYear, car.version) : null
  const priceHistory = await getFipeHistory(car.brand, car.model, 6, car.version)
  const enhancedSpecs = displayYear ? await getEnhancedSpecs(car.brand, car.model, displayYear) : null
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

  const displayHp = enhancedSpecs?.horsepower || car.horsepower
  const displayTorque = enhancedSpecs?.torque || car.torque
  const displayWeight = enhancedSpecs?.weight || car.weightKg
  const displayEngine = car.displacement && car.displacement !== 'Não informado'
    ? `${car.engineType} ${car.displacement}L${car.turbo ? ' Turbo' : ''}`
    : 'Não informado'
  const displayTransmission = car.transmission && car.transmission !== 'Não informado' ? car.transmission : 'Não informado'
  const displayFuel = car.engineType && car.engineType !== 'Não informado' ? car.engineType : 'Não informado'
  const displayConsumption = car.fuelEconomyCityGas > 0 ? `${car.fuelEconomyCityGas} km/l` : 'Não informado'
  const displayTrunk = car.trunkCapacity > 0 ? `${car.trunkCapacity} L` : 'Não informado'

  return (
    <div className="container pt-24 pb-8">
      <VehicleSchema vehicle={car} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-tertiary mb-6 overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-text-primary transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href="/marcas" className="hover:text-text-primary transition-colors shrink-0">Marcas</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href={`/marcas/${brandSlug}`} className="hover:text-text-primary transition-colors shrink-0">{car.brand}</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-text-primary font-medium truncate">{car.model}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── MAIN COLUMN ── */}
        <div className="space-y-8">

          {/* Hero */}
          <div className="grid md:grid-cols-2 card-elevated overflow-hidden">
            <div className="aspect-square bg-[#FAFAF9] flex items-center justify-center relative overflow-hidden">
              <CarImage
                id={car.id}
                brand={car.brand}
                model={car.model}
                year={car.year}
                src={car.image}
                fit="cover"
                aspectRatio="1/1"
                className="h-full w-full"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-accent text-[10px]">{car.segment}</span>
                {car.year === 2024 && <span className="badge badge-neutral text-[10px]">Novo</span>}
                {car.turbo && <span className="badge badge-neutral text-[10px]">Turbo</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary leading-tight mb-1">{car.brand} {car.model}</h1>
              <p className="text-sm text-text-secondary mb-1">{car.version}</p>
              <p className="text-xs text-text-tertiary mb-3">Preço FIPE</p>
              <p className="text-3xl md:text-4xl font-bold text-accent tracking-tight">{displayPriceLabel}</p>
              <div className="flex gap-3 mt-5 items-center">
                <YearSelector currentYear={displayYear || 'Sem ano'} availableYears={availableYears} />
              </div>

              {searchYear && (
                <div className="mt-3 px-3 py-2 bg-accent-light rounded-lg text-xs font-medium text-accent">
                  Exibindo dados de {displayYear}. Alguns campos podem variar por versão.
                </div>
              )}

              <p className="text-sm text-text-secondary mt-5 leading-relaxed">{car.shortDesc}</p>
              <p className="text-sm text-text-primary mt-2">
                <span className="font-medium">Ideal para:</span> {car.idealFor}
              </p>
            </div>
          </div>

          {/* Advertise CTA */}
          <section className="card p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">Destaque</p>
                <p className="text-sm font-semibold text-text-primary mt-1">Quer anunciar seu carro?</p>
                <p className="text-xs text-text-secondary mt-0.5">Publique em minutos, com fotos e contato direto.</p>
              </div>
              <Link href="/anunciar-carro" className="btn btn-primary btn-sm shrink-0">
                Anunciar meu carro
              </Link>
            </div>
          </section>

          {/* Key Stats Mobile */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <StatCard label="Preço FIPE" value={displayPriceLabel} isWinner={fipePrice !== null ? fipePrice <= bestPrice : false} />
            <StatCard label="Consumo" value={displayConsumption} isWinner={car.fuelEconomyCityGas > 0 ? car.fuelEconomyCityGas === bestConsumption : false} />
            <StatCard label="Potência" value={`${displayHp} cv`} isWinner={displayHp >= bestHp} />
            <StatCard label="Torque" value={`${displayTorque} Nm`} isWinner={displayTorque >= bestTorque} />
          </div>

          {/* Specs Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <p className="label mb-4">Especificações</p>
              <div className="space-y-3 text-sm">
                <SpecRow label="Motor" value={displayEngine} />
                <SpecRow label="Câmbio" value={displayTransmission} />
                <SpecRow label="Combustível" value={displayFuel} />
                <SpecRow label="Tração" value={car.drive} />
                <SpecRow label="Peso" value={`${displayWeight} kg`} />
                <SpecRow label="Comprimento" value={`${car.lengthMm} mm`} />
                <SpecRow label="Entre-eixos" value={`${car.wheelbaseMm} mm`} />
                <SpecRow label="Porta-malas" value={displayTrunk} isWinner={car.trunkCapacity > 0 ? car.trunkCapacity === bestTrunk : false} />
                <SpecRow label="Vel. máxima" value={`${car.topSpeed} km/h`} />
                <SpecRow label="0-100 km/h" value={`${car.acceleration0100}s`} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <p className="label mb-4">Motor ({displayYear})</p>
                <div className="space-y-3 text-sm">
                  <SpecRow label="Potência" value={displayHp > 0 ? `${displayHp} cv` : 'Não informado'} isWinner={displayHp > 0 ? displayHp >= bestHp : false} />
                  <SpecRow label="Torque" value={displayTorque > 0 ? `${displayTorque} Nm` : 'Não informado'} isWinner={displayTorque > 0 ? displayTorque >= bestTorque : false} />
                  <SpecRow label="Tipo Motor" value={displayEngine} />
                  <SpecRow label="Aspiração" value={car.turbo ? 'Turbo' : 'Natural'} />
                </div>
              </div>

              <div className="card p-6">
                <p className="label mb-4">Segurança & Tech</p>
                <div className="space-y-3 text-sm">
                  <SpecRow label="Airbags" value={car.airbagsCount > 0 ? `${car.airbagsCount}` : 'Não informado'} />
                  <SpecRow label="Latin NCAP" value={car.latinNcap > 0 ? `${car.latinNcap}/5` : 'N/A'} />
                  <SpecRow label="Multimídia" value={car.hasMultimedia ? 'Sim' : 'Não'} />
                  <SpecRow label="Smartphone" value={car.hasCarplay ? 'Apple/Android' : 'Não'} />
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          {modelVariants.length > 1 && (
            <section className="card p-5">
              <h2 className="text-base font-bold text-text-primary mb-1">Versões do {car.model}</h2>
              <p className="text-xs text-text-secondary mb-3">Selecione uma versão para atualizar preço e ficha.</p>
              <div className="flex flex-wrap gap-1.5">
                {modelVariants.slice(0, 20).map((variant) => (
                  <Link
                    key={`${variant.id}-${variant.year}-${variant.version}`}
                    href={`/${brandSlug}/${car.slug}?version=${encodeURIComponent(variant.version)}${displayYear ? `&year=${displayYear}` : ''}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      variant.version === car.version
                        ? 'bg-accent text-white'
                        : 'bg-bg-alt text-text-secondary hover:bg-accent-light hover:text-accent'
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
              <div className="bg-bg-alt p-5 rounded-xl">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">✓ Pontos fortes</p>
                <ul className="space-y-2 text-sm text-text-primary">
                  {car.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-success rounded-full mt-1.5 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-bg-alt p-5 rounded-xl">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">✗ Pontos fracos</p>
                <ul className="space-y-2 text-sm text-text-primary">
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
            <h2 className="text-lg font-bold text-text-primary mb-4">
              Vale a pena comprar o {car.brand} {car.model} em 2026?
            </h2>
            <div className="text-sm text-text-secondary space-y-3 leading-relaxed">
              <p>
                O <strong>{car.brand} {car.model} {car.year}</strong> consolida-se como uma opção de {car.segment} que atende bem ao mercado atual.
                Com motorização {car.engineType} e desempenho focado na eficiência, ele faz cerca de {car.fuelEconomyCityGas} km/l na cidade, o que representa um custo competitivo.
              </p>
              <p>
                Levando em conta o desgaste natural e a projeção de valor ao longo do tempo, a revenda
                tende a ser em linha com os concorrentes diretos. Se você busca {car.pros[0]?.toLowerCase()} com a segurança
                de ter {car.trunkCapacity}L de porta-malas, vale sim a pena incluí-lo no seu radar.
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Link href="/carros-usados-bh" className="btn btn-primary btn-sm">
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
              <StatCard label="Preço FIPE" value={displayPriceLabel} isWinner={fipePrice !== null ? fipePrice <= bestPrice : false} />
              <StatCard label="Consumo" value={displayConsumption} isWinner={car.fuelEconomyCityGas > 0 ? car.fuelEconomyCityGas === bestConsumption : false} />
              <StatCard label="Potência" value={`${car.horsepower} cv`} isWinner={car.horsepower === bestHp} />
              <StatCard label="Torque" value={`${car.torque} Nm`} isWinner={car.torque === bestTorque} />
              <StatCard label="Porta-malas" value={displayTrunk} isWinner={car.trunkCapacity > 0 ? car.trunkCapacity === bestTrunk : false} />
            </div>
          </div>

          <div className="card p-5">
            <p className="text-xs text-text-tertiary font-medium mb-1">Preço Sugerido</p>
            <p className="text-2xl font-bold text-text-primary mb-4 tracking-tight">{formatBRL(car.priceBrl)}</p>
          </div>
        </aside>

      </div>

      {/* Similar Cars */}
      {similarCars.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-text-primary mb-6">Carros similares</h2>
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
          <h2 className="text-lg font-bold text-text-primary mb-6">Anúncios deste modelo</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {relatedListings.map((listing) => (
              <MarketplaceListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}
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
  }

  return (
    <div className={`rounded-lg p-3 ${isWinner ? 'bg-success/10' : 'bg-bg-alt'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-text-tertiary">{icons[label] || null}</span>
        <p className="text-xs text-text-tertiary font-medium">{label}</p>
      </div>
      <p className="text-sm font-bold text-text-primary">{value}</p>
      {isWinner && <p className="text-xs font-medium text-success mt-0.5">Melhor do segmento</p>}
    </div>
  )
}

function SpecRow({ label, value, isWinner }: { label: string; value: string; isWinner?: boolean }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-medium ${isWinner ? 'text-success' : 'text-text-primary'}`}>{value}</span>
    </div>
  )
}
