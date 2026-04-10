'use client'

import { Suspense, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cars, formatBRL, compareCars } from '@/data/cars'
import { Check, X, ArrowLeftRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import CarImage from '@/components/car/CarImage'

const segments = [...new Set(cars.map((c) => c.segment))]
const brands = [...new Set(cars.map((c) => c.brand))]

function ComparePageContent() {
  const searchParams = useSearchParams()
  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
  
  const [selected, setSelected] = useState<string[]>(initialIds)
  const [filterSegment, setFilterSegment] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

  // Sincroniza parâmetros iniciais se mudarem (opcional)
  useEffect(() => {
    if (initialIds.length > 0 && selected.length === 0) {
      setSelected(initialIds)
    }
  }, [searchParams])

  const filtered = useMemo(() => cars.filter((c) => {
    if (filterSegment && c.segment !== filterSegment) return false
    if (filterBrand && c.brand !== filterBrand) return false
    return true
  }), [filterSegment, filterBrand])

  const comparison = selected.length >= 2 ? compareCars(selected) : null

  function toggleCar(id: string) {
    if (selected.includes(id)) {
      setSelected((prev) => prev.filter((x) => x !== id))
    } else if (selected.length < 3) {
      setSelected((prev) => [...prev, id])
    }
  }

  const selectFields = [
    { key: 'priceBrl', label: 'Pre&ccedil;o', format: (c: typeof cars[0]) => formatBRL(c.priceBrl), num: (c: typeof cars[0]) => c.priceBrl, lower: true },
    { key: 'hp', label: 'Pot&ecirc;ncia', format: (c: typeof cars[0]) => `${c.horsepower} cv`, num: (c: typeof cars[0]) => c.horsepower, lower: false },
    { key: 'torque', label: 'Torque', format: (c: typeof cars[0]) => `${c.torque} Nm`, num: (c: typeof cars[0]) => c.torque, lower: false },
    { key: 'motor', label: 'Motor', format: (c: typeof cars[0]) => `${c.engineType} ${c.displacement}L${c.turbo ? ' Turbo' : ''}`, num: undefined, lower: false },
    { key: 'trans', label: 'C&acirc;mbio', format: (c: typeof cars[0]) => c.transmission, num: undefined, lower: false },
    { key: 'consumo', label: 'Consumo cidade', format: (c: typeof cars[0]) => `${c.fuelEconomyCityGas} km/l`, num: (c: typeof cars[0]) => c.fuelEconomyCityGas, lower: false },
    { key: 'acel', label: '0-100 km/h', format: (c: typeof cars[0]) => `${c.acceleration0100}s`, num: (c: typeof cars[0]) => c.acceleration0100, lower: true },
    { key: 'malas', label: 'Porta-malas', format: (c: typeof cars[0]) => `${c.trunkCapacity} L`, num: (c: typeof cars[0]) => c.trunkCapacity, lower: false },
    { key: 'airbags', label: 'Airbags', format: (c: typeof cars[0]) => String(c.airbagsCount), num: (c: typeof cars[0]) => c.airbagsCount, lower: false },
    { key: 'ncap', label: 'Latin NCAP', format: (c: typeof cars[0]) => c.latinNcap > 0 ? `${c.latinNcap}/5` : 'N/A', num: (c: typeof cars[0]) => c.latinNcap * 10, lower: false },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="mb-12 text-center flex flex-col items-center">
        <div className="bg-[#f0f4f8] text-[#0A0A0A] px-5 py-2 rounded-full font-bold text-[12px] tracking-widest uppercase mb-6 shadow-sm">Versus Mode</div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0A0A0A] tracking-[-0.04em] mb-4">Comparador de Carros</h1>
        <p className="text-[16px] text-[#0A0A0A]/60 max-w-md mx-auto leading-relaxed">Selecione até 3 veículos e descubra rapidamente quem leva a melhor em nosso raio-x técnico.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
          className="bg-white border border-[#0A0A0A]/5 rounded-[16px] px-5 py-3 text-[14px] font-semibold text-[#0A0A0A] shadow-sm hover:shadow-md focus:outline-none transition-all appearance-none min-w-[220px]">
          <option value="">Todas as Marcas</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)}
          className="bg-white border border-[#0A0A0A]/5 rounded-[16px] px-5 py-3 text-[14px] font-semibold text-[#0A0A0A] shadow-sm hover:shadow-md focus:outline-none transition-all appearance-none min-w-[220px]">
          <option value="">Todos os Segmentos</option>
          {segments.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Selected cars chips */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12 min-h-[44px]">
        {selected.length === 0 && (
          <span className="text-[13px] font-medium text-[#0A0A0A]/40 bg-[#f4f6f8] rounded-full px-6 py-2">Nenhum veículo selecionado para o combate</span>
        )}
        {selected.map((id) => {
          const car = cars.find((c) => c.id === id)
          return car ? (
            <span key={id} className="inline-flex items-center gap-2 bg-[#00D632] text-white text-[13px] font-bold px-4 py-2 rounded-xl shadow-sm tracking-wide">
              {car.brand} {car.model}
              <button onClick={() => toggleCar(id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </span>
          ) : null
        })}
      </div>

      {/* Car selector grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
        {filtered.map((car) => {
          const isSelected = selected.includes(car.id)
          const isDisabled = !isSelected && selected.length >= 3
          return (
            <button
              key={car.id}
              onClick={() => !isDisabled && toggleCar(car.id)}
              disabled={isDisabled}
              className={`text-left rounded-[24px] overflow-hidden transition-all relative flex flex-col ${
                isSelected
                  ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#00D632]'
                  : isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-[#f4f6f8]'
                  : 'bg-white border border-[#0A0A0A]/5 shadow-sm hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#00D632] rounded-full flex items-center justify-center z-10 shadow-sm">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
              <div className="aspect-[4/3] bg-[#f8fafc] overflow-hidden p-3 relative">
                <CarImage 
                  id={car.id} 
                  brand={car.brand} 
                  model={car.model} 
                  year={car.year} 
                  src={car.image} 
                  className="w-full h-full"
                />
              </div>
              <div className="p-4 bg-white flex-1">
                <p className="text-[10px] font-bold text-[#0A0A0A]/40 uppercase tracking-widest">{car.brand}</p>
                <p className="text-[14px] font-heading text-[#0A0A0A] leading-tight mt-1 tracking-wide">{car.model}</p>
                <p className="text-[12px] text-[#0A0A0A]/60 font-semibold mt-2 font-heading">{formatBRL(car.priceBrl)}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Comparison Table */}
      {comparison && comparison.cars.length >= 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-[#0A0A0A]/5 mb-10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-[#0A0A0A]/5 bg-[#fcfcfd]">
                    <th className="text-left p-6 text-[12px] font-semibold text-[#0A0A0A]/40 uppercase tracking-widest w-40">Ficha Técnica</th>
                    {comparison.cars.map((car) => (
                      <th key={car.id} className="p-6 text-center border-l border-[#0A0A0A]/5 bg-white">
                        <Link href={`/${car.brand.toLowerCase().replace(/\s+/g, '-')}/${car.slug}`} className="group block">
                          <div className="w-24 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                             <CarImage 
                               id={car.id} 
                               brand={car.brand} 
                               model={car.model} 
                               year={car.year} 
                               src={car.image} 
                               className="w-full h-full"
                             />
                          </div>
                          <p className="font-heading text-[15px] text-[#0A0A0A] tracking-wide leading-tight">{car.brand} {car.model}</p>
                          <p className="text-[13px] text-[#0A0A0A]/60 font-semibold mt-1 font-heading">{formatBRL(car.priceBrl)}</p>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectFields.map((field, ri) => {
                    let bestIdx: number | null = null
                    if (field.num) {
                      const vals = comparison.cars.map(field.num)
                      bestIdx = vals.indexOf(field.lower ? Math.min(...vals) : Math.max(...vals))
                    }
                    return (
                      <tr key={field.key} className={`${ri < selectFields.length - 1 ? 'border-b border-[#0A0A0A]/5' : ''} hover:bg-[#f8fafc] transition-colors`}>
                        <td className="p-5 text-[13px] font-medium text-[#0A0A0A]/50 uppercase tracking-widest">{field.label}</td>
                        {comparison.cars.map((car, ci) => {
                          const isWinner = bestIdx === ci
                          return (
                            <td key={car.id} className={`p-5 text-center text-[14px] ${isWinner ? 'font-bold text-[#00D632]' : 'font-medium text-[#0A0A0A]/70'} border-l border-[#0A0A0A]/5`}>
                              {isWinner ? (
                                <div className="inline-flex items-center gap-1.5 text-[#00D632]">
                                  {field.format(car)}
                                  <Check className="w-4 h-4" strokeWidth={3} />
                                </div>
                              ) : (
                                <span>{field.format(car)}</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verdict */}
          <div className="bg-[var(--color-bento-blue)] text-white rounded-[32px] p-8 md:p-10 shadow-lg relative overflow-hidden">
            <div className="absolute -top-4 -right-16 md:-right-8 opacity-20">
              <ArrowLeftRight className="w-64 h-64" />
            </div>
            
            <h3 className="font-bold text-2xl md:text-3xl text-white mb-8 tracking-[-0.02em] flex items-center gap-3 relative z-10">
              Resultado Final
            </h3>
            
            <div className="flex flex-col md:flex-row gap-5 relative z-10">
              {comparison.cars.map((car) => {
                const wins = Object.values(comparison.winners).filter((id) => id === car.id).length
                const total = Object.keys(comparison.winners).length
                const isOverallWinner = wins === Math.max(...comparison.cars.map(c => Object.values(comparison.winners).filter(id => id === c.id).length))

                if (wins === 0) return null
                
                return (
                  <div key={car.id} className={`flex-1 p-6 rounded-[24px] transition-transform ${isOverallWinner ? 'bg-white text-[#0A0A0A] shadow-xl md:-translate-y-2' : 'bg-white/10 text-white backdrop-blur-sm'}`}>
                    {isOverallWinner && (
                      <div className="inline-block bg-[#00D632] text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3 shadow-sm">
                        O Ganhador
                      </div>
                    )}
                    <p className="text-[18px] font-heading tracking-wide leading-none mb-1 mt-1">{car.brand} {car.model}</p>
                    <p className={`text-[13px] font-medium mb-5 ${isOverallWinner ? 'text-[#0A0A0A]/50' : 'text-white/60'}`}>Venceu {wins} de {total} análises técnicas</p>
                    <div className={`w-full rounded-full h-2 ${isOverallWinner ? 'bg-[#f4f6f8]' : 'bg-black/20'}`}>
                      <div className={`h-full rounded-full ${isOverallWinner ? 'bg-[#00D632]' : 'bg-white'}`} style={{ width: `${(wins / total) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16" />}>
      <ComparePageContent />
    </Suspense>
  )
}
