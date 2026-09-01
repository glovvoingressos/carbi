'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'
import Link from 'next/link'
import {
  ArrowRight,
  Gauge,
  Fuel,
  Shield,
  Zap,
  ArrowLeftRight,
  Sparkles,
  Crown,
  TrendingUp,
  ChevronDown,
  Search as SearchIcon,
} from 'lucide-react'

type View = 'specs' | 'cost'

interface CarComparison {
  brand: string
  model: string
  version: string
  segment: string
  priceBrl: number
  horsepower: number
  fuelEconomyCityGas: number
  airbagsCount: number
  slug: string
  image: string
  idealFor: string
}

interface ModelComparisonProps {
  cars: CarComparison[]
  allCars: CarComparison[]
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatMil(value: number) {
  if (value >= 1000) return `R$ ${Math.round(value / 1000)} mil`
  return `R$ ${value}`
}

const SPECS = [
  { key: 'horsepower', label: 'Potência', icon: Gauge, suffix: ' cv', max: 200 },
  { key: 'fuelEconomyCityGas', label: 'Consumo cidade', icon: Fuel, suffix: ' km/l', max: 20 },
  { key: 'airbagsCount', label: 'Airbags', icon: Shield, suffix: 'x', max: 10 },
] as const

export default function ModelComparison({ cars, allCars }: ModelComparisonProps) {
  const [view, setView] = useState<View>('specs')
  const [leftCar, setLeftCar] = useState<CarComparison>(cars[0])
  const [rightCar, setRightCar] = useState<CarComparison>(cars[1])
  const [openDropdown, setOpenDropdown] = useState<'left' | 'right' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!openDropdown) setSearchTerm('')
  }, [openDropdown])

  if (!cars || cars.length < 2) return null

  const carA = leftCar
  const carB = rightCar

  const carOptions = allCars || cars
  const availableFor = (side: 'left' | 'right') => {
    const other = side === 'left' ? rightCar : leftCar
    const otherKey = `${other.slug}__${other.version}`
    const seen = new Set<string>()
    return carOptions.filter((c) => {
      const key = `${c.slug}__${c.version}`
      if (seen.has(key)) return false
      if (key === otherKey) return false
      seen.add(key)
      return true
    })
  }

  const handleSwap = () => {
    setLeftCar(rightCar)
    setRightCar(leftCar)
  }

  const filteredOptions = (side: 'left' | 'right') => {
    const list = availableFor(side)
    if (!searchTerm.trim()) return list
    const q = searchTerm.toLowerCase()
    return list.filter((c) =>
      `${c.brand} ${c.model} ${c.segment}`.toLowerCase().includes(q),
    )
  }

  const handlePick = (side: 'left' | 'right', car: CarComparison) => {
    if (side === 'left') setLeftCar(car)
    else setRightCar(car)
    setOpenDropdown(null)
  }

  const winnerBy = (key: keyof CarComparison): 'a' | 'b' | 'tie' => {
    const a = carA[key] as number
    const b = carB[key] as number
    if (a === b) return 'tie'
    if (key === 'priceBrl') return a < b ? 'a' : 'b'
    return a > b ? 'a' : 'b'
  }

  const savingsPerYear = (litersPerYear: number, fuelPrice = 6.5) =>
    litersPerYear * fuelPrice

  const avgKmYear = 12000
  const aFuelCost = (avgKmYear / carA.fuelEconomyCityGas)
  const bFuelCost = (avgKmYear / carB.fuelEconomyCityGas)

  return (
    <div className="cmp-card" ref={sectionRef}>
      <motion.div
        className="cmp-header"
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.span
          className="cmp-label"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Sparkles size={12} /> COMPARATIVO
        </motion.span>
        <h2 className="cmp-title">
          Qual carro <span className="cmp-title-accent">combina com você</span>?
        </h2>
        <p className="cmp-lead">
          Compare lado a lado os carros mais procurados e decida com dados reais.
        </p>
      </motion.div>

      <motion.div
        className="cmp-toggle"
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        role="tablist"
        aria-label="Visão do comparativo"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'specs'}
          className={`cmp-toggle-opt ${view === 'specs' ? 'is-active' : ''}`}
          onClick={() => setView('specs')}
        >
          Specs técnicas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'cost'}
          className={`cmp-toggle-opt ${view === 'cost' ? 'is-active' : ''}`}
          onClick={() => setView('cost')}
        >
          Custo-benefício
        </button>
        <motion.span
          className="cmp-toggle-thumb"
          layout
          aria-hidden="true"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          style={{ left: view === 'specs' ? '4px' : '50%' }}
        />
      </motion.div>

      <div className="cmp-grid">
        {[{ car: carA, side: 'left' as const }, { car: carB, side: 'right' as const }].map(({ car, side }, i) => {
          const otherCar = side === 'left' ? carB : carA
          const isLeader =
            (view === 'specs'
              ? carA.horsepower + carA.fuelEconomyCityGas + carA.airbagsCount
              : carA.priceBrl * 0.4 + aFuelCost * -1) >
            (view === 'specs'
              ? carB.horsepower + carB.fuelEconomyCityGas + carB.airbagsCount
              : carB.priceBrl * 0.4 + bFuelCost * -1)
          const highlight = i === 0 ? isLeader : !isLeader

          return (
            <motion.div
              key={`${car.slug}-${side}`}
              className={`cmp-col ${highlight ? 'is-highlight' : ''}`}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{
                duration: 0.55,
                delay: 0.2 + i * 0.12,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileHover={{ y: -6 }}
              layout
            >
              {highlight && (
                <motion.div
                  className="cmp-col-glow"
                  aria-hidden="true"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div className="cmp-col-top">
                <span className={`cmp-badge ${highlight ? 'is-highlight' : ''}`}>
                  {highlight ? <><Crown size={11} /> Melhor escolha</> : car.segment}
                </span>

                <div className="cmp-picker">
                  <button
                    type="button"
                    className="cmp-picker-btn"
                    onClick={() => setOpenDropdown(openDropdown === side ? null : side)}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === side}
                    aria-label={`Trocar carro ${car.brand} ${car.model}`}
                  >
                    <h3 className="cmp-name">
                      <span className="cmp-name-brand">{car.brand}</span>
                      <span className="cmp-name-model">{car.model}</span>
                    </h3>
                    <motion.span
                      className="cmp-picker-icon"
                      animate={{ rotate: openDropdown === side ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      aria-hidden="true"
                    >
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {openDropdown === side && (
                      <motion.div
                        className="cmp-picker-dropdown"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        role="listbox"
                      >
                        <div className="cmp-picker-search">
                          <SearchIcon size={13} />
                          <input
                            type="text"
                            placeholder={`Buscar carro para o ${side === 'left' ? 'lado A' : 'lado B'}…`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="cmp-picker-scroll">
                          {filteredOptions(side).map((opt, oi) => (
                            <button
                              key={`${opt.slug}-${opt.version}-${oi}`}
                              type="button"
                              role="option"
                              aria-selected={opt.slug === car.slug && opt.version === car.version}
                              className={`cmp-picker-item ${opt.slug === car.slug && opt.version === car.version ? 'is-active' : ''}`}
                              onClick={() => handlePick(side, opt)}
                            >
                              <span className="cmp-picker-item-brand">{opt.brand}</span>
                              <span className="cmp-picker-item-model">{opt.model}</span>
                              <span className="cmp-picker-item-price">{formatBRL(opt.priceBrl)}</span>
                            </button>
                          ))}
                          {filteredOptions(side).length === 0 && (
                            <div className="cmp-picker-empty">Nenhum modelo encontrado.</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="cmp-version">{car.version}</p>
              </div>

              <div className="cmp-price-block">
                <span className="cmp-price-currency">R$</span>
                <motion.span
                  key={`price-${car.slug}`}
                  className="cmp-price-value"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {Math.round(car.priceBrl / 1000)}
                </motion.span>
                <span className="cmp-price-suffix">mil</span>
              </div>
              <p className="cmp-price-meta">preço sugerido Carbi</p>

              <AnimatePresence mode="wait" initial={false}>
                {view === 'specs' ? (
                  <motion.div
                    key="specs"
                    className="cmp-features"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {SPECS.map((spec, si) => {
                      const Icon = spec.icon
                      const value = car[spec.key as keyof CarComparison] as number
                      const pct = Math.min((value / spec.max) * 100, 100)
                      const otherPct = Math.min((otherCar[spec.key as keyof CarComparison] as number / spec.max) * 100, 100)
                      const isWinner = pct > otherPct
                      return (
                        <motion.div
                          key={spec.key}
                          className="cmp-spec"
                          initial={{ opacity: 0, x: -6 }}
                          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                          transition={{ duration: 0.35, delay: 0.45 + i * 0.08 + si * 0.05 }}
                        >
                          <div className="cmp-spec-top">
                            <div className="cmp-spec-label-wrap">
                              <Icon size={13} className="cmp-spec-icon" />
                              <span className="cmp-spec-label">{spec.label}</span>
                            </div>
                            <span className={`cmp-spec-value ${isWinner ? 'is-winner' : ''}`}>
                                  {value}{spec.suffix}
                                </span>
                          </div>
                          <div className="cmp-progress-track">
                            <motion.div
                              className="cmp-progress-fill"
                              initial={{ width: 0 }}
                              animate={inView ? { width: `${pct}%` } : { width: 0 }}
                              transition={{ duration: 0.8, delay: 0.5 + i * 0.08 + si * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="cost"
                    className="cmp-features"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CostRow
                      icon={<Zap size={13} />}
                      label="Consumo médio"
                      current={car.fuelEconomyCityGas}
                      other={otherCar.fuelEconomyCityGas}
                      suffix=" km/l"
                      invert
                    />
                    <CostRow
                      icon={<TrendingUp size={13} />}
                      label="Gasto anual com combustível"
                      current={i === 0 ? aFuelCost : bFuelCost}
                      other={i === 0 ? bFuelCost : aFuelCost}
                      formatter={(v) => formatBRL(savingsPerYear(v))}
                      invert
                    />
                    <CostRow
                      icon={<Gauge size={13} />}
                      label="Potência por R$ mil"
                      current={(car.horsepower / car.priceBrl) * 1000}
                      other={(otherCar.horsepower / otherCar.priceBrl) * 1000}
                      formatter={(v) => `${v.toFixed(2)} cv/mil`}
                    />
                    <CostRow
                      icon={<Shield size={13} />}
                      label="Airbags"
                      current={car.airbagsCount}
                      other={otherCar.airbagsCount}
                      suffix="x"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="cmp-ideal">
                <Zap size={12} />
                <span>Ideal para: {car.idealFor}</span>
              </div>

              <Link href={`/carros/${car.slug}`} className={`cmp-cta ${highlight ? 'is-highlight' : ''}`}>
                <span>Ver {car.model}</span>
                <motion.span
                  className="cmp-cta-arrow"
                  aria-hidden="true"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                >
                  <ArrowRight size={16} />
                </motion.span>
              </Link>
            </motion.div>
          )
        })}

        <button
          type="button"
          className="cmp-swap-btn"
          onClick={handleSwap}
          aria-label="Inverter carros comparados"
          title="Inverter A ↔ B"
        >
          <ArrowLeftRight size={16} />
        </button>
      </div>

      <motion.div
        className="cmp-hint"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Sparkles size={13} />
        <span>Clique no nome do carro para trocar</span>
      </motion.div>
    </div>
  )
}

function CostRow({
  icon,
  label,
  current,
  other,
  suffix,
  formatter,
  invert,
}: {
  icon: React.ReactNode
  label: string
  current: number
  other: number
  suffix?: string
  formatter?: (v: number) => string
  invert?: boolean
}) {
  const isWinner = invert ? current > other : current > other
  const formatted = formatter ? formatter(current) : `${current}${suffix || ''}`
  return (
    <div className="cmp-spec">
      <div className="cmp-spec-top">
        <div className="cmp-spec-label-wrap">
          {icon}
          <span className="cmp-spec-label">{label}</span>
        </div>
        <span className={`cmp-spec-value ${isWinner ? 'is-winner' : ''}`}>{formatted}</span>
      </div>
      <div className="cmp-progress-track">
        <div
          className="cmp-progress-fill"
          style={{ width: isWinner ? '100%' : '62%', background: isWinner ? 'var(--cb-lime)' : 'var(--cb-line)' }}
        />
      </div>
    </div>
  )
}