'use client'

import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react'
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
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function safeNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

const SPECS = [
  { key: 'horsepower', label: 'Potência', icon: Gauge, suffix: ' cv', max: 200 },
  { key: 'fuelEconomyCityGas', label: 'Consumo cidade', icon: Fuel, suffix: ' km/l', max: 20 },
  { key: 'airbagsCount', label: 'Airbags', icon: Shield, suffix: 'x', max: 10 },
] as const

export default function ModelComparison({ cars, allCars }: ModelComparisonProps) {
  const availableCars = Array.isArray(cars) ? cars.filter(Boolean) : []
  const [view, setView] = useState<View>('specs')
  const [leftCar, setLeftCar] = useState<CarComparison | null>(() => availableCars[0] ?? null)
  const [rightCar, setRightCar] = useState<CarComparison | null>(() => availableCars[1] ?? null)
  const [openDropdown, setOpenDropdown] = useState<'left' | 'right' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeOptionIndex, setActiveOptionIndex] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<View, HTMLButtonElement | null>>({ specs: null, cost: null })
  const optionRefs = useRef<HTMLButtonElement[]>([])
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!openDropdown) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!sectionRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null)
        setSearchTerm('')
        setActiveOptionIndex(0)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openDropdown])

  const carOptions = Array.isArray(allCars) && allCars.length > 0 ? allCars : availableCars
  const hasCar = (candidate: CarComparison | null) => Boolean(
    candidate && carOptions.some((car) => car.slug === candidate.slug && car.version === candidate.version),
  )
  const carA = hasCar(leftCar) ? leftCar : availableCars[0] ?? null
  const carB = hasCar(rightCar) && (rightCar?.slug !== carA?.slug || rightCar?.version !== carA?.version)
    ? rightCar
    : carOptions.find((car) => car.slug !== carA?.slug || car.version !== carA?.version) ?? null

  if (!carA || !carB) {
    return (
      <div className="cmp-card cmp-card-empty" ref={sectionRef} role="status" aria-live="polite">
        <div className="cmp-empty-icon" aria-hidden="true"><ArrowLeftRight size={20} /></div>
        <div>
          <h2 className="cmp-empty-title">Comparativo indisponível</h2>
          <p className="cmp-empty-copy">Escolha pelo menos dois modelos para comparar especificações e custo-benefício.</p>
        </div>
      </div>
    )
  }

  const availableFor = (side: 'left' | 'right') => {
    const other = side === 'left' ? carB : carA
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
    setLeftCar(carB)
    setRightCar(carA)
  }

  const openPicker = (side: 'left' | 'right') => {
    setSearchTerm('')
    setActiveOptionIndex(0)
    setOpenDropdown(side)
  }

  const closePicker = () => {
    setOpenDropdown(null)
    setSearchTerm('')
    setActiveOptionIndex(0)
  }

  const handleViewKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const viewOrder: View[] = ['specs', 'cost']
    const currentIndex = viewOrder.indexOf(view)
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % viewOrder.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + viewOrder.length) % viewOrder.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = viewOrder.length - 1

    if (nextIndex === currentIndex) return
    event.preventDefault()
    const nextView = viewOrder[nextIndex]
    setView(nextView)
    tabRefs.current[nextView]?.focus()
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
    closePicker()
  }

  const handlePickerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, side: 'left' | 'right') => {
    if (!['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    openPicker(side)
  }

  const focusPicker = (side: 'left' | 'right') => {
    document.getElementById(`cmp-picker-trigger-${side}`)?.focus()
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const options = filteredOptions(side)

    if (event.key === 'Escape') {
      event.preventDefault()
      closePicker()
      focusPicker(side)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (options.length === 0) return
      event.preventDefault()
      const nextIndex = event.key === 'ArrowDown'
        ? Math.min(activeOptionIndex + 1, options.length - 1)
        : Math.max(activeOptionIndex - 1, 0)
      setActiveOptionIndex(nextIndex)
      optionRefs.current[nextIndex]?.focus()
      return
    }

    if (event.key === 'Enter' && options[activeOptionIndex]) {
      event.preventDefault()
      handlePick(side, options[activeOptionIndex])
    }
  }

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    side: 'left' | 'right',
    index: number,
    optionsLength: number,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePicker()
      focusPicker(side)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const nextIndex = event.key === 'ArrowDown'
        ? Math.min(index + 1, optionsLength - 1)
        : event.key === 'ArrowUp'
          ? Math.max(index - 1, 0)
          : event.key === 'Home'
            ? 0
            : optionsLength - 1
      setActiveOptionIndex(nextIndex)
      optionRefs.current[nextIndex]?.focus()
    }
  }

  const savingsPerYear = (litersPerYear: number, fuelPrice = 6.5) =>
    safeNumber(litersPerYear) * safeNumber(fuelPrice)

  const avgKmYear = 12000
  const aFuelCost = avgKmYear / Math.max(safeNumber(carA.fuelEconomyCityGas), 0.1)
  const bFuelCost = avgKmYear / Math.max(safeNumber(carB.fuelEconomyCityGas), 0.1)

  const comparisonScore = (car: CarComparison) => {
    const horsepower = safeNumber(car.horsepower)
    const fuelEconomy = safeNumber(car.fuelEconomyCityGas)
    const airbags = safeNumber(car.airbagsCount)

    if (view === 'specs') {
      return (horsepower / 200) + (fuelEconomy / 20) + (airbags / 10)
    }

    const maxPrice = Math.max(safeNumber(carA.priceBrl), safeNumber(carB.priceBrl), 1)
    const priceValue = 1 - Math.min(Math.max(safeNumber(car.priceBrl), 0) / maxPrice, 1)
    const economyValue = Math.min(Math.max(fuelEconomy, 0) / 20, 1)
    return priceValue * 0.45 + economyValue * 0.55
  }

  const scoreDifference = comparisonScore(carA) - comparisonScore(carB)
  const winningSide: 'left' | 'right' | null = Math.abs(scoreDifference) < 0.001
    ? null
    : scoreDifference > 0 ? 'left' : 'right'

  return (
    <div className="cmp-card" ref={sectionRef}>
      <motion.div
        className="cmp-header"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
      >
        <h2 className="cmp-title">
          Qual carro <span className="cmp-title-accent">combina com você</span>?
        </h2>
        <p className="cmp-lead">
          Compare lado a lado os carros mais procurados e decida com dados reais.
        </p>
      </motion.div>

      <motion.div
        className="cmp-toggle"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
        role="tablist"
        aria-label="Visão do comparativo"
      >
        <button
          type="button"
          role="tab"
          id="cmp-tab-specs"
          aria-controls="cmp-panel-specs"
          aria-selected={view === 'specs'}
          tabIndex={view === 'specs' ? 0 : -1}
          ref={(element) => { tabRefs.current.specs = element }}
          className={`cmp-toggle-opt ${view === 'specs' ? 'is-active' : ''}`}
          onClick={() => setView('specs')}
          onKeyDown={handleViewKeyDown}
        >
          Specs técnicas
        </button>
        <button
          type="button"
          role="tab"
          id="cmp-tab-cost"
          aria-controls="cmp-panel-cost"
          aria-selected={view === 'cost'}
          tabIndex={view === 'cost' ? 0 : -1}
          ref={(element) => { tabRefs.current.cost = element }}
          className={`cmp-toggle-opt ${view === 'cost' ? 'is-active' : ''}`}
          onClick={() => setView('cost')}
          onKeyDown={handleViewKeyDown}
        >
          Custo-benefício
        </button>
        <motion.span
          className="cmp-toggle-thumb"
          layout
          aria-hidden="true"
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
          style={{ left: view === 'specs' ? '4px' : '50%' }}
        />
      </motion.div>

      <div className="cmp-grid">
        {[{ car: carA, side: 'left' as const }, { car: carB, side: 'right' as const }].map(({ car, side }, i) => {
          const otherCar = side === 'left' ? carB : carA
          const options = filteredOptions(side)
          const highlight = winningSide === side
          const tie = winningSide === null

          return (
            <motion.div
              key={`${car.slug}-${side}`}
              className={`cmp-col ${highlight ? 'is-highlight' : ''}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.55, delay: 0.2 + i * 0.12, ease: [0.22, 0.61, 0.36, 1] }}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              layout={!shouldReduceMotion}
              aria-label={`${car.brand} ${car.model}${highlight ? ', melhor escolha nesta visão' : tie ? ', empate nesta visão' : ''}`}
            >
              {highlight && (
                <motion.div
                  className="cmp-col-glow"
                  aria-hidden="true"
                  animate={{ opacity: shouldReduceMotion ? 0.34 : [0.4, 0.8, 0.4] }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div className="cmp-col-top">
                <span className={`cmp-badge ${highlight ? 'is-highlight' : ''} ${tie ? 'is-tie' : ''}`}>
                  {highlight ? <><Crown size={11} /> Melhor escolha</> : tie ? <><ArrowLeftRight size={11} /> Empate técnico</> : car.segment}
                </span>

                <div className="cmp-picker">
                  <button
                    type="button"
                    id={`cmp-picker-trigger-${side}`}
                    className="cmp-picker-btn"
                    onClick={() => openDropdown === side ? closePicker() : openPicker(side)}
                    onKeyDown={(event) => handlePickerKeyDown(event, side)}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === side}
                    aria-controls={openDropdown === side ? `cmp-picker-list-${side}` : undefined}
                    aria-label={`Trocar carro ${car.brand} ${car.model}`}
                  >
                    <span className="cmp-name">
                      <span className="cmp-name-brand">{car.brand}</span>
                      <span className="cmp-name-model">{car.model}</span>
                    </span>
                    <motion.span
                      className="cmp-picker-icon"
                      animate={{ rotate: openDropdown === side ? 180 : 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                      aria-hidden="true"
                    >
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {openDropdown === side && (
                      <motion.div
                        className="cmp-picker-dropdown"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
                      >
                        <div className="cmp-picker-search">
                          <SearchIcon size={13} />
                          <input
                            type="text"
                            role="searchbox"
                            placeholder={`Buscar carro para o ${side === 'left' ? 'lado A' : 'lado B'}…`}
                            aria-label={`Buscar carro para o ${side === 'left' ? 'lado A' : 'lado B'}`}
                            aria-controls={`cmp-picker-list-${side}`}
                            aria-autocomplete="list"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value)
                              setActiveOptionIndex(0)
                            }}
                            onKeyDown={(event) => handleSearchKeyDown(event, side)}
                            autoFocus
                          />
                        </div>
                        <div
                          className="cmp-picker-scroll"
                          id={`cmp-picker-list-${side}`}
                          role={options.length > 0 ? 'listbox' : 'status'}
                          aria-label={`Modelos disponíveis para o lado ${side === 'left' ? 'A' : 'B'}`}
                        >
                          {options.map((opt, oi) => (
                            <button
                              key={`${opt.slug}-${opt.version}-${oi}`}
                              type="button"
                              id={`cmp-picker-option-${side}-${oi}`}
                              role="option"
                              aria-selected={opt.slug === car.slug && opt.version === car.version}
                              tabIndex={activeOptionIndex === oi ? 0 : -1}
                              className={`cmp-picker-item ${opt.slug === car.slug && opt.version === car.version ? 'is-active' : ''} ${activeOptionIndex === oi ? 'is-focused' : ''}`}
                              onClick={() => handlePick(side, opt)}
                              onFocus={() => setActiveOptionIndex(oi)}
                              onKeyDown={(event) => handleOptionKeyDown(event, side, oi, options.length)}
                              ref={(element) => { if (element) optionRefs.current[oi] = element }}
                            >
                              <span className="cmp-picker-item-brand">{opt.brand}</span>
                              <span className="cmp-picker-item-model">{opt.model}</span>
                              <span className="cmp-picker-item-price">{formatBRL(opt.priceBrl)}</span>
                            </button>
                          ))}
                          {options.length === 0 && (
                            <div className="cmp-picker-empty">
                              <strong>Nenhum modelo encontrado.</strong>
                              <span>Tente outra marca ou modelo.</span>
                            </div>
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
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
                >
                  {Number.isFinite(car.priceBrl) ? Math.round(car.priceBrl / 1000) : '—'}
                </motion.span>
                <span className="cmp-price-suffix">mil</span>
              </div>
              <p className="cmp-price-meta">preço sugerido Carbi</p>

              <AnimatePresence mode="wait" initial={false}>
                {view === 'specs' ? (
                  <motion.div
                    key="specs"
                    className="cmp-features"
                    id="cmp-panel-specs"
                    role="tabpanel"
                    aria-labelledby="cmp-tab-specs"
                    tabIndex={0}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
                  >
                    {SPECS.map((spec, si) => {
                      const Icon = spec.icon
                      const value = safeNumber(car[spec.key as keyof CarComparison] as number)
                      const otherValue = safeNumber(otherCar[spec.key as keyof CarComparison] as number)
                      const pct = Math.min(Math.max((value / spec.max) * 100, 0), 100)
                      const otherPct = Math.min(Math.max((otherValue / spec.max) * 100, 0), 100)
                      const isTie = value === otherValue
                      const isWinner = !isTie && pct > otherPct
                      return (
                        <motion.div
                          key={spec.key}
                          className="cmp-spec"
                          initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
                          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, delay: 0.45 + i * 0.08 + si * 0.05 }}
                        >
                          <div className="cmp-spec-top">
                            <div className="cmp-spec-label-wrap">
                              <Icon size={13} className="cmp-spec-icon" />
                              <span className="cmp-spec-label">{spec.label}</span>
                            </div>
                            <span
                              className={`cmp-spec-value ${isWinner ? 'is-winner' : ''}`}
                              aria-label={`${value}${spec.suffix}${isWinner ? ', melhor resultado' : isTie ? ', empate' : ''}`}
                            >
                              {value}{spec.suffix}
                            </span>
                          </div>
                          <div className="cmp-progress-track">
                            <motion.div
                              className="cmp-progress-fill"
                              initial={shouldReduceMotion ? false : { width: 0 }}
                              animate={inView ? { width: `${pct}%` } : { width: 0 }}
                              transition={shouldReduceMotion
                                ? { duration: 0 }
                                : { duration: 0.8, delay: 0.5 + i * 0.08 + si * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                    id="cmp-panel-cost"
                    role="tabpanel"
                    aria-labelledby="cmp-tab-cost"
                    tabIndex={0}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
                  >
                    <CostRow
                      icon={<Zap size={13} />}
                      label="Consumo médio"
                      current={car.fuelEconomyCityGas}
                      other={otherCar.fuelEconomyCityGas}
                      suffix=" km/l"
                    />
                    <CostRow
                      icon={<TrendingUp size={13} />}
                      label="Gasto anual com combustível"
                      current={i === 0 ? aFuelCost : bFuelCost}
                      other={i === 0 ? bFuelCost : aFuelCost}
                      formatter={(v) => formatBRL(savingsPerYear(v))}
                      lowerIsBetter
                    />
                    <CostRow
                      icon={<Gauge size={13} />}
                      label="Potência por R$ mil"
                      current={(safeNumber(car.horsepower) / Math.max(safeNumber(car.priceBrl), 1)) * 1000}
                      other={(safeNumber(otherCar.horsepower) / Math.max(safeNumber(otherCar.priceBrl), 1)) * 1000}
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

              <Link
                href={`/carros/${car.slug}`}
                className={`cmp-cta ${highlight ? 'is-highlight' : ''}`}
                aria-label={`Ver detalhes do ${car.brand} ${car.model}`}
              >
                <span>Ver {car.model}</span>
                <motion.span
                  className="cmp-cta-arrow"
                  aria-hidden="true"
                  whileHover={shouldReduceMotion ? undefined : { x: 4 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 20 }}
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
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, delay: 0.6 }}
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
  lowerIsBetter,
}: {
  icon: ReactNode
  label: string
  current: number
  other: number
  suffix?: string
  formatter?: (v: number) => string
  lowerIsBetter?: boolean
}) {
  const safeCurrent = safeNumber(current)
  const safeOther = safeNumber(other)
  const isTie = safeCurrent === safeOther
  const isWinner = !isTie && (lowerIsBetter ? safeCurrent < safeOther : safeCurrent > safeOther)
  const formatted = formatter ? formatter(safeCurrent) : `${safeCurrent}${suffix || ''}`
  return (
    <div className="cmp-spec">
      <div className="cmp-spec-top">
        <div className="cmp-spec-label-wrap">
          {icon}
          <span className="cmp-spec-label">{label}</span>
        </div>
        <span
          className={`cmp-spec-value ${isWinner ? 'is-winner' : ''}`}
          aria-label={`${formatted}${isWinner ? ', melhor resultado' : isTie ? ', empate' : ''}`}
        >
          {formatted}
        </span>
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
