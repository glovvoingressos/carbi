'use client'

import { Suspense, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatBRL } from '@/data/cars'
import type { CarSpec } from '@/data/cars/types'
import { Check, X, ArrowLeftRight, Loader2, Search } from 'lucide-react'
import CarImage from '@/components/car/CarImage'

function compareCarsLocal(cars: CarSpec[], selectedIds: string[]) {
  const selectedCars = cars.filter((c) => selectedIds.includes(c.id))
  const winners: Record<string, string> = {}
  if (selectedCars.length === 0) {
    return { cars: [] as CarSpec[], winners }
  }

  const fields = [
    { key: 'priceBrl', lower: true },
    { key: 'horsepower', lower: false },
    { key: 'torque', lower: false },
    { key: 'fuelEconomyCityGas', lower: false },
    { key: 'acceleration0100', lower: true },
    { key: 'trunkCapacity', lower: false },
    { key: 'airbagsCount', lower: false },
    { key: 'latinNcap', lower: false },
  ] as const

  fields.forEach((field) => {
    let bestCar = selectedCars[0]
    for (const car of selectedCars) {
      const currentVal = Number(car[field.key] || 0)
      const bestVal = Number(bestCar[field.key] || 0)
      if (field.lower ? currentVal < bestVal : currentVal > bestVal) {
        bestCar = car
      }
    }
    winners[field.key] = bestCar.id
  })

  return { cars: selectedCars, winners }
}

