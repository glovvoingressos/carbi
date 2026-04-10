import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCarsBySegment, formatBRL } from '@/data/cars'
import { getCarDetail } from '@/lib/data-fetcher'
import { getFipePrice } from '@/lib/fipe-api'
import FipeCalculator from '@/components/car/FipeCalculator'
import CarCard from '@/components/car/CarCard'
import Badge from '@/components/ui/Badge'
import {
  Fuel, Zap, Gauge, Shield, Package, Timer, ChevronRight, ArrowLeftRight, TrendingDown, ArrowRight
} from 'lucide-react'
import { VehicleSchema } from '@/components/seo/JsonLd'
import ReviewSection from '@/components/car/ReviewSection'
import VideoReviews from '@/components/car/VideoReviews'
import CarImage from '@/components/car/CarImage'
import YearSelector from '@/components/car/YearSelector'
import { getFipeHistory, getFipeYearsByModelName } from '@/lib/fipe-api'
import FipeHistory from '@/components/car/FipeHistory'
import { getEnhancedSpecs } from '@/lib/car-query-service'
import { getRelatedListings } from '@/lib/marketplace-server'
import MarketplaceListingCard from '@/components/marketplace/ListingCard'

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

export default async function CarDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ brand: string; model: string }>,
  searchParams: Promise<{ year?: string }>
}) {
  const resolved = await params
  const { year: searchYear } = await searchParams
  const car = await getCarDetail(resolved.brand, resolved.model)

  if (!car) notFound()

  const requestedYear = searchYear ? parseInt(searchYear, 10) : car.year

  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const similarCars = getCarsBySegment(car.segment).filter((c) => c.id !== car.id).slice(0, 4)

  const segmentCars = getCarsBySegment(car.segment)
  const bestPrice = Math.min(...segmentCars.map((c) => c.priceBrl))
  const bestConsumption = Math.max(...segmentCars.map((c) => c.fuelEconomyCityGas))
  const bestHp = Math.max(...segmentCars.map((c) => c.horsepower))
  const bestTorque = Math.max(...segmentCars.map((c) => c.torque))
  const bestTrunk = Math.max(...segmentCars.map((c) => c.trunkCapacity))

  let availableYears: number[] = []
  try {
    availableYears = await getFipeYearsByModelName(car.brand, car.model, 5)
  } catch {
    console.error('Failed to fetch years for selector')
  }

  if (availableYears.length === 0) {
    const baseYear = car.year || new Date().getFullYear()
    availableYears = Array.from({ length: 5 }, (_, idx) => baseYear - idx)
  }

  // Ano efetivo sempre limitado aos últimos anos válidos retornados pela API
  const displayYear = Number.isFinite(requestedYear) && availableYears.includes(requestedYear)
    ? requestedYear
    : (availableYears[0] || car.year)

  // Lógica da Tabela FIPE Real (com versão/combustível)
  const fipeData = await getFipePrice(car.brand, car.model, displayYear, car.version);

  // Busca histórico de preços (6 anos) - Agora com Version Awareness
  const priceHistory = await getFipeHistory(car.brand, car.model, 6, car.version)

  // Busca especificações aprimoradas para o ano selecionado via CarQuery
  const enhancedSpecs = await getEnhancedSpecs(car.brand, car.model, displayYear)
  const relatedListings = await getRelatedListings({
    brand: car.brand,
    model: car.model,
    yearModel: displayYear,
    limit: 4,
  })
  
  // Converte a string "R$ 150.000" em número para cálculos
  const parseFipeValue = (val: string) => parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
  
  const fipePrice = fipeData 
    ? parseFipeValue(fipeData.price) 
    : car.priceBrl;

  // Projeção VIP de Desvalorização (Agora baseada em dados reais abaixo)
  const yr0 = fipePrice;

  const displayHp = enhancedSpecs?.horsepower || car.horsepower
  const displayTorque = enhancedSpecs?.torque || car.torque
  const displayWeight = enhancedSpecs?.weight || car.weightKg

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <VehicleSchema car={car} />

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
              <div className="aspect-[16/10] md:aspect-auto bg-[#b4d2ff] flex items-center justify-center p-6 sm:p-8 relative">
                 {/* Estrela / Decorativo Cash App style (opcional) */}
                 <div className="absolute top-4 left-4 w-12 h-12 rounded-full border border-dark flex items-center justify-center text-dark font-black bg-[var(--color-bento-yellow)] rotate-[-10deg]">✨</div>
                 
                 <CarImage 
                   id={car.id} 
                   brand={car.brand} 
                   model={car.model} 
                   year={car.year} 
                   src={car.image} 
                   className="w-full object-contain filter drop-shadow-2xl transition-transform hover:scale-105 duration-500 rounded-[32px] overflow-hidden shadow-sm"
                 />
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
                <h1 className="text-3xl sm:text-5xl font-heading text-text tracking-[-0.01em] leading-none mb-1">{car.brand} {car.model}</h1>
                <p className="text-sm text-text-secondary mt-1">{car.version}</p>
                <p className="text-sm text-text-tertiary mt-1 mb-3">Preço médio</p>
                <p className="text-4xl sm:text-5xl font-normal font-sans text-primary tracking-[-0.02em]">{formatBRL(fipePrice)}</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6 items-start sm:items-center">
                   <YearSelector currentYear={displayYear} availableYears={availableYears} />
                   
                   <Link href="/comparar"
                     className="inline-flex items-center justify-between bg-[var(--color-accent)] text-dark rounded-full pl-6 pr-2 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-max gap-8 border-2 border-dark shadow-[4px_4px_0_#000]">
                     <span className="font-black text-[13px] tracking-widest uppercase">Comparar</span>
                     <div className="w-8 h-8 flex items-center justify-center bg-dark rounded-full text-white">
                       <ArrowLeftRight className="w-4 h-4" />
                     </div>
                   </Link>
                </div>
                
                {searchYear && (
                  <div className="mt-4 p-3 bg-surface border border-dashed border-dark/20 rounded-xl text-[10px] font-bold text-text-tertiary">
                     ⚠️ Exibindo dados de {displayYear}. Alguns campos técnicos podem refletir o modelo de referência 2024/2026.
                  </div>
                )}
                
                <p className="text-sm text-text-secondary mt-6 leading-relaxed">{car.shortDesc}</p>
                <p className="text-sm text-text mt-3">
                  <span className="font-medium">Ideal para:</span> {car.idealFor}
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-[32px] border-2 border-dark bg-[#dff7e8] p-6 sm:p-8 shadow-[6px_6px_0_#000]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-dark/70">Destaque</p>
                <h2 className="text-2xl font-black text-dark leading-tight mt-1">Quer vender seu carro com preço FIPE em destaque?</h2>
                <p className="text-sm font-semibold text-dark/70 mt-2">Crie um anúncio em minutos com fotos, chat e referência FIPE na hora.</p>
              </div>
              <Link
                href="/anunciar-carro-bh"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-bento-yellow)] px-6 py-3 text-dark font-black uppercase tracking-wider border-2 border-dark shadow-[4px_4px_0_#000] hover:-translate-y-1 transition-all"
              >
                Anunciar meu carro
              </Link>
            </div>
          </section>

          {/* Key Stats Mobile (Hidden on Desktop) */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <StatCard label="Preço" value={formatBRL(fipePrice)} isWinner={fipePrice <= bestPrice} />
            <StatCard label="Consumo" value={`${car.fuelEconomyCityGas} km/l`} isWinner={car.fuelEconomyCityGas === bestConsumption} />
            <StatCard label="Potência" value={`${displayHp} cv`} isWinner={displayHp >= bestHp} />
            <StatCard label="Torque" value={`${displayTorque} Nm`} isWinner={displayTorque >= bestTorque} />
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
                <SpecRow label="Peso" value={`${displayWeight} kg`} />
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
                   2. Especificações do Motor ({displayYear})
                </div>
                <div className="space-y-4 text-sm font-semibold mt-4">
                  <SpecRow label="Potência" value={`${displayHp} cv`} isWinner={displayHp >= bestHp} />
                  <SpecRow label="Torque" value={`${displayTorque} Nm`} isWinner={displayTorque >= bestTorque} />
                  <SpecRow label="Tipo Motor" value={`${car.engineType} ${car.displacement}L`} />
                  <SpecRow label="Aspiração" value={car.turbo ? 'Turbo' : 'Natural'} />
                </div>
              </div>

              <div className="bg-[var(--color-bento-yellow)] rounded-[40px] p-8 sm:p-10 relative shadow-sm text-dark">
                <div className="absolute -top-5 -left-3 bg-[var(--color-bento-red)] text-white font-black tracking-widest px-5 py-2 rounded-lg rotate-[-1deg] shadow-sm uppercase">
                   3. Segurança e Tech
                </div>
                <div className="space-y-4 text-sm font-semibold mt-4">
                  <SpecRow label="Airbags" value={`${car.airbagsCount}`} />
                  <SpecRow label="Latin NCAP" value={car.latinNcap > 0 ? `${car.latinNcap}/5` : 'N/A'} />
                  <SpecRow label="Multimídia" value={car.hasMultimedia ? 'Sim' : 'Não'} />
                  <SpecRow label="Smartphone" value={car.hasCarplay ? 'Apple/Android' : 'Não'} />
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

          {/* Calculadora FIPE Interativa com Seletores de Versão e Ano */}
          <div className="mt-12 mb-8" id="fipe">
            <FipeCalculator 
              initialBrandName={car.brand}
              initialModelName={car.model}
              initialYear={car.year}
              initialVersionName={car.version}
            />
          </div>

          {/* Histórico 6 Anos "Bonitinho" */}
          <FipeHistory history={priceHistory} />

          {/* Seção SEO Programático: Vale a Pena Comprar? */}
          <section className="bg-white rounded-[40px] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-12 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-dark tracking-tight mb-6">
              Vale a pena comprar o {car.brand} {car.model} em 2026?
            </h2>
            <div className="prose prose-lg text-text-secondary">
              <p>
                O <strong>{car.brand} {car.model} {car.year}</strong> consolida-se como uma opção de {car.segment} que atende bem ao mercado atual. 
                Com motorização {car.engineType} e desempenho focado na eficiência, ele faz cerca de {car.fuelEconomyCityGas} km/l na cidade, o que representa um custo competitivo.
              </p>
              <p>
                Levando em conta o desgaste natural e a projeção da Tabela FIPE (veja a nossa calculadora acima), a revenda
                tende a ser em linha com os concorrentes diretos. Se você busca {car.pros[0].toLowerCase()} com a segurança
                de ter {car.trunkCapacity}L de porta-malas, vale sim a pena incluí-lo no seu radar.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-6">
               <Link href="/carros-usados-bh" className="w-full sm:w-auto bg-[var(--color-bento-yellow)] text-dark font-black px-6 py-3 rounded-full border-2 border-dark flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] hover:-translate-y-1 transition-all">
                  Ver ofertas perto de mim <ArrowRight className="w-4 h-4" />
               </Link>
               <Link href="/comparar" className="w-full sm:w-auto bg-surface text-dark border-2 border-border font-bold px-6 py-3 rounded-full flex items-center justify-center hover:-translate-y-1 transition-all">
                  Comparar concorrentes
               </Link>
            </div>
          </section>

          {/* Otimização de FAQ Schema */}
          <section className="bg-surface rounded-3xl p-8 mt-12 mb-8 border border-border">
             <h3 className="text-xl font-black text-dark mb-6">Perguntas Frequentes (FAQ)</h3>
             <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-dark mb-1">Qual o consumo real do {car.model}?</h4>
                  <p className="text-sm text-text-secondary">Nos nossos dados técnicos, a média do {car.brand} {car.model} é de {car.fuelEconomyCityGas} km/litro em percurso urbano (gasolina).</p>
                </div>
                <div>
                  <h4 className="font-bold text-dark mb-1">Qual o tamanho do porta-malas do {car.model}?</h4>
                  <p className="text-sm text-text-secondary">A capacidade exata do compartimento de bagagem é de {car.trunkCapacity} litros, excelente para um {car.segment}.</p>
                </div>
                <div>
                  <h4 className="font-bold text-dark mb-1">Como saber o preço de mercado atualizado?</h4>
                  <p className="text-sm text-text-secondary">Utilize nossa Calculadora FIPE dinâmica nesta mesma página para ver o valor exato no mês vigente com base nos registros online oficiais.</p>
                </div>
             </div>
          </section>

          {/* Avaliações de Proprietários */}
          <ReviewSection carId={car.id} />

          {/* Vídeos do YouTube */}
          <VideoReviews brand={car.brand} model={car.model} year={displayYear} />
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

      {relatedListings.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-text mb-6">Veículos anunciados deste modelo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
