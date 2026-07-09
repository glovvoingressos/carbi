'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Search, SlidersHorizontal, X, ChevronDown,
  Check, ArrowUpDown, Loader2,
  ChevronLeft, ChevronRight, CarFront,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ListingCard from '@/components/marketplace/ListingCard'
import { ListingPublic } from '@/lib/marketplace'
import { ListingSort, ListingsPageInput } from '@/lib/marketplace-server'
import { getFilteredListings, getModelsByBrands } from '@/app/carros-a-venda/actions'

interface MarketplaceClientProps {
  initialListings: ListingPublic[]
  initialTotal: number
  initialPage: number
  initialTotalPages: number
  defaultFilters?: Partial<ListingsPageInput>
  filterOptions: {
    brands: string[]
    fuels: string[]
    transmissions: string[]
    colors: string[]
    bodyTypes: string[]
    optionalItems: string[]
  } | null
}

const SORT_OPTIONS: Array<{ value: ListingSort; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'mileage_asc', label: 'Menor km' },
  { value: 'year_desc', label: 'Mais novos' },
]

const COLOR_MAP: Record<string, string> = {
  'Branco': '#FFFFFF',
  'Preto': '#0A0A0A',
  'Prata': '#C0C0C0',
  'Cinza': '#808080',
  'Vermelho': '#DC2626',
  'Azul': '#93C5FD',
  'Verde': '#10B981',
  'Amarelo': '#FACC15',
  'Bege': '#F5F5DC',
  'Laranja': '#F97316',
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#17170F] text-[#FFFDF3] text-[12px] font-bold tracking-tight hover:bg-[#2A2A1D] transition-colors shadow-sm"
    >
      {label}
      <X className="w-3 h-3" strokeWidth={2.5} />
    </button>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-[#0A0A0A] tracking-tight mb-3 uppercase">{title}</h3>
      {children}
    </div>
  )
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-[13px] font-medium tracking-tight transition-colors ${
        active
          ? 'bg-[#17170F] text-[#FFFDF3] shadow-sm'
          : 'bg-white text-[#4F4A3E] hover:bg-[#D9F85F] border-2 border-[#17170F]/10'
      }`}
    >
      {children}
    </button>
  )
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-full flex items-center gap-3 py-1.5 text-left group"
    >
      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
        checked ? 'bg-[#17170F] border-[#17170F]' : 'bg-white border-[#C8BEA8] group-hover:border-[#17170F]'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <span className={`text-[13px] tracking-tight transition-colors ${checked ? 'text-[#0A0A0A] font-medium' : 'text-[#52607A] group-hover:text-[#0A0A0A]'}`}>
        {label}
      </span>
    </button>
  )
}

export default function MarketplaceClient({
  initialListings,
  initialTotal,
  initialPage,
  initialTotalPages,
  defaultFilters,
  filterOptions
}: MarketplaceClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [listings, setListings] = useState<ListingPublic[]>(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const didRunInitialTextSearch = useRef(false)
  const didRunInitialFilterSearch = useRef(false)

  const getDefaultArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter(Boolean).map(String)
    if (typeof value === 'string' && value.trim()) return [value.trim()]
    return []
  }

  const getSearchArray = (key: string, fallback: unknown = []) => {
    const values = searchParams.getAll(key)
    if (values.length > 0) return values
    return getDefaultArray(fallback)
  }

  const getSearchNumber = (key: string, fallback: number) => {
    const raw = searchParams.get(key)
    if (raw === null || raw === '') return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const [q, setQ] = useState(searchParams.get('q') || (typeof defaultFilters?.q === 'string' ? defaultFilters.q : ''))
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(() => {
    const urlVehicle = searchParams.get('vehicle_type')
    if (urlVehicle) return urlVehicle
    return typeof defaultFilters?.vehicle_type === 'string' ? defaultFilters.vehicle_type : ''
  })
  const [selectedBrands, setSelectedBrands] = useState<string[]>(getSearchArray('brand', defaultFilters?.brand))
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>(getSearchArray('model', defaultFilters?.model))
  const [priceRange, setPriceRange] = useState<[number, number]>([
    getSearchNumber('price_min', typeof defaultFilters?.priceMin === 'number' ? defaultFilters.priceMin : 0),
    getSearchNumber('price_max', typeof defaultFilters?.priceMax === 'number' ? defaultFilters.priceMax : 1000000),
  ])
  const [yearRange, setYearRange] = useState<[number, number]>([
    getSearchNumber('year_min', typeof defaultFilters?.yearMin === 'number' ? defaultFilters.yearMin : 1990),
    getSearchNumber('year_max', typeof defaultFilters?.yearMax === 'number' ? defaultFilters.yearMax : new Date().getFullYear() + 1),
  ])
  const [mileageMax, setMileageMax] = useState<number>(getSearchNumber('mileage_max', typeof defaultFilters?.mileageMax === 'number' ? defaultFilters.mileageMax : 300000))
  const [selectedFuels, setSelectedFuels] = useState<string[]>(getSearchArray('fuel', defaultFilters?.fuel))
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>(getSearchArray('transmission', defaultFilters?.transmission))
  const [selectedColors, setSelectedColors] = useState<string[]>(getSearchArray('color', defaultFilters?.color))
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(getSearchArray('body_type', defaultFilters?.bodyType))
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>(getSearchArray('optional', defaultFilters?.optionalItems))
  const [sort, setSort] = useState<ListingSort>((searchParams.get('ordem') as ListingSort) || defaultFilters?.sort || 'recent')

  const updateResults = useCallback(async (overrides: Partial<ListingsPageInput> = {}) => {
    setIsSearching(true)
    const input: ListingsPageInput = {
      q: q || undefined,
      vehicle_type: selectedVehicleType || undefined,
      brand: selectedBrands.length > 0 ? selectedBrands : undefined,
      model: selectedModels.length > 0 ? selectedModels : undefined,
      fuel: selectedFuels.length > 0 ? selectedFuels : undefined,
      transmission: selectedTransmissions.length > 0 ? selectedTransmissions : undefined,
      color: selectedColors.length > 0 ? selectedColors : undefined,
      bodyType: selectedBodyTypes.length > 0 ? selectedBodyTypes : undefined,
      optionalItems: selectedOptionals.length > 0 ? selectedOptionals : undefined,
      priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      priceMax: priceRange[1] < 1000000 ? priceRange[1] : undefined,
      yearMin: yearRange[0] > 1990 ? yearRange[0] : undefined,
      yearMax: yearRange[1] < (new Date().getFullYear() + 1) ? yearRange[1] : undefined,
      mileageMax: mileageMax < 300000 ? mileageMax : undefined,
      sort,
      page: currentPage,
      pageSize: 24,
      ...overrides
    }

    const params = new URLSearchParams()
    if (input.q) params.set('q', input.q)
    if (Array.isArray(input.brand)) input.brand.forEach(b => params.append('brand', b))
    if (Array.isArray(input.model)) input.model.forEach(m => params.append('model', m))
    if (Array.isArray(input.fuel)) input.fuel.forEach(f => params.append('fuel', f))
    if (Array.isArray(input.transmission)) input.transmission.forEach(t => params.append('transmission', t))
    if (Array.isArray(input.color)) input.color.forEach(c => params.append('color', c))
    if (Array.isArray(input.bodyType)) input.bodyType.forEach(bt => params.append('body_type', bt))
    if (Array.isArray(input.optionalItems)) input.optionalItems.forEach(o => params.append('optional', o))
    if (input.priceMin) params.set('price_min', input.priceMin.toString())
    if (input.priceMax) params.set('price_max', input.priceMax.toString())
    if (input.yearMin) params.set('year_min', input.yearMin.toString())
    if (input.yearMax) params.set('year_max', input.yearMax.toString())
    if (input.mileageMax) params.set('mileage_max', input.mileageMax.toString())
    if (input.sort !== 'recent') params.set('ordem', input.sort!)
    if (input.page && input.page > 1) params.set('pagina', input.page.toString())

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    const result = await getFilteredListings(input)
    setListings(result.items)
    setTotal(result.total)
    setTotalPages(Math.max(1, Math.ceil(result.total / result.pageSize)))
    setIsSearching(false)
  }, [q, selectedBrands, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, selectedOptionals, priceRange, yearRange, mileageMax, sort, currentPage, router, pathname, selectedVehicleType, selectedModels])

  useEffect(() => {
    if (!didRunInitialTextSearch.current) {
      didRunInitialTextSearch.current = true
      return
    }

    const timer = setTimeout(() => {
      if (!isSearching) updateResults({ page: 1 })
    }, 250)
    return () => clearTimeout(timer)
  }, [q, priceRange, yearRange, mileageMax, sort])

  useEffect(() => {
    if (!didRunInitialFilterSearch.current) {
      didRunInitialFilterSearch.current = true
      return
    }

    updateResults({ page: 1 })
  }, [selectedBrands, selectedModels, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, selectedOptionals, selectedVehicleType])

  useEffect(() => {
    async function loadModels() {
      if (selectedBrands.length > 0) {
        const models = await getModelsByBrands(selectedBrands)
        setAvailableModels(models)
      } else {
        setAvailableModels([])
        setSelectedModels([])
      }
    }
    loadModels()
  }, [selectedBrands])

  const clearFilters = () => {
    setQ('')
    setSelectedVehicleType('')
    setSelectedBrands([])
    setSelectedModels([])
    setSelectedFuels([])
    setSelectedTransmissions([])
    setSelectedColors([])
    setSelectedBodyTypes([])
    setSelectedOptionals([])
    setPriceRange([0, 1000000])
    setYearRange([1990, new Date().getFullYear() + 1])
    setMileageMax(300000)
    setSort('recent')
    setCurrentPage(1)
  }

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) setter(list.filter(i => i !== item))
    else setter([...list, item])
  }

  const activeChips = useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = []
    if (selectedVehicleType) {
      chips.push({ label: 'Carro', onRemove: () => setSelectedVehicleType('') })
    }
    selectedBrands.forEach(b => chips.push({ label: b, onRemove: () => toggleItem(selectedBrands, b, setSelectedBrands) }))
    selectedModels.forEach(m => chips.push({ label: m, onRemove: () => toggleItem(selectedModels, m, setSelectedModels) }))
    selectedFuels.forEach(f => chips.push({ label: f, onRemove: () => toggleItem(selectedFuels, f, setSelectedFuels) }))
    selectedTransmissions.forEach(t => chips.push({ label: t, onRemove: () => toggleItem(selectedTransmissions, t, setSelectedTransmissions) }))
    selectedColors.forEach(c => chips.push({ label: c, onRemove: () => toggleItem(selectedColors, c, setSelectedColors) }))
    selectedBodyTypes.forEach(bt => chips.push({ label: bt, onRemove: () => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes) }))
    if (priceRange[1] < 1000000) {
      chips.push({ label: `Até R$ ${(priceRange[1]/1000).toFixed(0)}k`, onRemove: () => setPriceRange([0, 1000000]) })
    }
    if (mileageMax < 300000) {
      chips.push({ label: `Até ${mileageMax.toLocaleString('pt-BR')} km`, onRemove: () => setMileageMax(300000) })
    }
    return chips
  }, [selectedVehicleType, selectedBrands, selectedModels, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, priceRange, mileageMax])

  const filtersContent = (
    <div className="space-y-8">
      <FilterSection title="Tipo">
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            active={selectedVehicleType === 'car'}
            onClick={() => setSelectedVehicleType(selectedVehicleType === 'car' ? '' : 'car')}
          >
            Carro
          </ToggleButton>
        </div>
      </FilterSection>

      <FilterSection title="Preço">
          <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="price-min" className="sr-only">Preço mínimo</label>
            <input
              id="price-min"
              type="number"
              value={priceRange[0] || ''}
              onChange={e => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              placeholder="Mínimo"
              className="w-full h-10 px-3 bg-white/80 border border-white/80 rounded-xl text-[13px] outline-none focus:border-[#17170F] transition-colors"
              aria-label="Preço mínimo"
            />
          </div>
          <div>
            <label htmlFor="price-max" className="sr-only">Preço máximo</label>
            <input
              id="price-max"
              type="number"
              value={priceRange[1] === 1000000 ? '' : priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
              placeholder="Máximo"
              className="w-full h-10 px-3 bg-white/80 border border-white/80 rounded-xl text-[13px] outline-none focus:border-[#17170F] transition-colors"
              aria-label="Preço máximo"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[50000, 80000, 120000, 200000].map(p => (
            <ToggleButton
              key={p}
              active={priceRange[1] === p && priceRange[0] === 0}
              onClick={() => setPriceRange([0, p])}
            >
              Até {(p/1000).toFixed(0)}k
            </ToggleButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Marcas">
        <div className="max-h-48 overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
          {filterOptions?.brands.map(brand => (
            <CheckboxRow
              key={brand}
              label={brand}
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleItem(selectedBrands, brand, setSelectedBrands)}
            />
          ))}
        </div>
      </FilterSection>

      {availableModels.length > 0 && (
        <FilterSection title="Modelos">
          <div className="max-h-48 overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
            {availableModels.map(model => (
              <CheckboxRow
                key={model}
                label={model}
                checked={selectedModels.includes(model)}
                onChange={() => toggleItem(selectedModels, model, setSelectedModels)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Ano">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="year-min" className="sr-only">Ano mínimo</label>
            <input
              id="year-min"
              type="number"
              value={yearRange[0] === 1990 ? '' : yearRange[0]}
              onChange={e => setYearRange([Number(e.target.value) || 1990, yearRange[1]])}
              placeholder="De"
              className="w-full h-10 px-3 bg-white border border-[#EAEAE8] rounded-lg text-[13px] outline-none focus:border-[#0A0A0A] transition-colors"
              aria-label="Ano mínimo"
            />
          </div>
          <div>
            <label htmlFor="year-max" className="sr-only">Ano máximo</label>
            <input
              id="year-max"
              type="number"
              value={yearRange[1] === new Date().getFullYear() + 1 ? '' : yearRange[1]}
              onChange={e => setYearRange([yearRange[0], Number(e.target.value) || new Date().getFullYear() + 1])}
              placeholder="Até"
              className="w-full h-10 px-3 bg-white border border-[#EAEAE8] rounded-lg text-[13px] outline-none focus:border-[#0A0A0A] transition-colors"
              aria-label="Ano máximo"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title={`Quilometragem · até ${mileageMax.toLocaleString('pt-BR')} km`}>
        <label htmlFor="mileage-slider" className="sr-only">Quilometragem máxima</label>
        <input
          id="mileage-slider"
          type="range"
          min="0"
          max="300000"
          step="5000"
          value={mileageMax}
          onChange={e => setMileageMax(Number(e.target.value))}
          className="w-full h-1 bg-[#EAEAE8] rounded-full appearance-none cursor-pointer accent-[#0A0A0A]"
          aria-label="Quilometragem máxima"
        />
          <div className="flex justify-between mt-2 text-[11px] text-[#8A95A8] tracking-tight">
            <span>0</span>
            <span>300.000 km</span>
          </div>
      </FilterSection>

      {filterOptions?.fuels && filterOptions.fuels.length > 0 && (
        <FilterSection title="Combustível">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.fuels.map(fuel => (
              <ToggleButton
                key={fuel}
                active={selectedFuels.includes(fuel)}
                onClick={() => toggleItem(selectedFuels, fuel, setSelectedFuels)}
              >
                {fuel}
              </ToggleButton>
            ))}
          </div>
        </FilterSection>
      )}

      {filterOptions?.transmissions && filterOptions.transmissions.length > 0 && (
        <FilterSection title="Câmbio">
          <div className="space-y-0.5">
            {filterOptions.transmissions.map(t => (
              <CheckboxRow
                key={t}
                label={t}
                checked={selectedTransmissions.includes(t)}
                onChange={() => toggleItem(selectedTransmissions, t, setSelectedTransmissions)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {filterOptions?.bodyTypes && filterOptions.bodyTypes.length > 0 && (
        <FilterSection title="Carroceria">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.bodyTypes.map(bt => (
              <ToggleButton
                key={bt}
                active={selectedBodyTypes.includes(bt)}
                onClick={() => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes)}
              >
                {bt}
              </ToggleButton>
            ))}
          </div>
        </FilterSection>
      )}

      {filterOptions?.colors && filterOptions.colors.length > 0 && (
        <FilterSection title="Cores">
          <div className="flex flex-wrap gap-2.5">
            {filterOptions.colors.map(color => {
              const hex = COLOR_MAP[color] || '#CCCCCC'
              const isSelected = selectedColors.includes(color)
              return (
                <button
                  key={color}
                  title={color}
                  type="button"
                  onClick={() => toggleItem(selectedColors, color, setSelectedColors)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    isSelected ? 'border-[#0A0A0A] scale-110' : 'border-[#EAEAE8] hover:border-[#0A0A0A]'
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {isSelected && <Check className={`w-3.5 h-3.5 mx-auto ${hex === '#FFFFFF' || hex === '#FACC15' || hex === '#F5F5DC' ? 'text-[#0A0A0A]' : 'text-white'}`} strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </FilterSection>
      )}
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-[#0A0A0A]">Filtros</h2>
            <button onClick={clearFilters} className="text-[12px] font-medium text-[#52607A] hover:text-[#0A0A0A] transition-colors">
              Limpar tudo
            </button>
          </div>
          <div className="surface-strong p-5">{filtersContent}</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 min-w-0">
        {/* Search + Sort */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <label htmlFor="marketplace-search" className="sr-only">Buscar anúncios</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#17170F]" strokeWidth={1.75} />
            <input
              id="marketplace-search"
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por marca, modelo ou versão..."
              className="w-full h-12 pl-11 pr-4 bg-white border-2 border-[#17170F]/12 rounded-full text-[14px] tracking-tight outline-none focus:border-[#17170F] transition-colors shadow-sm"
              aria-label="Buscar anúncios por marca, modelo ou versão"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden h-12 px-4 bg-white border-2 border-[#17170F]/12 rounded-full flex items-center gap-2 text-[14px] font-bold tracking-tight shadow-sm"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
            Filtros
          </button>
          <div className="hidden lg:block relative">
            <label htmlFor="marketplace-sort" className="sr-only">Ordenar por</label>
            <select
              id="marketplace-sort"
              value={sort}
              onChange={e => setSort(e.target.value as ListingSort)}
              className="h-12 pl-4 pr-10 bg-white border-2 border-[#17170F]/12 rounded-full text-[14px] font-bold tracking-tight appearance-none outline-none cursor-pointer hover:border-[#17170F] focus:border-[#17170F] transition-colors shadow-sm"
              aria-label="Ordenar anúncios"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
          </div>
        </div>

        {/* Active Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {activeChips.map((chip, idx) => (
              <Chip key={idx} label={chip.label} onRemove={chip.onRemove} />
            ))}
          </div>
        )}

        {/* Results */}
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#0A0A0A]">
            {isSearching ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-[#17170F] border-t-transparent animate-spin" />
                Buscando...
              </span>
            ) : (
              <span className="tabular-nums">
                <strong className="text-[28px]">{total.toLocaleString('pt-BR')}</strong>
                <span className="text-[16px] text-[#52607A] ml-1.5 font-medium">
                  {total === 1 ? 'veículo encontrado' : 'veículos encontrados'}
                </span>
              </span>
            )}
          </h1>
        </div>

        {/* Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 transition-opacity duration-200 ${isSearching ? 'opacity-50' : 'opacity-100'}`}>
          {listings.length > 0 ? (
            listings.map((listing, idx) => (
              <ListingCard key={listing.id} listing={listing} priority={idx < 3} />
            ))
          ) : !isSearching && (
            <div className="col-span-full surface-strong p-16 text-center max-[330px]:p-5">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#17170F]/20 bg-[#D9F85F] max-[330px]:h-10 max-[330px]:w-10">
                <CarFront className="h-7 w-7 text-[#17170F] max-[330px]:h-5 max-[330px]:w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[18px] font-semibold tracking-normal text-[#0A0A0A] max-[330px]:text-[16px]">Nenhum resultado</h3>
              <p className="mx-auto mb-6 max-w-sm text-[14px] text-[#52607A] max-[330px]:text-[12px]">Tente ajustar os filtros para encontrar mais veículos.</p>
              <button onClick={clearFilters} className="btn btn-primary">Limpar todos os filtros</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2 max-[330px]:mt-8 max-[330px]:gap-1.5">
            <button
              disabled={currentPage <= 1 || isSearching}
              onClick={() => {
                setCurrentPage(currentPage - 1)
                updateResults({ page: currentPage - 1 })
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white/84 shadow-sm backdrop-blur-xl transition-colors max-[330px]:h-9 max-[330px]:w-9 ${
                currentPage <= 1 ? 'opacity-30 border-[#17170F]/10' : 'border-[#17170F]/12 hover:border-[#17170F]'
              }`}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <div className="flex h-11 items-center px-5 text-[13px] font-medium tracking-normal text-[#0A0A0A] max-[330px]:h-9 max-[330px]:px-3 max-[330px]:text-[12px]">
              {currentPage} de {totalPages}
            </div>
            <button
              disabled={currentPage >= totalPages || isSearching}
              onClick={() => {
                setCurrentPage(currentPage + 1)
                updateResults({ page: currentPage + 1 })
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white/84 shadow-sm backdrop-blur-xl transition-colors max-[330px]:h-9 max-[330px]:w-9 ${
                currentPage >= totalPages ? 'opacity-30 border-[#17170F]/10' : 'border-[#17170F]/12 hover:border-[#17170F]'
              }`}
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE FILTERS ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/40 z-[100] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[90vh] flex-col rounded-t-[32px] bg-white/94 shadow-[0_-24px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl lg:hidden max-[330px]:rounded-t-[24px]"
            >
              <div className="flex items-center justify-between border-b border-white/70 p-5 max-[330px]:p-4">
                <h3 className="text-[18px] font-semibold tracking-normal max-[330px]:text-[16px]">Filtros</h3>
                <button onClick={() => setShowFilters(false)} className="btn-icon">
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 pb-6 max-[330px]:p-3 max-[330px]:pb-4">
                <div className="surface p-5 max-[330px]:p-3">{filtersContent}</div>
              </div>
              <div className="flex gap-2 border-t border-white/70 p-4 max-[330px]:p-3">
                <button
                  onClick={clearFilters}
                  className="h-12 flex-1 bg-white/84 text-[#52607A] rounded-full text-[14px] font-medium border border-white/70"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="h-12 flex-[2] bg-[#17170F] text-[#FFFDF3] rounded-full text-[14px] font-bold shadow-sm"
                >
                  Ver {total} resultados
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
