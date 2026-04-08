import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCarsBySegment, formatBRL } from '@/data/cars'
import { getCarDetail } from '@/lib/data-fetcher'
import CarCard from '@/components/car/CarCard'
import Badge from '@/components/ui/Badge'
import {
  Fuel, Zap, Gauge, Shield, Package, Timer, ChevronRight, ArrowLeftRight, TrendingDown
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

  // Lógica da Tabela FIPE (Estimativa base)
  const fipePrice = car.year === 2024 ? car.priceBrl * 0.98 : car.priceBrl * 1.05;
  // Projeção VIP de Desvalorização (Estimativa)
  const yr0 = fipePrice;
  const yr1 = fipePrice * 0.88;
  const yr2 = fipePrice * 0.81;
  const yr3 = fipePrice * 0.74;

  return (
    <div className="container mx-auto px-4 py-8">
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

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* COLUNA PRINCIPAL (ESQUERDA) */}
        <div className="space-y-8">
          {/* Hero */}
          <div className="w-full">
            <div className="grid md:grid-cols-2 bg-white border-2 border-dark rounded-[40px] overflow-hidden shadow-[6px_6px_0_#000]">
              <div className="aspect-[4/3] md:aspect-auto bg-[#b4d2ff] flex items-center justify-center p-8 relative">
                 {/* Estrela / Decorativo Cash App style (opcional) */}
                 <div className="absolute top-4 left-4 w-12 h-12 rounded-full border border-dark flex items-center justify-center text-dark font-black bg-[var(--color-bento-yellow)] rotate-[-10deg]">✨</div>
                 
                 <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full object-contain filter drop-shadow-2xl transition-transform hover:scale-105 duration-500 rounded-[32px] overflow-hidden shadow-sm" width={600} height={450} />
              </div>
              <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="bg-dark text-white font-black tracking-widest text-[11px] px-3 py-1.5 rounded rotate-[2deg] uppercase border border-dark">
                     {car.segment}
                  </span>
                  {car.year === 2024 && (
                     <span className="bg-[var(--color-accent)] text-dark font-black tracking-widest text-[11px] px-3 py-1.5 rounded rotate-[-3deg] uppercase shadow-[2px_2px_0_#000] border border-dark">
                       Novo
                     </span>
                  )}
                  {car.turbo && (
                     <span className="bg-[var(--color-bento-red)] text-white font-black tracking-widest text-[11px] px-3 py-1.5 rounded rotate-[1deg] uppercase shadow-[2px_2px_0_#000] border border-dark">
                       Turbo
                     </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-text tracking-[-0.04em] leading-none mb-1">{car.brand} {car.model}</h1>
                <p className="text-sm text-text-secondary mt-1">{car.version}</p>
                <p className="text-sm text-text-tertiary mt-1 mb-3">Preço médio</p>
                <p className="text-4xl sm:text-5xl font-black text-primary tracking-[-0.05em]">{formatBRL(car.priceBrl)}</p>
                <p className="text-sm text-text-secondary mt-4 leading-relaxed">{car.shortDesc}</p>
                <p className="text-sm text-text mt-3">
                  <span className="font-medium">Ideal para:</span> {car.idealFor}
                </p>
                <Link href="/comparar"
                  className="mt-6 inline-flex items-center justify-between bg-[var(--color-accent)] text-dark rounded-full pl-6 pr-2 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-max gap-8 border-2 border-dark shadow-[4px_4px_0_#000]">
                  <span className="font-black text-[13px] tracking-widest uppercase">Comparar</span>
                  <div className="w-8 h-8 flex items-center justify-center bg-dark rounded-full text-white">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Key Stats Mobile (Hidden on Desktop) */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <StatCard label="Preço" value={formatBRL(car.priceBrl)} isWinner={car.priceBrl === bestPrice} />
            <StatCard label="Consumo" value={`${car.fuelEconomyCityGas} km/l`} isWinner={car.fuelEconomyCityGas === bestConsumption} />
            <StatCard label="Potência" value={`${car.horsepower} cv`} isWinner={car.horsepower === bestHp} />
            <StatCard label="Torque" value={`${car.torque} Nm`} isWinner={car.torque === bestTorque} />
          </div>

          {/* Details grid */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 mt-12">
            <div className="bg-[#f0f4f8] rounded-[40px] p-8 sm:p-10 relative shadow-sm">
              <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[-3deg] shadow-sm uppercase">
                 1. Especificações
              </div>
              <div className="space-y-4 text-sm mt-4 font-medium">
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

            <div className="space-y-8 md:space-y-10">
              <div className="bg-[var(--color-bento-blue)] rounded-[40px] p-8 sm:p-10 relative shadow-sm text-dark">
                <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[2deg] shadow-sm uppercase">
                   2. Segurança
                </div>
                <div className="space-y-4 text-sm font-semibold mt-4">
                  <SpecRow label="Airbags" value={`${car.airbagsCount}`} />
                  <SpecRow label="ABS" value={car.absBrakes ? 'Sim' : 'Não'} />
                  <SpecRow label="ESC" value={car.esc ? 'Sim' : 'Não'} isGood={car.esc} />
                  <SpecRow label="Latin NCAP" value={car.latinNcap > 0 ? `${car.latinNcap}/5` : 'N/A'} />
                  <SpecRow label="ISOFIX" value={car.isofix ? 'Sim' : 'Não'} />
                </div>
              </div>

              <div className="bg-[var(--color-bento-yellow)] rounded-[40px] p-8 sm:p-10 relative shadow-sm text-dark">
                <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[-1deg] shadow-sm uppercase">
                   3. Tecnologia
                </div>
                <div className="space-y-4 text-sm font-semibold mt-4">
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
          <div className="bg-white rounded-[40px] p-8 sm:p-12 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-12 mb-8">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--color-accent)] text-dark font-black tracking-widest px-6 py-2.5 rounded-lg rotate-[1deg] shadow-sm uppercase whitespace-nowrap">
               Veredito Final !
            </div>
            <div className="grid sm:grid-cols-2 gap-8 md:gap-12 mt-6">
              <div className="bg-[#f0f4f8] p-6 rounded-3xl">
                <p className="text-sm font-black text-[#00D632] uppercase tracking-widest mb-4">✨ Pontos fortes</p>
                <ul className="space-y-3 text-[15px] font-medium text-dark leading-relaxed">
                  {car.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 text-white bg-[#00D632] rounded-full mt-1.5 flex-shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#f0f4f8] p-6 rounded-3xl">
                <p className="text-sm font-black text-[var(--color-bento-red)] uppercase tracking-widest mb-4">⚠️ Pontos fracos</p>
                <ul className="space-y-3 text-[15px] font-medium text-dark leading-relaxed">
                  {car.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[var(--color-bento-red)] rounded-full mt-1.5 flex-shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Informações de Mercado (VIP & FIPE) */}
          <div className="bg-[#E8D4FF] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-[40px] p-8 sm:p-12 shadow-[6px_6px_0_#000] mt-12 mb-8 relative">
            {/* Elemento flutuante decorativo */}
            <div className="absolute -top-4 -right-2 bg-[var(--color-bento-red)] text-white font-black tracking-widest text-[11px] px-4 py-2 rounded-lg rotate-[3deg] shadow-[2px_2px_0_#0A0A0A] uppercase border-2 border-[#0A0A0A]">
               Hot Deal
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-6 border-b-2 border-[#0A0A0A]/10 pb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] flex items-center gap-3 tracking-[-0.02em] uppercase">
                  <TrendingDown className="w-7 h-7 text-[#0A0A0A]" /> Tabela Fipe e Mercado
                </h2>
                <p className="text-[15px] font-bold text-[#0A0A0A]/60 mt-2">Estimativa de desvalorização (Projeção VIP)</p>
              </div>
              <div className="text-left sm:text-right bg-white/40 px-5 py-3 rounded-2xl border-2 border-[#0A0A0A]">
                <p className="text-[11px] text-[#0A0A0A] uppercase font-black tracking-widest mb-1.5">FIPE Atual</p>
                <p className="text-4xl font-black text-[#0A0A0A] tracking-[-0.05em]">{formatBRL(fipePrice)}</p>
              </div>
            </div>

            <div className="relative w-full h-[220px] mt-8">
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t-2 border-dashed border-[#0A0A0A]/15 mt-[10%]"></div>
                <div className="w-full border-t-2 border-dashed border-[#0A0A0A]/15 mt-auto mb-[50%]"></div>
                <div className="w-full border-t-2 border-solid border-[#0A0A0A]/20 mb-[10%]"></div>
              </div>

              {/* The SVG Line (Only the stretched line) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineFadeDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline 
                  fill="none" 
                  stroke="#0A0A0A" 
                  strokeWidth="0.8" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={`8,10 36,45 64,75 92,90`}
                />
                <polygon 
                  fill="url(#lineFadeDark)" 
                  points={`8,100 8,10 36,45 64,75 92,90 92,100`}
                />
              </svg>

              {/* Data Points (HTML/CSS perfectly round and crisp) */}
              {[
                { x: 8, y: 10, val: yr0, label: 'Hoje' },
                { x: 36, y: 45, val: yr1, label: '1 Ano' },
                { x: 64, y: 75, val: yr2, label: '2 Anos' },
                { x: 92, y: 90, val: yr3, label: '3 Anos' }
              ].map((pt, idx) => (
                <div key={idx} className="absolute flex flex-col items-center justify-center w-0 h-0" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                  {/* Pílula de Valor (Acima do Ponto) */}
                  <div className="absolute bottom-3 text-[13px] font-black text-[#0A0A0A] bg-white px-3 py-1 rounded-full shadow-[2px_2px_0_#0A0A0A] border-2 border-[#0A0A0A] whitespace-nowrap tracking-tight">
                    {formatBRL(pt.val)}
                  </div>
                  {/* Ponto / Nó Exato no Gráfico */}
                  <div className="absolute w-3.5 h-3.5 bg-[#0A0A0A] border-2 border-white rounded-full shadow-sm transform -translate-x-1/2 -translate-y-1/2"></div>
                  {/* Rótulo de Tempo (Abaixo do Ponto) */}
                  <div className="absolute top-4 text-[12px] font-black text-[#0A0A0A]/60 uppercase tracking-wider whitespace-nowrap">
                    {pt.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL (DIREITA) - Stick on Desktop */}
        <aside className="hidden lg:block sticky top-24 space-y-4">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">Estatísticas Principais</h3>
            <div className="space-y-4">
              <StatCard label="Preço" value={formatBRL(car.priceBrl)} isWinner={car.priceBrl === bestPrice} />
              <StatCard label="Consumo" value={`${car.fuelEconomyCityGas} km/l`} isWinner={car.fuelEconomyCityGas === bestConsumption} />
              <StatCard label="Potência" value={`${car.horsepower} cv`} isWinner={car.horsepower === bestHp} />
              <StatCard label="Torque" value={`${car.torque} Nm`} isWinner={car.torque === bestTorque} />
              <StatCard label="Porta-malas" value={`${car.trunkCapacity} L`} isWinner={car.trunkCapacity === bestTrunk} />
            </div>
          </div>
          
          <div className="bg-[var(--color-bento-yellow)] rounded-[24px] p-8 text-dark shadow-sm">
            <p className="text-sm text-dark/70 font-semibold mb-1">Preço Sugerido</p>
            <p className="text-4xl font-black mb-6 tracking-[-0.05em]">{formatBRL(car.priceBrl)}</p>
            <Link href="/comparar"
              className="w-full flex items-center justify-between bg-dark text-white rounded-full pl-6 pr-2 py-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <span className="font-black text-[14px] tracking-widest uppercase">Comparar Agora</span>
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-dark">
                 <ArrowLeftRight className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </aside>

      </div>

      {/* Similar cars */}
      {similarCars.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-text mb-6">Carros similares populares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    'Consumo': <Fuel className="w-4 h-4 text-text-secondary" />,
    'Potência': <Gauge className="w-4 h-4 text-text-tertiary" />,
    'Torque': <Timer className="w-4 h-4 text-text-tertiary" />,
    'Porta-malas': <Package className="w-4 h-4 text-text-tertiary" />,
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
    <div className="flex justify-between items-center py-1">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-medium ${isWinner ? 'text-success' : isGood === false ? 'text-danger' : 'text-text'}`}>{value}</span>
    </div>
  )
}
