'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Search, SlidersHorizontal, X, ChevronDown,
  Check, ChevronLeft, ChevronRight, CarFront,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ListingCard from '@/components/marketplace/ListingCard'
import { ListingPublic } from '@/lib/marketplace'
import { ListingSort, ListingsPageInput } from '@/lib/marketplace-server'
import { getFilteredListings, getModelsByBrands } from '@/app/carros-a-venda/actions'
import { clearTruckListingFilters, serializeTruckListingFilters } from '@/lib/truck-filters'

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
    <button type="button" onClick={onRemove} className="cbi-chip">
      {label}
      <X className="w-3 h-3" strokeWidth={2.5} />
    </button>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cbi-fsection">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`cbi-toggle${active ? ' on' : ''}`}>
      {children}
    </button>
  )
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className={`cbi-check${checked ? ' on' : ''}`}>
      <span className="box">{checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}</span>
      {label}
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
  const [mileageMin, setMileageMin] = useState<number>(getSearchNumber('mileage_min', typeof defaultFilters?.mileageMin === 'number' ? defaultFilters.mileageMin : 0))
  const [mileageMax, setMileageMax] = useState<number>(getSearchNumber('mileage_max', typeof defaultFilters?.mileageMax === 'number' ? defaultFilters.mileageMax : 300000))
  const [selectedTruckTypes, setSelectedTruckTypes] = useState<string[]>(getSearchArray('truck_type', defaultFilters?.truckType))
  const [selectedAxles, setSelectedAxles] = useState<number[]>(getSearchArray('axles', defaultFilters?.axles).map(Number).filter(Number.isFinite))
  const [loadCapacityMin, setLoadCapacityMin] = useState<number>(getSearchNumber('load_capacity_min', typeof defaultFilters?.loadCapacityMin === 'number' ? defaultFilters.loadCapacityMin : 0))
  const [loadCapacityMax, setLoadCapacityMax] = useState<number>(getSearchNumber('load_capacity_max', typeof defaultFilters?.loadCapacityMax === 'number' ? defaultFilters.loadCapacityMax : 100000))
  const [selectedCities, setSelectedCities] = useState<string[]>(getSearchArray('city', defaultFilters?.city))
  const [selectedState, setSelectedState] = useState<string>(searchParams.get('state') || defaultFilters?.state || '')
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
       mileageMin: mileageMin > 0 ? mileageMin : undefined,
       mileageMax: mileageMax < 300000 ? mileageMax : undefined,
       truckType: selectedTruckTypes.length > 0 ? selectedTruckTypes : undefined,
       axles: selectedAxles.length > 0 ? selectedAxles : undefined,
       loadCapacityMin: loadCapacityMin > 0 ? loadCapacityMin : undefined,
       loadCapacityMax: loadCapacityMax < 100000 ? loadCapacityMax : undefined,
       city: selectedCities.length > 0 ? selectedCities : undefined,
       state: selectedState || undefined,
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
     if (input.mileageMin) params.set('mileage_min', input.mileageMin.toString())
     if (input.mileageMax) params.set('mileage_max', input.mileageMax.toString())
     if (Array.isArray(input.truckType)) input.truckType.forEach(value => params.append('truck_type', value))
     if (Array.isArray(input.axles)) input.axles.forEach(value => params.append('axles', value.toString()))
     if (input.loadCapacityMin) params.set('load_capacity_min', input.loadCapacityMin.toString())
     if (input.loadCapacityMax) params.set('load_capacity_max', input.loadCapacityMax.toString())
     if (Array.isArray(input.city)) input.city.forEach(value => params.append('city', value))
     if (input.state) params.set('state', input.state)

    if (input.sort !== 'recent') params.set('ordem', input.sort!)
    if (input.page && input.page > 1) params.set('pagina', input.page.toString())

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    const result = await getFilteredListings(input)
    setListings(result.items)
    setTotal(result.total)
    setTotalPages(Math.max(1, Math.ceil(result.total / result.pageSize)))
    setIsSearching(false)
  }, [q, selectedBrands, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, selectedOptionals, priceRange, yearRange, mileageMin, mileageMax, selectedTruckTypes, selectedAxles, loadCapacityMin, loadCapacityMax, selectedCities, selectedState, sort, currentPage, router, pathname, selectedVehicleType, selectedModels])

  useEffect(() => {
    if (!didRunInitialTextSearch.current) {
      didRunInitialTextSearch.current = true
      return
    }
    const timer = setTimeout(() => {
      if (!isSearching) updateResults({ page: 1 })
    }, 250)
    return () => clearTimeout(timer)
  }, [q, priceRange, yearRange, mileageMin, mileageMax, loadCapacityMin, loadCapacityMax, sort])

  useEffect(() => {
    if (!didRunInitialFilterSearch.current) {
      didRunInitialFilterSearch.current = true
      return
    }
    updateResults({ page: 1 })
  }, [selectedBrands, selectedModels, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, selectedOptionals, selectedVehicleType, selectedTruckTypes, selectedAxles, selectedCities, selectedState])

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
    setSelectedVehicleType(defaultFilters?.vehicle_type === 'truck' ? 'truck' : '')
    setSelectedBrands([])
    setSelectedModels([])
    setSelectedFuels([])
    setSelectedTransmissions([])
    setSelectedColors([])
    setSelectedBodyTypes([])
    setSelectedOptionals([])
    setPriceRange([0, 1000000])
    setYearRange([1990, new Date().getFullYear() + 1])
    setMileageMin(0)
    setMileageMax(300000)
    setSelectedTruckTypes([])
    setSelectedAxles([])
    setLoadCapacityMin(0)
    setLoadCapacityMax(100000)
    setSelectedCities([])
    setSelectedState('')
    setSort('recent')
    setCurrentPage(1)
  }

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) setter(list.filter(i => i !== item))
    else setter([...list, item])
  }

  const activeChips = useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = []
    if (selectedVehicleType) chips.push({ label: selectedVehicleType === 'truck' ? 'Caminhão' : 'Carro', onRemove: () => setSelectedVehicleType(defaultFilters?.vehicle_type === 'truck' ? 'truck' : '') })
    selectedBrands.forEach(b => chips.push({ label: b, onRemove: () => toggleItem(selectedBrands, b, setSelectedBrands) }))
    selectedModels.forEach(m => chips.push({ label: m, onRemove: () => toggleItem(selectedModels, m, setSelectedModels) }))
    selectedFuels.forEach(f => chips.push({ label: f, onRemove: () => toggleItem(selectedFuels, f, setSelectedFuels) }))
    selectedTransmissions.forEach(t => chips.push({ label: t, onRemove: () => toggleItem(selectedTransmissions, t, setSelectedTransmissions) }))
    selectedColors.forEach(c => chips.push({ label: c, onRemove: () => toggleItem(selectedColors, c, setSelectedColors) }))
    selectedBodyTypes.forEach(bt => chips.push({ label: bt, onRemove: () => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes) }))
    if (priceRange[1] < 1000000) chips.push({ label: `Até R$ ${(priceRange[1]/1000).toFixed(0)}k`, onRemove: () => setPriceRange([0, 1000000]) })
    if (mileageMax < 300000) chips.push({ label: `Até ${mileageMax.toLocaleString('pt-BR')} km`, onRemove: () => setMileageMax(300000) })
    return chips
  }, [selectedVehicleType, selectedBrands, selectedModels, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, priceRange, mileageMax])

  const filtersContent = (
    <div>
      <FilterSection title="Tipo">
        <div className="flex flex-wrap gap-2">
          <ToggleButton active={selectedVehicleType === 'car'} onClick={() => setSelectedVehicleType(selectedVehicleType === 'car' ? '' : 'car')}>
            Carro
          </ToggleButton>
        </div>
      </FilterSection>

       {selectedVehicleType === 'truck' && (
         <>
           <FilterSection title="Tipo de caminhão">
             <div className="flex flex-wrap gap-1.5">
               {['Truck', 'Toco', 'Bitruck', 'Cavalo mecânico'].map(type => <ToggleButton key={type} active={selectedTruckTypes.includes(type)} onClick={() => toggleItem(selectedTruckTypes, type, setSelectedTruckTypes)}>{type}</ToggleButton>)}
             </div>
           </FilterSection>
           <FilterSection title="Eixos">
             <div className="flex flex-wrap gap-1.5">
               {[2, 3, 4, 5].map(axle => <ToggleButton key={axle} active={selectedAxles.includes(axle)} onClick={() => setSelectedAxles(selectedAxles.includes(axle) ? selectedAxles.filter(value => value !== axle) : [...selectedAxles, axle])}>{axle}</ToggleButton>)}
             </div>
           </FilterSection>
           <FilterSection title="Capacidade de carga (kg)">
             <div className="cbi-grid2"><input type="number" value={loadCapacityMin || ''} onChange={e => setLoadCapacityMin(Number(e.target.value) || 0)} placeholder="Mínimo" className="cbi-field" aria-label="Capacidade mínima" /><input type="number" value={loadCapacityMax === 100000 ? '' : loadCapacityMax} onChange={e => setLoadCapacityMax(Number(e.target.value) || 100000)} placeholder="Máximo" className="cbi-field" aria-label="Capacidade máxima" /></div>
           </FilterSection>
           <FilterSection title="Localização">
             <input value={selectedCities[0] || ''} onChange={e => setSelectedCities(e.target.value ? [e.target.value] : [])} placeholder="Cidade" className="cbi-field mb-2" aria-label="Cidade" />
             <input value={selectedState} onChange={e => setSelectedState(e.target.value.toUpperCase())} placeholder="Estado (UF)" maxLength={2} className="cbi-field" aria-label="Estado" />
           </FilterSection>
         </>
       )}

       <FilterSection title="Preço">

        <div className="cbi-grid2">
          <input
            type="number"
            value={priceRange[0] || ''}
            onChange={e => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
            placeholder="Mínimo"
            className="cbi-field"
            aria-label="Preço mínimo"
          />
          <input
            type="number"
            value={priceRange[1] === 1000000 ? '' : priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
            placeholder="Máximo"
            className="cbi-field"
            aria-label="Preço máximo"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[50000, 80000, 120000, 200000].map(p => (
            <ToggleButton key={p} active={priceRange[1] === p && priceRange[0] === 0} onClick={() => setPriceRange([0, p])}>
              Até {(p/1000).toFixed(0)}k
            </ToggleButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Marcas">
        <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
          {filterOptions?.brands.map(brand => (
            <CheckboxRow key={brand} label={brand} checked={selectedBrands.includes(brand)} onChange={() => toggleItem(selectedBrands, brand, setSelectedBrands)} />
          ))}
        </div>
      </FilterSection>

      {availableModels.length > 0 && (
        <FilterSection title="Modelos">
          <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
            {availableModels.map(model => (
              <CheckboxRow key={model} label={model} checked={selectedModels.includes(model)} onChange={() => toggleItem(selectedModels, model, setSelectedModels)} />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Ano">
        <div className="cbi-grid2">
          <input
            type="number"
            value={yearRange[0] === 1990 ? '' : yearRange[0]}
            onChange={e => setYearRange([Number(e.target.value) || 1990, yearRange[1]])}
            placeholder="De"
            className="cbi-field"
            aria-label="Ano mínimo"
          />
          <input
            type="number"
            value={yearRange[1] === new Date().getFullYear() + 1 ? '' : yearRange[1]}
            onChange={e => setYearRange([yearRange[0], Number(e.target.value) || new Date().getFullYear() + 1])}
            placeholder="Até"
            className="cbi-field"
            aria-label="Ano máximo"
          />
        </div>
      </FilterSection>

      <FilterSection title={`Quilometragem · até ${mileageMax.toLocaleString('pt-BR')} km`}>
        <input
          type="range"
          min="0"
          max="300000"
          step="5000"
          value={mileageMax}
          onChange={e => setMileageMax(Number(e.target.value))}
          className="cbi-range"
          aria-label="Quilometragem máxima"
        />
        <div className="cbi-rangelabels"><span>0</span><span>300.000 km</span></div>
      </FilterSection>

      {filterOptions?.fuels && filterOptions.fuels.length > 0 && (
        <FilterSection title="Combustível">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.fuels.map(fuel => (
              <ToggleButton key={fuel} active={selectedFuels.includes(fuel)} onClick={() => toggleItem(selectedFuels, fuel, setSelectedFuels)}>
                {fuel}
              </ToggleButton>
            ))}
          </div>
        </FilterSection>
      )}

      {filterOptions?.transmissions && filterOptions.transmissions.length > 0 && (
        <FilterSection title="Câmbio">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filterOptions.transmissions.map(t => (
              <CheckboxRow key={t} label={t} checked={selectedTransmissions.includes(t)} onChange={() => toggleItem(selectedTransmissions, t, setSelectedTransmissions)} />
            ))}
          </div>
        </FilterSection>
      )}

      {filterOptions?.bodyTypes && filterOptions.bodyTypes.length > 0 && (
        <FilterSection title="Carroceria">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.bodyTypes.map(bt => (
              <ToggleButton key={bt} active={selectedBodyTypes.includes(bt)} onClick={() => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes)}>
                {bt}
              </ToggleButton>
            ))}
          </div>
        </FilterSection>
      )}

      {filterOptions?.colors && filterOptions.colors.length > 0 && (
        <FilterSection title="Cores">
          <div className="cbi-swatches">
            {filterOptions.colors.map(color => {
              const hex = COLOR_MAP[color] || '#CCCCCC'
              const isSelected = selectedColors.includes(color)
              return (
                <button
                  key={color}
                  title={color}
                  type="button"
                  onClick={() => toggleItem(selectedColors, color, setSelectedColors)}
                  className={`cbi-swatch${isSelected ? ' on' : ''}`}
                  style={{ backgroundColor: hex }}
                >
                  {isSelected && <Check className={`w-3.5 h-3.5 ${hex === '#FFFFFF' || hex === '#FACC15' || hex === '#F5F5DC' ? 'text-[#1A1A1A]' : 'text-white'}`} strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </FilterSection>
      )}
    </div>
  )

  return (
    <div className="cbi-body">
      {/* Sidebar (desktop) */}
      <aside className="cbi-side">
        <div className="cbi-panel">
          <div className="cbi-side-head">
            <span className="cbi-side-title">Filtros</span>
            <button onClick={clearFilters} className="cbi-clear">Limpar tudo</button>
          </div>
          {filtersContent}
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0">
        {/* Toolbar */}
        <div className="cbi-toolbar">
          <div className="cbi-search">
            <Search strokeWidth={1.75} />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por marca, modelo ou versão..."
              aria-label="Buscar anúncios"
            />
          </div>
          <button onClick={() => setShowFilters(true)} className="cbi-filter-btn lg:hidden" aria-label="Abrir filtros">
            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
            Filtros
          </button>
          <div className="cbi-select-wrap hidden lg:block">
            <select value={sort} onChange={e => setSort(e.target.value as ListingSort)} className="cbi-select" aria-label="Ordenar anúncios">
              {SORT_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
            <ChevronDown strokeWidth={1.75} />
          </div>
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="cbi-chips">
            {activeChips.map((chip, idx) => (<Chip key={idx} label={chip.label} onRemove={chip.onRemove} />))}
          </div>
        )}

        {/* Results header */}
        <div className="cbi-results">
          <div className="cbi-count">
            {isSearching ? (
              <span>Buscar...</span>
            ) : (
              <><b>{total.toLocaleString('pt-BR')}</b>{total === 1 ? 'veículo encontrado' : 'veículos encontrados'}</>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className={`cbi-grid transition-opacity duration-200 ${isSearching ? 'opacity-50' : 'opacity-100'}`}>
          {listings.length > 0 ? (
            listings.map((listing, idx) => (
              <ListingCard key={listing.id} listing={listing} priority={idx < 3} index={idx} />
            ))
          ) : !isSearching && (
            <div className="cbi-empty">
              <h3>Nenhum resultado</h3>
              <p>Tente ajustar os filtros para encontrar mais veículos.</p>
              <button onClick={clearFilters}>Limpar todos os filtros</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="cbi-pager">
            <button
              disabled={currentPage <= 1 || isSearching}
              onClick={() => { setCurrentPage(currentPage - 1); updateResults({ page: currentPage - 1 }) }}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <div className="info">{currentPage} de {totalPages}</div>
            <button
              disabled={currentPage >= totalPages || isSearching}
              onClick={() => { setCurrentPage(currentPage + 1); updateResults({ page: currentPage + 1 }) }}
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile filters sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              style={{ position: 'fixed', insetInline: 0, bottom: 0, zIndex: 101, display: 'flex', flexDirection: 'column', maxHeight: '90vh', background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottom: '1px solid #F2F2EF' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Filtros</h3>
                <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="w-5 h-5" strokeWidth={1.75} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                <div className="cbi-panel" style={{ border: 'none', padding: 0 }}>{filtersContent}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #F2F2EF' }}>
                <button onClick={clearFilters} style={{ height: 48, flex: 1, background: '#fff', border: '1px solid #E6E6E2', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Limpar</button>
                <button onClick={() => setShowFilters(false)} style={{ height: 48, flex: 2, background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Ver {total} resultados</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
