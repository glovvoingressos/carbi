'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cars, formatBRL, compareCars } from '@/data/cars'
import { Check, X, ArrowLeftRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'

const segments = [...new Set(cars.map((c) => c.segment))]
const brands = [...new Set(cars.map((c) => c.brand))]

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([])
  const [filterSegment, setFilterSegment] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-text">Comparador de carros</h1>
      <p className="text-sm text-text-secondary mt-1">Selecione 2 a 3 carros para comparar lado a lado.</p>

      {/* Filters */}
      <div className="flex gap-2 mt-4 mb-6">
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="">Todas as marcas</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="">Todos os segmentos</option>
          {segments.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Selected cars chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selected.map((id) => {
            const car = cars.find((c) => c.id === id)
            return car ? (
              <span key={id} className="inline-flex items-center gap-2 bg-primary-light text-text text-sm font-medium px-3 py-1.5 rounded-lg">
                {car.brand} {car.model}
                <button onClick={() => toggleCar(id)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors">
                  <X className="w-3 h-3 text-primary" />
                </button>
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Car selector grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-8">
        {filtered.map((car) => {
          const isSelected = selected.includes(car.id)
          const isDisabled = !isSelected && selected.length >= 3
          return (
            <button
              key={car.id}
              onClick={() => !isDisabled && toggleCar(car.id)}
              disabled={isDisabled}
              className={`text-left border rounded-xl overflow-hidden transition-all ${
                isSelected
                  ? 'border-primary bg-primary-light ring-1 ring-primary/20'
                  : isDisabled
                  ? 'opacity-30 cursor-not-allowed border-border'
                  : 'bg-white border-border hover:border-primary/30'
              }`}
            >
              <div className="aspect-[4/3] bg-surface overflow-hidden">
                <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" width={200} height={150} />
              </div>
              <div className="p-2">
                <p className="text-[10px] font-medium text-text-tertiary uppercase">{car.brand}</p>
                <p className="text-xs font-bold text-text truncate">{car.model}</p>
                <p className="text-xs text-primary font-semibold mt-0.5">{formatBRL(car.priceBrl)}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Comparison Table */}
      {comparison && comparison.cars.length >= 2 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-border min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-surface text-xs font-medium text-text-tertiary uppercase tracking-wider w-36 rounded-tl-xl">Especifica&ccedil;&atilde;o</th>
                  {comparison.cars.map((car, i) => (
                    <th key={car.id} className={`p-3 text-center ${i === comparison.cars.length - 1 ? 'rounded-tr-xl' : ''}`}>
                      <Link href={`/${car.brand.toLowerCase().replace(/\s+/g, '-')}/${car.slug}`} className="hover:text-primary transition-colors">
                        <p className="font-semibold text-sm text-text">{car.brand} {car.model}</p>
                        <p className="text-xs text-primary font-semibold">{formatBRL(car.priceBrl)}</p>
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
                    <tr key={field.key} className={`${ri < selectFields.length - 1 ? 'border-b border-border' : ''} hover:bg-surface/50`}>
                      <td className="p-3 text-sm font-medium text-text-secondary bg-surface/40">{field.label}</td>
                      {comparison.cars.map((car, ci) => {
                        const isWinner = bestIdx === ci
                        return (
                          <td key={car.id} className={`p-3 text-center text-sm ${isWinner ? 'text-success font-semibold' : 'text-text'}`}>
                            {field.format(car)}
                            {isWinner && <Check className="w-3.5 h-3.5 inline ml-0.5" />}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Verdict */}
          <div className="bg-white border border-border rounded-xl p-6 mt-6">
            <h3 className="font-semibold text-text mb-3">Veredito</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {comparison.cars.map((car) => {
                const wins = Object.values(comparison.winners).filter((id) => id === car.id).length
                if (wins === 0) return null
                const total = Object.keys(comparison.winners).length
                return (
                  <div key={car.id} className="flex-1 p-4 rounded-lg bg-surface border border-border">
                    <p className="text-sm font-semibold text-text">{car.brand} {car.model}</p>
                    <p className="text-xs text-text-secondary mt-1">{wins} de {total} crit&eacute;rios vencido{wins > 1 ? 's' : ''}</p>
                    <div className="w-full bg-border rounded-full h-1.5 mt-2">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(wins / total) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