function ComparePageContent() {
  const searchParams = useSearchParams()
  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

  const [cars, setCars] = useState<CarSpec[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [queries, setQueries] = useState(['', ''])
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>([
    initialIds[0] ?? null,
    initialIds[1] ?? null,
  ])
  const [openPicker, setOpenPicker] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadCars = async () => {
      setLoadingCatalog(true)
      setCatalogError(null)
      try {
        const response = await fetch('/api/cars')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Falha ao carregar catálogo.')
        }
        if (!cancelled) {
          setCars(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : 'Falha ao carregar catálogo.')
          setCars([])
        }
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false)
        }
      }
    }

    void loadCars()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (initialIds.length > 0 && selectedIds.every((id) => !id)) {
      setSelectedIds([initialIds[0] ?? null, initialIds[1] ?? null])
    }
  }, [initialIds, selectedIds])

  const selectedCars = useMemo(() => {
    return selectedIds.map((id) => cars.find((c) => c.id === id) ?? null)
  }, [cars, selectedIds])

  const canCompare = Boolean(selectedIds[0] && selectedIds[1])
  const comparison = canCompare ? compareCarsLocal(cars, selectedIds.filter(Boolean) as string[]) : null

  function handleSelect(slotIndex: number, carId: string) {
    setSelectedIds((prev) => {
      const next = [...prev]
      next[slotIndex] = carId
      return next
    })
    setQueries((prev) => {
      const next = [...prev]
      next[slotIndex] = ''
      return next
    })
    setOpenPicker(null)
  }

  function clearSlot(slotIndex: number) {
    setSelectedIds((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  function optionsForSlot(slotIndex: number) {
    const query = queries[slotIndex].trim().toLowerCase()
    const blockedId = selectedIds[slotIndex === 0 ? 1 : 0]

    const filtered = cars.filter((car) => {
      if (blockedId && car.id === blockedId) return false
      if (!query) return false
      return (
        car.model.toLowerCase().includes(query) ||
        car.brand.toLowerCase().includes(query) ||
        `${car.brand} ${car.model}`.toLowerCase().includes(query)
      )
    })

    return filtered.slice(0, 8)
  }

  const selectFields = [
    { key: 'priceBrl', label: 'Preço', format: (c: CarSpec) => formatBRL(c.priceBrl), num: (c: CarSpec) => c.priceBrl, lower: true },
    { key: 'hp', label: 'Potência', format: (c: CarSpec) => `${c.horsepower} cv`, num: (c: CarSpec) => c.horsepower, lower: false },
    { key: 'torque', label: 'Torque', format: (c: CarSpec) => `${c.torque} Nm`, num: (c: CarSpec) => c.torque, lower: false },
    { key: 'motor', label: 'Motor', format: (c: CarSpec) => `${c.engineType} ${c.displacement}L${c.turbo ? ' Turbo' : ''}`, num: undefined, lower: false },
    { key: 'trans', label: 'Câmbio', format: (c: CarSpec) => c.transmission, num: undefined, lower: false },
    { key: 'consumo', label: 'Consumo cidade', format: (c: CarSpec) => `${c.fuelEconomyCityGas} km/l`, num: (c: CarSpec) => c.fuelEconomyCityGas, lower: false },
    { key: 'acel', label: '0-100 km/h', format: (c: CarSpec) => `${c.acceleration0100}s`, num: (c: CarSpec) => c.acceleration0100, lower: true },
    { key: 'malas', label: 'Porta-malas', format: (c: CarSpec) => `${c.trunkCapacity} L`, num: (c: CarSpec) => c.trunkCapacity, lower: false },
    { key: 'airbags', label: 'Airbags', format: (c: CarSpec) => String(c.airbagsCount), num: (c: CarSpec) => c.airbagsCount, lower: false },
    { key: 'ncap', label: 'Latin NCAP', format: (c: CarSpec) => c.latinNcap > 0 ? `${c.latinNcap}/5` : 'N/A', num: (c: CarSpec) => c.latinNcap * 10, lower: false },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="mb-12 text-center flex flex-col items-center">
        <div className="bg-[#f0f4f8] text-[#0A0A0A] px-5 py-2 rounded-full font-bold text-[12px] tracking-widest uppercase mb-6">Versus Mode</div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0A0A0A] tracking-[-0.04em] mb-4">Comparador de Carros</h1>
        <p className="text-[16px] text-[#0A0A0A]/60 max-w-2xl mx-auto leading-relaxed">
          Pesquise e selecione os 2 carros para comparar. A análise só é liberada quando ambos estiverem escolhidos corretamente.
        </p>
      </div>

      {loadingCatalog && (
        <div className="mb-8 flex items-center justify-center gap-2 rounded-2xl bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando catálogo...
        </div>
      )}
      {catalogError && (
        <div className="mb-8 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {catalogError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {[0, 1].map((slotIndex) => {
          const selectedCar = selectedCars[slotIndex]
          const options = optionsForSlot(slotIndex)
          const isOpen = openPicker === slotIndex
          const colorClass = slotIndex === 0 ? 'pastel-card-blue' : 'pastel-card-green'

          return (
            <div key={slotIndex} className={`pastel-card ${colorClass} rounded-[28px] p-5 md:p-6 relative`}>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#0A0A0A]/45 mb-2">
                Carro {slotIndex + 1}
              </p>

              {selectedCar ? (
                <div className="bg-white/60 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-white/80 shrink-0">
                      <CarImage
                        id={selectedCar.id}
                        brand={selectedCar.brand}
                        model={selectedCar.model}
                        year={selectedCar.year}
                        src={selectedCar.image}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0A0A0A] truncate">{selectedCar.brand} {selectedCar.model}</p>
                      <p className="text-xs text-[#0A0A0A]/60">{selectedCar.year} • {formatBRL(selectedCar.priceBrl)}</p>
                    </div>
                    <button
                      onClick={() => clearSlot(slotIndex)}
                      className="ml-auto w-8 h-8 rounded-full bg-white text-[#0A0A0A]/70 hover:text-[#0A0A0A] flex items-center justify-center"
                      aria-label="Remover carro selecionado"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40" />
                    <input
                      value={queries[slotIndex]}
                      onFocus={() => setOpenPicker(slotIndex)}
                      onChange={(e) => {
                        const value = e.target.value
                        setQueries((prev) => {
                          const next = [...prev]
                          next[slotIndex] = value
                          return next
                        })
                        setOpenPicker(slotIndex)
                      }}
                      placeholder="Busque por marca ou modelo"
                      className="w-full bg-white/75 rounded-2xl h-12 pl-10 pr-4 text-sm font-medium text-[#0A0A0A] placeholder:text-[#0A0A0A]/40 outline-none"
                    />
                  </div>

                  {isOpen && (
                    <div className="mt-3 bg-white/85 rounded-2xl max-h-72 overflow-y-auto p-2">
                      {queries[slotIndex].trim().length < 2 && (
                        <p className="text-sm text-[#0A0A0A]/60 px-3 py-2">Digite ao menos 2 letras para buscar.</p>
                      )}
                      {queries[slotIndex].trim().length >= 2 && options.length === 0 && (
                        <p className="text-sm text-[#0A0A0A]/60 px-3 py-2">Nenhum modelo encontrado.</p>
                      )}
                      {options.map((car) => (
                        <button
                          key={car.id}
                          onClick={() => handleSelect(slotIndex, car.id)}
                          className="w-full text-left rounded-xl px-3 py-2 hover:bg-[#f4f6f8] transition-colors"
                        >
                          <p className="text-sm font-semibold text-[#0A0A0A]">{car.brand} {car.model}</p>
                          <p className="text-xs text-[#0A0A0A]/60">{car.year} • {formatBRL(car.priceBrl)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mb-14 text-center">
        <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${canCompare ? 'bg-[#dbffd8] text-[#14631f]' : 'bg-[#f1f3f5] text-[#6b7280]'}`}>
          {canCompare ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
          {canCompare ? 'Comparação liberada' : 'Selecione os 2 carros para liberar a comparação'}
        </div>
      </div>

      {/* Comparison Table */}
      {comparison && comparison.cars.length >= 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="pastel-card pastel-card-blue rounded-[32px] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.06)] mb-10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-[#0A0A0A]/5 bg-[#fcfcfd]">
                    <th className="text-left p-6 text-[12px] font-semibold text-[#0A0A0A]/40 uppercase tracking-widest w-40">Ficha Técnica</th>
                    {comparison.cars.map((car) => (
                    <th key={car.id} className="p-6 text-center border-l border-[#0A0A0A]/5 bg-[#f7f9fc]">
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
