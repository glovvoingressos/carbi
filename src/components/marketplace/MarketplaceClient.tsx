'use client'

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { 
  Search, SlidersHorizontal, X, ChevronDown, 
  Check, Filter, ArrowUpDown, Loader2,
  MapPin, Calendar, Gauge, Palette,
  Zap, Settings2, Trash2, Fuel,
  ChevronLeft, ChevronRight, CarFront, Tag
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

export default function MarketplaceClient({
  initialListings,
  initialTotal,
  initialPage,
  initialTotalPages,
  filterOptions
}: MarketplaceClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // --- DETECT TRUCK-ONLY PAGE ---
  const isTruckOnlyPage = pathname === '/caminhoes'

  // --- STATE ---
  const [listings, setListings] = useState<ListingPublic[]>(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // --- FILTERS STATE ---
  const [q, setQ] = useState(searchParams.get('q') || '')
  // Inicializa com 'truck' se for página de caminhões e não houver vehicle_type na URL
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(() => {
    const urlVehicle = searchParams.get('vehicle_type')
    if (isTruckOnlyPage && !urlVehicle) {
      return 'truck'
    }
    return urlVehicle || ''
  })
  const [selectedBrands, setSelectedBrands] = useState<string[]>(searchParams.getAll('brand'))
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>(searchParams.getAll('model'))
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('price_min')) || 0,
    Number(searchParams.get('price_max')) || 1000000
  ])
  const [yearRange, setYearRange] = useState<[number, number]>([
    Number(searchParams.get('year_min')) || 1990,
    Number(searchParams.get('year_max')) || new Date().getFullYear() + 1
  ])
  const [mileageRange, setMileageRange] = useState<[number, number]>([
    Number(searchParams.get('mileage_min')) || 0,
    Number(searchParams.get('mileage_max')) || 500000
  ])
  const [selectedFuels, setSelectedFuels] = useState<string[]>(searchParams.getAll('fuel'))
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>(searchParams.getAll('transmission'))
  const [selectedColors, setSelectedColors] = useState<string[]>(searchParams.getAll('color'))
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(searchParams.getAll('body_type'))
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>(searchParams.getAll('optional'))
  const [sort, setSort] = useState<ListingSort>((searchParams.get('ordem') as ListingSort) || 'recent')

  // --- ACTIONS ---
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
      mileageMin: mileageRange[0] > 0 ? mileageRange[0] : undefined,
      mileageMax: mileageRange[1] < 500000 ? mileageRange[1] : undefined,
      sort,
      page: currentPage,
      pageSize: 24,
      ...overrides
    }

    // Update URL without reload (preserva a página atual: carros ou caminhões)
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
    if (input.sort !== 'recent') params.set('ordem', input.sort!)
    if (input.page && input.page > 1) params.set('pagina', input.page.toString())

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    const result = await getFilteredListings(input)
    setListings(result.items)
    setTotal(result.total)
    setTotalPages(Math.max(1, Math.ceil(result.total / result.pageSize)))
    setIsSearching(false)
  }, [q, selectedBrands, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, selectedOptionals, priceRange, yearRange, mileageRange, sort, currentPage, router])

  // Debounced search for price/mileage etc
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSearching) updateResults({ page: 1 })
    }, 500)
    return () => clearTimeout(timer)
  }, [q, priceRange, yearRange, mileageRange, sort])

  useEffect(() => {
    updateResults({ page: 1 })
  }, [selectedBrands, selectedModels, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, selectedOptionals])

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
    setMileageRange([0, 500000])
    setSort('recent')
    setCurrentPage(1)
  }

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item))
    } else {
      setter([...list, item])
    }
  }

  const activeChips = useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = []
    if (selectedVehicleType) chips.push({ label: selectedVehicleType === 'car' ? 'Carro' : 'Caminhão', onRemove: () => setSelectedVehicleType('') })
    selectedBrands.forEach(b => chips.push({ label: b, onRemove: () => toggleItem(selectedBrands, b, setSelectedBrands) }))
    selectedModels.forEach(m => chips.push({ label: m, onRemove: () => toggleItem(selectedModels, m, setSelectedModels) }))
    selectedFuels.forEach(f => chips.push({ label: f, onRemove: () => toggleItem(selectedFuels, f, setSelectedFuels) }))
    selectedTransmissions.forEach(t => chips.push({ label: t, onRemove: () => toggleItem(selectedTransmissions, t, setSelectedTransmissions) }))
    selectedColors.forEach(c => chips.push({ label: c, onRemove: () => toggleItem(selectedColors, c, setSelectedColors) }))
    selectedBodyTypes.forEach(bt => chips.push({ label: bt, onRemove: () => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes) }))
    if (priceRange[0] > 0 || priceRange[1] < 1000000) {
      chips.push({ label: `Até R$ ${(priceRange[1]/1000).toFixed(0)}k`, onRemove: () => setPriceRange([0, 1000000]) })
    }
    return chips
  }, [selectedVehicleType, selectedBrands, selectedFuels, selectedTransmissions, selectedColors, selectedBodyTypes, priceRange])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-32 space-y-6">
          <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-black text-xl text-text-primary tracking-tight">Filtros</h3>
              <button 
                onClick={clearFilters}
                className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-accent transition-colors"
              >
                Limpar
              </button>
            </div>
 
            <div className="space-y-8">
              {/* Tipo de veículo */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Tipo de veículo</label>
                <div className="flex flex-wrap gap-2">
                  {!isTruckOnlyPage && (
                    <button 
                      onClick={() => setSelectedVehicleType(selectedVehicleType === 'car' ? '' : 'car')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedVehicleType === 'car' ? 'bg-accent text-white shadow-sm' : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80 hover:text-text-primary'}`}
                    >
                      Carro
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedVehicleType('truck')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedVehicleType === 'truck' || isTruckOnlyPage ? 'bg-accent text-white shadow-sm' : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80 hover:text-text-primary'}`}
                  >
                    Caminhão
                  </button>
                </div>
              </div>

              {/* Preço */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Preço (R$)</label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number"
                      value={priceRange[0]}
                      onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="bg-bg-alt border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-accent focus:bg-white transition-colors"
                      placeholder="Mín"
                    />
                    <input 
                      type="number"
                      value={priceRange[1]}
                      onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="bg-bg-alt border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-accent focus:bg-white transition-colors"
                      placeholder="Máx"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[30000, 60000, 100000].map(p => (
                      <button 
                        key={p}
                        onClick={() => setPriceRange([0, p])}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${priceRange[1] === p ? 'bg-accent text-white' : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80 hover:text-text-primary'}`}
                      >
                        Até {p/1000}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Marcas */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Marcas</label>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {filterOptions?.brands.map(brand => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedBrands.includes(brand) ? 'bg-accent border-accent text-white shadow-sm' : 'border-border group-hover:border-accent bg-bg-alt'}`}>
                        {selectedBrands.includes(brand) && <Check className="w-3 h-3" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleItem(selectedBrands, brand, setSelectedBrands)}
                      />
                      <span className={`text-xs font-bold transition-colors ${selectedBrands.includes(brand) ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary'}`}>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modelos */}
              {availableModels.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Modelos</label>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {availableModels.map(model => (
                      <label key={model} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedModels.includes(model) ? 'bg-accent border-accent text-white shadow-sm' : 'border-border group-hover:border-accent bg-bg-alt'}`}>
                          {selectedModels.includes(model) && <Check className="w-3 h-3" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={selectedModels.includes(model)}
                          onChange={() => toggleItem(selectedModels, model, setSelectedModels)}
                        />
                        <span className={`text-xs font-bold transition-colors ${selectedModels.includes(model) ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary'}`}>{model}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Combustível */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Combustível</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions?.fuels.map(fuel => (
                    <button 
                      key={fuel}
                      onClick={() => toggleItem(selectedFuels, fuel, setSelectedFuels)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${selectedFuels.includes(fuel) ? 'bg-accent text-white shadow-sm' : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80 hover:text-text-primary'}`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Câmbio */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Câmbio</label>
                <div className="space-y-2">
                  {filterOptions?.transmissions.map(t => (
                    <label key={t} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedTransmissions.includes(t) ? 'bg-accent border-accent text-white shadow-sm' : 'border-border group-hover:border-accent bg-bg-alt'}`}>
                        {selectedTransmissions.includes(t) && <Check className="w-3 h-3" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedTransmissions.includes(t)}
                        onChange={() => toggleItem(selectedTransmissions, t, setSelectedTransmissions)}
                      />
                      <span className={`text-xs font-bold transition-colors ${selectedTransmissions.includes(t) ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary'}`}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ano */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Ano</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number"
                    value={yearRange[0]}
                    onChange={e => setYearRange([Number(e.target.value), yearRange[1]])}
                    className="bg-bg-alt border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-accent focus:bg-white transition-colors"
                    placeholder="De"
                  />
                  <input 
                    type="number"
                    value={yearRange[1]}
                    onChange={e => setYearRange([yearRange[0], Number(e.target.value)])}
                    className="bg-bg-alt border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-accent focus:bg-white transition-colors"
                    placeholder="Até"
                  />
                </div>
              </div>

              {/* KM */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Quilometragem</label>
                <div className="space-y-4">
                  <input 
                    type="range"
                    min="0"
                    max="300000"
                    step="10000"
                    value={mileageRange[1]}
                    onChange={e => setMileageRange([0, Number(e.target.value)])}
                    className="w-full accent-accent"
                  />
                   <div className="flex justify-between text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                     <span>0 km</span>
                     <span>{mileageRange[1].toLocaleString('pt-BR')} km</span>
                   </div>
                </div>
              </div>

              {/* Carroceria */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Carroceria</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions?.bodyTypes.map(bt => (
                    <button 
                      key={bt}
                      onClick={() => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${selectedBodyTypes.includes(bt) ? 'bg-accent text-white shadow-sm' : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80 hover:text-text-primary'}`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Cores</label>
                <div className="flex flex-wrap gap-3">
                  {filterOptions?.colors.map(color => {
                    const colorMap: Record<string, string> = {
                      'Branco': '#FFFFFF',
                      'Preto': '#000000',
                      'Prata': '#C0C0C0',
                      'Cinza': '#808080',
                      'Vermelho': '#FF0000',
                      'Azul': '#0000FF',
                      'Verde': '#008000',
                      'Amarelo': '#FFFF00',
                      'Bege': '#F5F5DC',
                      'Laranja': '#FFA500',
                    }
                    const hex = colorMap[color] || '#CCCCCC'
                    const isSelected = selectedColors.includes(color)
                    return (
                      <button
                        key={color}
                        title={color}
                        onClick={() => toggleItem(selectedColors, color, setSelectedColors)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-accent scale-110 shadow-sm' : 'border-border hover:border-text-secondary'}`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && <Check className={`w-4 h-4 ${hex === '#FFFFFF' || hex === '#FFFF00' ? 'text-text-primary' : 'text-white'}`} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Opcionais */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Opcionais</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {filterOptions?.optionalItems.slice(0, 15).map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedOptionals.includes(opt) ? 'bg-accent border-accent text-white shadow-sm' : 'border-border group-hover:border-accent bg-bg-alt'}`}>
                        {selectedOptionals.includes(opt) && <Check className="w-3 h-3" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedOptionals.includes(opt)}
                        onChange={() => toggleItem(selectedOptionals, opt, setSelectedOptionals)}
                      />
                      <span className="text-[11px] font-bold text-text-tertiary group-hover:text-text-primary transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent rounded-[24px] p-8 text-center text-white relative overflow-hidden shadow-sm group">
            <Zap className="w-24 h-24 text-white/10 absolute -top-4 -right-4 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
            <h4 className="text-xl font-heading font-black leading-tight mb-2 relative z-10">Quer vender?</h4>
            <p className="text-white/80 text-[11px] font-bold mb-6 relative z-10">Anuncie no marketplace premium que mais cresce no Brasil.</p>
            <button className="w-full bg-white text-text-primary py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-[1.02] transition-all relative z-10">
              Anunciar agora
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1">
        {/* Mobile Filter Trigger & Search Bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-accent transition-colors" />
              <input 
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Busque por marca, modelo ou versão..."
                className="w-full h-14 bg-white rounded-[24px] border border-border pl-14 pr-4 text-sm font-medium shadow-sm outline-none focus:border-accent focus:shadow-md transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(true)}
              className="lg:hidden w-14 h-14 bg-white rounded-[24px] border border-border flex items-center justify-center text-text-tertiary hover:text-accent hover:border-accent transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <div className="hidden lg:block relative group">
              <select 
                value={sort}
                onChange={e => setSort(e.target.value as ListingSort)}
                className="h-14 bg-white rounded-[24px] border border-border pl-6 pr-12 text-xs font-semibold text-text-primary uppercase tracking-wider appearance-none outline-none cursor-pointer shadow-sm min-w-[200px] hover:border-accent focus:border-accent transition-colors"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-hover:text-accent pointer-events-none transition-colors" />
            </div>
          </div>

          {/* Active Chips */}
          <AnimatePresence>
            {activeChips.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                {activeChips.map((chip, idx) => (
                  <motion.button
                    key={chip.label + idx}
                    layout
                    onClick={chip.onRemove}
                    className="bg-white border border-border px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-text-primary hover:bg-bg-alt transition-all shadow-sm"
                  >
                    {chip.label}
                    <X className="w-3 h-3 text-text-secondary" />
                  </motion.button>
                ))}
                <button 
                  onClick={clearFilters}
                  className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-danger px-2 transition-colors"
                >
                  Limpar tudo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent mb-1">Catálogo Premium</p>
            <h2 className="text-3xl font-heading font-black text-text-primary tracking-tight">
              {isSearching ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  Buscando...
                </span>
              ) : (
                `${total} veículos encontrados`
              )}
            </h2>
          </div>
        </div>

        {/* Listings Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${isSearching ? 'opacity-50' : 'opacity-100'}`}>
          {listings.length > 0 ? (
            listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : !isSearching && (
            <div className="col-span-full bg-white rounded-[32px] p-20 text-center border border-border shadow-sm">
              <div className="w-20 h-20 bg-bg-alt rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CarFront className="w-10 h-10 text-text-primary" />
              </div>
              <h3 className="text-2xl font-heading font-black text-text-primary mb-3">Nenhum resultado</h3>
              <p className="text-text-secondary font-medium mb-8 max-w-md mx-auto">Não encontramos veículos com esses filtros. Tente ajustar os parâmetros da busca.</p>
              <button onClick={clearFilters} className="btn btn-primary px-8 py-3">Limpar todos os filtros</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-4">
            <button
              disabled={currentPage <= 1 || isSearching}
              onClick={() => {
                setCurrentPage(currentPage - 1)
                updateResults({ page: currentPage - 1 })
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${currentPage <= 1 ? 'opacity-30 pointer-events-none bg-bg-alt border-transparent' : 'border-border bg-white text-text-primary hover:border-accent hover:text-accent shadow-sm'}`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="px-8 h-14 bg-white rounded-full border border-border flex items-center shadow-sm">
              <span className="font-black text-text-primary tracking-widest">{currentPage} / {totalPages}</span>
            </div>
            <button
              disabled={currentPage >= totalPages || isSearching}
              onClick={() => {
                setCurrentPage(currentPage + 1)
                updateResults({ page: currentPage + 1 })
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${currentPage >= totalPages ? 'opacity-30 pointer-events-none bg-bg-alt border-transparent' : 'border-border bg-white text-text-primary hover:border-accent hover:text-accent shadow-sm'}`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* --- MOBILE FILTERS OVERLAY --- */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] z-[101] max-h-[90vh] overflow-hidden flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-white">
                <h3 className="text-xl font-heading font-black text-text-primary tracking-tight">Filtros</h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-10 h-10 bg-bg-alt rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32">
                {/* Same filter sections as sidebar but optimized for touch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {/* Marcas (Touch) */}
                   <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Marcas</label>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions?.brands.map(brand => (
                        <button 
                          key={brand}
                          onClick={() => toggleItem(selectedBrands, brand, setSelectedBrands)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedBrands.includes(brand) ? 'bg-accent border-accent text-white shadow-sm' : 'bg-bg-alt border-transparent text-text-secondary'}`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preço (Range) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Faixa de Preço</label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-text-tertiary uppercase">Mínimo</span>
                          <input 
                            type="number"
                            value={priceRange[0]}
                            onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                            className="w-full bg-bg-alt border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-text-tertiary uppercase">Máximo</span>
                          <input 
                            type="number"
                            value={priceRange[1]}
                            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="w-full bg-bg-alt border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KM (Mobile) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Quilometragem</label>
                    <div className="bg-bg-alt p-5 rounded-2xl border border-border space-y-4">
                      <input 
                        type="range"
                        min="0"
                        max="300000"
                        step="10000"
                        value={mileageRange[1]}
                        onChange={e => setMileageRange([0, Number(e.target.value)])}
                        className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                       <div className="flex justify-between font-black text-text-primary text-xs">
                         <span className="text-text-tertiary">0 KM</span>
                         <span className="text-accent">ATÉ {mileageRange[1].toLocaleString('pt-BR')} KM</span>
                       </div>
                    </div>
                  </div>

                  {/* Câmbio (Mobile) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Câmbio</label>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions?.transmissions.map(t => (
                        <button 
                          key={t}
                          onClick={() => toggleItem(selectedTransmissions, t, setSelectedTransmissions)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedTransmissions.includes(t) ? 'bg-accent border-accent text-white shadow-sm' : 'bg-bg-alt border-transparent text-text-secondary'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Carroceria (Mobile) */}
                   <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4 block">Carroceria</label>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions?.bodyTypes.map(bt => (
                        <button 
                          key={bt}
                          onClick={() => toggleItem(selectedBodyTypes, bt, setSelectedBodyTypes)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedBodyTypes.includes(bt) ? 'bg-accent border-accent text-white shadow-sm' : 'bg-bg-alt border-transparent text-text-secondary'}`}
                        >
                          {bt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-border flex gap-3">
                <button 
                  onClick={clearFilters}
                  className="h-14 flex-1 bg-bg-alt rounded-xl text-xs font-black uppercase tracking-widest text-text-tertiary hover:text-danger transition-colors"
                >
                  Limpar
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="h-14 flex-[2] bg-accent rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-colors shadow-sm"
                >
                  Ver {total} resultados
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(15, 23, 42, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(15, 23, 42, 0.2);
        }
      `}</style>
    </div>
  )
}
