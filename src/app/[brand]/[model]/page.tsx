import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCarsBySegment, formatBRL } from '@/data/cars'
import { getCarDetail } from '@/lib/data-fetcher'
import CarCard from '@/components/car/CarCard'
import Badge from '@/components/ui/Badge'
import {
  Fuel, Zap, Gauge, Shield, Package, Timer, ChevronRight, ArrowLeftRight,
} from 'lucide-react'

// Remove generateStaticParams for large database to avoid slow builds
// export function generateStaticParams() { ... }

export async function generateMetadata({ params }: { params: Promise<{ brand: string; model: string }> }): Promise<Metadata> {
  const resolved = await params
  const car = await getCarDetail(resolved.brand, resolved.model)
  
  if (!car) return { title: 'Carro não encontrado' }
  return {
    title: `${car.brand} ${car.model} ${car.version} (${car.year}) — Preço e Especificações`,
    description: car.shortDesc,
  }
}

export default async function CarDetailPage({ params }: { params: Promise<{ brand: string; model: string }> }) {
  const resolved = await params
  const car = await getCarDetail(resolved.brand, resolved.model)

  if (!car) notFound()

  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const similarCars = getCarsBySegment(car.segment).filter((c) => c.id !== car.id).slice(0, 4)

  const segmentCars = getCarsBySegment(car.segment)
  const bestPrice = Math.min(...segmentCars.map((c) => c.priceBrl))
  const bestConsumption = Math.max(...segmentCars.map((c) => c.fuelEconomyCityGas))
  const bestHp = Math.max(...segmentCars.map((c) => c.horsepower))
  const bestTorque = Math.max(...segmentCars.map((c) => c.torque))
  const bestTrunk = Math.max(...segmentCars.map((c) => c.trunkCapacity))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-text-tertiary mb-6">
        <Link href="/" className="hover:text-text transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/marcas" className="hover:text-text transition-colors">Marcas</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/marcas/${brandSlug}`} className="hover:text-text transition-colors">{car.brand}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text font-medium">{car.model}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto bg-surface">
            <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" width={600} height={450} />
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge>{car.segment.charAt(0).toUpperCase() + car.segment.slice(1)}</Badge>
              {car.year === 2024 && <Badge variant="green">Novo</Badge>}
              {car.turbo && <Badge variant="highlight">Turbo</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">{car.brand} {car.model}</h1>
            <p className="text-sm text-text-secondary mt-1">{car.version}</p>
            <p className="text-sm text-text-tertiary mt-1 mb-3">Preço médio</p>
            <p className="text-3xl font-bold text-primary">{formatBRL(car.priceBrl)}</p>
            <p className="text-sm text-text-secondary mt-4 leading-relaxed">{car.shortDesc}</p>
            <p className="text-sm text-text mt-3">
              <span className="font-medium">Ideal para:</span> {car.idealFor}
            </p>
            <Link href="/comparar"
              className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
              <ArrowLeftRight className="w-4 h-4" /> Comparar carro
            </Link>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <StatCard
          label="Preço"
          value={formatBRL(car.priceBrl)}
          isWinner={car.priceBrl === bestPrice}
        />
        <StatCard
          label="Consumo cidade"
          value={`${car.fuelEconomyCityGas} km/l`}
          isWinner={car.fuelEconomyCityGas === bestConsumption}
        />
        <StatCard
          label="Potência"
          value={`${car.horsepower} cv`}
          isWinner={car.horsepower === bestHp}
        />
        <StatCard
          label="Torque"
          value={`${car.torque} Nm`}
          isWinner={car.torque === bestTorque}
        />
      </div>

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {/* Specs */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-base font-bold text-text mb-4">Especificações</h2>
          <div className="space-y-3 text-sm">
            <SpecRow label="Motor" value={`${car.engineType} ${car.displacement}L${car.turbo ? ' Turbo' : ''}`} />
            <SpecRow label="Câmbio" value={car.transmission} />
            <SpecRow label="Tração" value={car.drive} />
            <SpecRow label="Peso" value={`${car.weightKg} kg`} />
            <SpecRow label="Comprimento" value={`${car.lengthMm} mm`} />
            <SpecRow label="Entre-eixos" value={`${car.wheelbaseMm} mm`} />
            <SpecRow label="Porta-malas" value={`${car.trunkCapacity} L`} isWinner={car.trunkCapacity === bestTrunk} />
            <SpecRow label="Vel. máxima" value={`${car.topSpeed} km/h`} />
            <SpecRow label="0-100 km/h" value={`${car.acceleration0100}s`} />
          </div>
        </div>

        {/* Safety & Tech */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-text mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-text-tertiary" /> Segurança
            </h3>
            <div className="space-y-3 text-sm">
              <SpecRow label="Airbags" value={`${car.airbagsCount}`} />
              <SpecRow label="ABS" value={car.absBrakes ? 'Sim' : 'Não'} />
              <SpecRow label="ESC" value={car.esc ? 'Sim' : 'Não'} isGood={car.esc} />
              <SpecRow label="Latin NCAP" value={car.latinNcap > 0 ? `${car.latinNcap}/5` : 'N/A'} />
              <SpecRow label="ISOFIX" value={car.isofix ? 'Sim' : 'Não'} />
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-text mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-text-tertiary" /> Tecnologia
            </h3>
            <div className="space-y-3 text-sm">
              <SpecRow label="Central multimídia" value={car.hasMultimedia ? 'Sim' : 'Não'} />
              <SpecRow label="Apple CarPlay" value={car.hasCarplay ? 'Sim' : 'Não'} />
              <SpecRow label="Android Auto" value={car.hasAndroidAuto ? 'Sim' : 'Não'} />
              <SpecRow label="Câmera de ré" value={car.hasRearCamera ? 'Sim' : 'Não'} />
              <SpecRow label="Controle de cruzeiro" value={car.hasCruiseCtrl ? 'Sim' : 'Não'} />
              <SpecRow label="Ar-condicionado" value={car.hasAc ? 'Sim' : 'Não'} />
            </div>
          </div>
        </div>
      </div>

      {/* TL;DR */}
      <div className="bg-white border border-border rounded-xl p-5 mt-6">
        <h2 className="text-base font-bold text-text mb-4">Pontos fortes e fracos</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">Pontos fortes</p>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              {car.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-success rounded-full mt-1.5 flex-shrink-0" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Pontos fracos</p>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              {car.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-text-tertiary rounded-full mt-1.5 flex-shrink-0" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Similar cars */}
      {similarCars.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-bold text-text mb-4">Carros similares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarCars.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, isWinner }: { label: string; value: string; isWinner?: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    'Preço': <Fuel className="w-4 h-4 text-text-tertiary" />,
    'Consumo cidade': <Fuel className="w-4 h-4 text-text-secondary" />,
    'Potência': <Gauge className="w-4 h-4 text-text-tertiary" />,
    'Torque': <Timer className="w-4 h-4 text-text-tertiary" />,
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${isWinner ? 'border-success/40 bg-success-light' : 'border-border'}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icons[label]}
        <p className="text-xs text-text-tertiary font-medium">{label}</p>
      </div>
      <p className="text-lg font-bold text-text">{value}</p>
      {isWinner && <p className="text-xs font-medium text-success mt-0.5">Melhor do segmento</p>}
    </div>
  )
}

function SpecRow({ label, value, isGood, isWinner }: { label: string; value: string; isGood?: boolean; isWinner?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-medium ${isWinner ? 'text-success' : isGood === false ? 'text-danger' : 'text-text'}`}>{value}</span>
    </div>
  )
}

