'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Loader2, Save, Upload, Trash2, ScanSearch, Check, AlertCircle, Image as ImageIcon, GripVertical, Star, X, Search, Car } from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { LISTING_ALLOWED_TYPES, LISTING_MAX_IMAGES, LISTING_MAX_IMAGE_SIZE_MB, parseMoneyInputToNumber, parseBrazilianInt, formatBrazilianInt } from '@/lib/marketplace'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from './MarketplaceListingImage'
import PlateInput from './PlateInput'

interface DashboardImage { id: string; public_url: string; storage_path: string; sort_order: number; is_primary: boolean }
interface DashboardListing { id: string; slug: string; title: string; description: string; brand: string; model: string; version: string | null; year: number; year_model: number; vin?: string | null; mileage: number; price: number; city: string; state: string; status: string; transmission: string; fuel: string; color: string; body_type: string; optional_items: string[]; engine: string | null; horsepower: number | null; doors: number | null; plate_final: string | null; images: DashboardImage[] | null; view_count?: number }
interface UploadImageItem { id: string; file?: File; previewUrl: string; isExisting: boolean; originalImage?: DashboardImage; is_primary: boolean; sort_order: number }

const authH = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' })

// ── StatusBadge ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = { active: 'bg-green-100 text-green-700', paused: 'bg-yellow-100 text-yellow-700', sold: 'bg-gray-100 text-gray-600' }
  const l: Record<string, string> = { active: 'Ativo', paused: 'Pausado', sold: 'Vendido', archived: 'Arquivado' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${s[status] || s.active}`}>{l[status] || status}</span>
}

// ── PhotoGrid ──────────────────────────────────────────
function PhotoGrid({ images, isDragging, onDragEnter, onDragLeave, onDragOver, onDrop, onRemove, onSetPrimary, onReorder, onAdd, onSync, isUploading, pendingUploads, imageError, isDirty }: {
  images: UploadImageItem[]; isDragging: boolean; onDragEnter: (e: React.DragEvent) => void; onDragLeave: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
  onRemove: (id: string) => void; onSetPrimary: (id: string) => void; onReorder: (next: UploadImageItem[]) => void; onAdd: (files: FileList | null) => void; onSync: () => void
  isUploading: boolean; pendingUploads: number; imageError: string | null; isDirty: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Fotos do veículo</h3>
        <div className="flex gap-2">
          <label className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" /> Adicionar
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
          </label>
          <button onClick={onSync} disabled={!isDirty || isUploading} className="h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 hover:bg-blue-700 transition-colors">
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar
          </button>
        </div>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
        onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
      >
        {(isUploading || pendingUploads > 0) && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-sm text-blue-600 mb-3 mx-3 mt-3 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isUploading ? 'Enviando fotos...' : `${pendingUploads} foto(s) prontas para salvar`}
          </div>
        )}
        {imageError && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 text-sm text-red-600 mb-3 mx-3 mt-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {imageError}
          </div>
        )}

        {images.length === 0 ? (
          <label className="block cursor-pointer p-10 text-center transition-colors hover:bg-gray-100">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">Arraste fotos ou clique para selecionar</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG ou WEBP · até {LISTING_MAX_IMAGES} imagens · máx {LISTING_MAX_IMAGE_SIZE_MB}MB cada</p>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
          </label>
        ) : (
          <Reorder.Group axis="x" values={images} onReorder={onReorder} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
            {images.map((img) => (
              <Reorder.Item key={img.id} value={img} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing bg-gray-200">
                <img src={img.previewUrl} className="w-full h-full object-cover select-none" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="bg-white/90 p-1.5 rounded-lg"><GripVertical className="w-4 h-4 text-gray-600" /></div>
                    <button onClick={() => onRemove(img.id)} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => onSetPrimary(img.id)} className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${img.is_primary ? 'bg-green-500 text-white' : 'bg-white text-gray-900'}`}>
                    {img.is_primary ? '✓ Capa' : 'Definir como capa'}
                  </button>
                </div>
                {img.is_primary && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Capa
                  </div>
                )}
                {!img.isExisting && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold">Novo</div>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}

// ── ListingSidebar ─────────────────────────────────────
function ListingSidebar({ listings, selectedId, onSelect, loading, searchQuery, onSearchChange, statusFilter, onStatusFilterChange }: {
  listings: DashboardListing[]; selectedId: string; onSelect: (id: string) => void; loading: boolean
  searchQuery: string; onSearchChange: (q: string) => void; statusFilter: string; onStatusFilterChange: (s: string) => void
}) {
  const filtered = useMemo(() => listings.filter((l) => {
    const matchQ = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchQ && (statusFilter === 'all' || l.status === statusFilter)
  }), [listings, searchQuery, statusFilter])

  return (
    <aside className="bg-white rounded-2xl border border-gray-200 p-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Meus anúncios</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filtered.length}</span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full h-10 pl-10 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Buscar anúncio..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 mb-4">
        {(['all', 'active', 'paused', 'sold'] as const).map((s) => (
          <button key={s} onClick={() => onStatusFilterChange(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
            {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : s === 'paused' ? 'Pausados' : 'Vendidos'}
          </button>
        ))}
      </div>
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-280px)] pb-2 lg:pb-0 custom-scrollbar no-scrollbar-mobile">
        {loading ? [1, 2, 3].map((i) => <div key={i} className="min-w-[220px] lg:w-full h-20 bg-gray-100 rounded-xl animate-pulse" />)
         : filtered.length === 0 ? (
          <div className="w-full p-8 text-center rounded-xl bg-gray-50 border border-gray-200">
            <Car className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">Nenhum anúncio</p>
            <p className="text-xs text-gray-400 mt-1">Crie seu primeiro anúncio</p>
          </div>
         ) : filtered.map((l) => (
          <button key={l.id} onClick={() => onSelect(l.id)} className={`min-w-[220px] lg:w-full text-left p-3 rounded-xl transition-all flex-shrink-0 border ${selectedId === l.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <MarketplaceListingImage brand={l.brand} model={l.model} year={l.year_model} imageUrls={l.images?.map((img) => img.public_url) || []} alt={l.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${selectedId === l.id ? 'text-blue-900' : 'text-gray-900'}`}>{l.title}</p>
                <p className={`text-xs mt-0.5 ${selectedId === l.id ? 'text-blue-600' : 'text-gray-500'}`}>{formatBRL(l.price)}</p>
                <StatusBadge status={l.status} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}

// ── ListingEditor ──────────────────────────────────────
function ListingEditor({ listing, formData, setFormData, errors, setErrors, isDirty, setIsDirty, saveStatus, onSave, onDelete, isDeleting, localImages, onImageRemove, onImageSetPrimary, onImageReorder, onImageAdd, onImageSync, isUploading, pendingUploads, imageError, isDraggingPhotos, onDragEnter, onDragLeave, onDragOver, onDrop }: {
  listing: DashboardListing; formData: Partial<DashboardListing>; setFormData: (fn: (p: Partial<DashboardListing>) => Partial<DashboardListing>) => void
  errors: Record<string, string>; setErrors: (e: Record<string, string>) => void; isDirty: boolean; setIsDirty: (d: boolean) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'; onSave: () => void; onDelete: () => void; isDeleting: boolean
  localImages: UploadImageItem[]; onImageRemove: (id: string) => void; onImageSetPrimary: (id: string) => void; onImageReorder: (next: UploadImageItem[]) => void
  onImageAdd: (files: FileList | null) => void; onImageSync: () => void; isUploading: boolean; pendingUploads: number; imageError: string | null
  isDraggingPhotos: boolean; onDragEnter: (e: React.DragEvent) => void; onDragLeave: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
}) {
  const update = useCallback((field: keyof DashboardListing, value: unknown) => {
    setFormData((p) => ({ ...p, [field]: value })); setIsDirty(true)
    const next = { ...errors }
    if (field === 'price' && (Number(value) <= 0 || isNaN(Number(value)))) next.price = 'Preço deve ser maior que zero'
    else if (field === 'title' && String(value).length < 5) next.title = 'Mín. 5 caracteres'
    else if (field === 'description' && String(value).length < 10) next.description = 'Mín. 10 caracteres'
    else if (field === 'mileage' && Number(value) < 0) next.mileage = 'KM inválida'
    else delete next[field]
    setErrors(next)
  }, [errors, setFormData, setIsDirty, setErrors])

  const ic = (f: string, x = '') => `w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all ${x} ${errors[f] ? '!border-red-500 text-red-600' : ''}`

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`flex items-center gap-2 text-sm font-medium ${saveStatus === 'saving' ? 'text-amber-600' : saveStatus === 'saved' ? 'text-green-600' : saveStatus === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
          {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-4 h-4" /> : saveStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-green-500" />}
          {saveStatus === 'saving' ? 'Salvando alterações...' : saveStatus === 'saved' ? 'Alterações salvas' : saveStatus === 'error' ? 'Erro ao salvar' : 'Todas alterações salvas'}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDelete} disabled={isDeleting} className="h-10 px-4 rounded-xl border border-gray-200 flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40" title="Excluir anúncio">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Excluir
          </button>
          <button onClick={onSave} disabled={!isDirty || saveStatus === 'saving'} className="h-10 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-40 shadow-lg shadow-blue-600/20">
            <Save className="w-4 h-4" /> Salvar anúncio
          </button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-900 block">{(listing.view_count || 0).toLocaleString('pt-BR')}</span>
            <span className="text-xs text-gray-500">visualizações</span>
          </div>
        </div>
        <a href={`/anuncios/${listing.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
          Ver anúncio ao vivo →
        </a>
      </div>

      {/* Plate Auto-Fill Lookup */}
      <PlateInput onPlateFound={(data) => {
        setFormData(prev => ({
          ...prev,
          brand: data.brand || prev.brand,
          model: data.model || prev.model,
          year: data.year || prev.year,
          year_model: data.yearModel || data.year || prev.year_model,
          color: data.color || prev.color,
          fuel: data.fuel || prev.fuel,
          engine: data.engine || prev.engine,
          transmission: data.transmission || prev.transmission,
          body_type: data.bodyType || prev.body_type,
          plate_final: data.plate ? data.plate.slice(-1).toUpperCase() : prev.plate_final,
          price: data.fipePrice && (!prev.price || Number(prev.price) === 0) ? data.fipePrice : prev.price,
          title: data.brand && data.model && data.year ? `${data.brand} ${data.model} ${data.year}` : (prev.title || ''),
        }))
        setIsDirty(true)
      }} />

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Informações básicas</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Título do anúncio</label>
            <input className={ic('title')} value={formData.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Ex: Toyota Corolla 2.0 XEi 2024" />
            {errors.title && <p className="text-xs font-medium text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Marca</label><input className={ic('brand')} value={formData.brand || ''} onChange={(e) => update('brand', e.target.value)} /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Modelo</label><input className={ic('model')} value={formData.model || ''} onChange={(e) => update('model', e.target.value)} /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Ano Fabricação</label><input type="number" className={ic('year')} value={formData.year || ''} onChange={(e) => update('year', parseBrazilianInt(e.target.value))} /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Ano Modelo</label><input type="number" className={ic('year_model')} value={formData.year_model || ''} onChange={(e) => update('year_model', parseBrazilianInt(e.target.value))} /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Status do anúncio</label>
            <select className={`${ic('status')} cursor-pointer`} value={formData.status || 'active'} onChange={(e) => update('status', e.target.value)}>
              <option value="active">Ativo (visível no site)</option>
              <option value="paused">Pausado (oculto temporariamente)</option>
              <option value="sold">Vendido</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Price & Location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Preço e localização</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Preço (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">R$</span>
                <input className={`${ic('price')} pl-10`} value={formData.price ?? ''} onChange={(e) => update('price', e.target.value)} placeholder="0,00" />
              </div>
              {errors.price && <p className="text-xs font-medium text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Cidade</label>
              <input className={ic('city')} value={formData.city || ''} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">UF</label>
              <input className={`${ic('state')} text-center font-bold uppercase`} value={formData.state || ''} maxLength={2} onChange={(e) => update('state', e.target.value.toUpperCase())} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Quilometragem (KM)</label>
            <input type="number" className={ic('mileage')} value={formData.mileage ?? ''} onChange={(e) => update('mileage', parseBrazilianInt(e.target.value))} />
            {errors.mileage && <p className="text-xs font-medium text-red-500 mt-1">{errors.mileage}</p>}
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Especificações do veículo</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Câmbio</label>
            <select className={`${ic('transmission')} cursor-pointer`} value={formData.transmission || ''} onChange={(e) => update('transmission', e.target.value)}>
              <option value="Manual">Manual</option>
              <option value="Automático">Automático</option>
              <option value="CVT">CVT</option>
              <option value="DCT">Automático DCT</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Combustível</label>
            <select className={`${ic('fuel')} cursor-pointer`} value={formData.fuel || ''} onChange={(e) => update('fuel', e.target.value)}>
              <option value="Flex">Flex</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Etanol">Etanol</option>
              <option value="Diesel">Diesel</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Elétrico">Elétrico</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Motor</label>
            <input className={ic('engine')} value={formData.engine || ''} placeholder="Ex: 2.0 Flex" onChange={(e) => update('engine', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Cor</label>
            <input className={ic('color')} value={formData.color || ''} onChange={(e) => update('color', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Carroceria</label>
            <input className={ic('body_type')} value={formData.body_type || ''} placeholder="Hatch, SUV, Sedan..." onChange={(e) => update('body_type', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Final da placa</label>
            <input className={`${ic('plate_final')} text-center font-bold uppercase`} maxLength={1} value={formData.plate_final || ''} onChange={(e) => update('plate_final', e.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">VIN / Chassi (opcional)</label>
          <input className={`${ic('vin')} uppercase font-mono`} value={formData.vin || ''} maxLength={17} placeholder="Número do chassi (17 caracteres)" onChange={(e) => update('vin', e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))} />
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Descrição do veículo</h3>
        <textarea
          className={`w-full min-h-[120px] p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-y leading-relaxed ${errors.description ? 'border-red-500 text-red-600' : ''}`}
          value={formData.description || ''}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Descreva o estado de conservação, revisões feitas, opcionais e diferenciais do veículo..."
        />
        <div className="flex justify-between items-center mt-2">
          {errors.description ? <p className="text-xs font-medium text-red-500">{errors.description}</p> : <p className="text-xs text-gray-500">Seja transparente sobre o estado do veículo</p>}
          <p className="text-xs text-gray-400">{(formData.description || '').length} caracteres</p>
        </div>
      </div>

      {/* Photos */}
      <PhotoGrid images={localImages} isDragging={isDraggingPhotos} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} onRemove={onImageRemove} onSetPrimary={onImageSetPrimary} onReorder={onImageReorder} onAdd={onImageAdd} onSync={onImageSync} isUploading={isUploading} pendingUploads={pendingUploads} imageError={imageError} isDirty={isDirty} />
    </div>
  )
}

// ── Main ───────────────────────────────────────────────
export default function MyListingsDashboard() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [listings, setListings] = useState<DashboardListing[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loadingListings, setLoadingListings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState<Partial<DashboardListing>>({})
  const [localImages, setLocalImages] = useState<UploadImageItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [isUploading, setIsUploading] = useState(false)
  const [pendingUploads, setPendingUploads] = useState(0)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localImgRef = useRef<UploadImageItem[]>([])
  const dragC = useRef(0)
  const selected = useMemo(() => listings.find((l) => l.id === selectedId) || null, [listings, selectedId])

  // Auth
  useEffect(() => {
    if (!supabaseReady) { setSessionReady(true); return }
    let unsub: (() => void) | null = null
    const boot = async () => { const sb = getSupabaseBrowserClient(); const { data } = await sb.auth.getSession(); setIsAuthenticated(!!data.session); setSessionReady(true); const { data: d } = sb.auth.onAuthStateChange((_e: string, s: { access_token?: string } | null) => setIsAuthenticated(!!s)); unsub = () => d.subscription.unsubscribe() }
    void boot(); return () => { unsub?.() }
  }, [supabaseReady])

  const loadListings = useCallback(async (selectFirst = false) => {
    if (!supabaseReady) return; setLoadingListings(true); setGlobalError(null)
    try { const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token) { setGlobalError('Faça login.'); return }; const res = await fetch('/api/marketplace/my-listings', { headers: authH(session.access_token) }); const p = await res.json().catch(() => []); if (!res.ok) throw new Error(p.error || 'Falha ao carregar.'); const list = Array.isArray(p) ? (p as DashboardListing[]) : []; setListings(list); if (selectFirst && list.length > 0) setSelectedId(list[0].id) }
    catch (err) { setGlobalError(err instanceof Error ? err.message : 'Falha ao carregar.') } finally { setLoadingListings(false) }
  }, [supabaseReady])

  useEffect(() => { if (isAuthenticated) void loadListings(true) }, [isAuthenticated, loadListings])

  // Sync form
  useEffect(() => {
    if (!selected) return; localImages.forEach((img) => { if (!img.isExisting) URL.revokeObjectURL(img.previewUrl) })
    setFormData({ title: selected.title, description: selected.description, price: selected.price, vin: selected.vin || '', status: selected.status, mileage: selected.mileage, brand: selected.brand, model: selected.model, version: selected.version, year: selected.year, year_model: selected.year_model, transmission: selected.transmission, fuel: selected.fuel, color: selected.color, body_type: selected.body_type, city: selected.city, state: selected.state, optional_items: selected.optional_items || [], engine: selected.engine, horsepower: selected.horsepower, doors: selected.doors, plate_final: selected.plate_final })
    setLocalImages((selected.images || []).map((img) => ({ id: img.id, previewUrl: img.public_url, isExisting: true, originalImage: img, is_primary: img.is_primary, sort_order: img.sort_order })).sort((a, b) => a.sort_order - b.sort_order))
    setIsDirty(false); setSaveStatus('idle'); setErrors({})
  }, [selected?.id])

  useEffect(() => { localImgRef.current = localImages }, [localImages])

  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h) }, [isDirty])

  // Save
  const saveListing = useCallback(async (silent = true) => {
    if (!selected || !isDirty || Object.keys(errors).length > 0) return; if (!silent) setSaveStatus('saving'); else setSaveStatus('saving')
    try {
      const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token) throw new Error('Sessão expirada.')
      const body = { ...formData, price: typeof formData.price === 'string' ? parseMoneyInputToNumber(formData.price) : Number(formData.price), mileage: formData.mileage ? parseBrazilianInt(formData.mileage) : undefined, year: formData.year ? parseBrazilianInt(formData.year) : undefined, year_model: formData.year_model ? parseBrazilianInt(formData.year_model) : undefined, horsepower: formData.horsepower ? parseBrazilianInt(formData.horsepower) : undefined, doors: formData.doors ? parseBrazilianInt(formData.doors) : undefined }
      const res = await fetch(`/api/marketplace/listings/${selected.id}`, { method: 'PATCH', headers: authH(session.access_token), body: JSON.stringify(body) }); const p = await res.json(); if (!res.ok) throw new Error(p.error || 'Erro ao salvar')
      setSaveStatus('saved'); setIsDirty(false); setListings((prev) => prev.map((l) => l.id === selected.id ? { ...l, ...formData } : l)); setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) { setSaveStatus('error'); setGlobalError(err instanceof Error ? err.message : 'Falha ao salvar.') }
  }, [selected, isDirty, errors, formData])

  useEffect(() => { if (!isDirty) return; const t = setTimeout(() => { void saveListing() }, 2000); return () => clearTimeout(t) }, [formData])

  // Images
  const handleImageSelect = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return; const next = [...localImgRef.current]; const ok: File[] = []; const rej: { name: string; reason: string }[] = []
    Array.from(fileList).forEach((f) => { if (next.length >= LISTING_MAX_IMAGES) { rej.push({ name: f.name, reason: 'Limite' }); return }; if (!LISTING_ALLOWED_TYPES.includes(f.type)) { rej.push({ name: f.name, reason: 'Formato' }); return }; if (f.size > LISTING_MAX_IMAGE_SIZE_MB * 1024 * 1024) { rej.push({ name: f.name, reason: `>${LISTING_MAX_IMAGE_SIZE_MB}MB` }); return }; next.push({ id: `new-${Math.random().toString(36).substr(2, 9)}`, file: f, previewUrl: URL.createObjectURL(f), isExisting: false, is_primary: next.length === 0, sort_order: next.length }); ok.push(f) })
    if (ok.length > 0) { setLocalImages(next); localImgRef.current = next; setIsDirty(true); setPendingUploads(ok.length); setImageError(null); schedSync(next) }
    if (rej.length > 0) { setImageError(rej.map((r) => `${r.name}: ${r.reason}`).join(' · ')); setTimeout(() => setImageError(null), 6000) }
  }, [])

  const schedSync = useCallback((snap: UploadImageItem[] = localImgRef.current) => { if (syncTimer.current) clearTimeout(syncTimer.current); syncTimer.current = setTimeout(() => { void syncImages(snap) }, 700) }, [])

  const removeImage = useCallback((id: string) => { setLocalImages((prev) => { const n = prev.filter((img) => img.id !== id).map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 })); localImgRef.current = n; return n }); setIsDirty(true); schedSync() }, [])

  const setPrimary = useCallback((id: string) => { setLocalImages((prev) => { const t = prev.find((img) => img.id === id); if (!t) return prev; const n = [t, ...prev.filter((img) => img.id !== id)].map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 })); localImgRef.current = n; return n }); setIsDirty(true); schedSync() }, [])

  const handlePhotosDrag = useCallback((e: React.DragEvent, enter: boolean) => { e.preventDefault(); e.stopPropagation(); if (enter) { dragC.current += 1; if (dragC.current === 1) setIsDraggingPhotos(true) } else { dragC.current = Math.max(0, dragC.current - 1); if (dragC.current === 0) setIsDraggingPhotos(false) } }, [])
  const handlePhotosDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragC.current = 0; setIsDraggingPhotos(false); if (e.dataTransfer.files?.length) handleImageSelect(e.dataTransfer.files) }, [handleImageSelect])

  const syncImages = useCallback(async (snap: UploadImageItem[] = localImgRef.current) => {
    if (!selected || isUploading) return; setIsUploading(true); setGlobalError(null); setImageError(null)
    try {
      const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token || !session.user) throw new Error('Sessão expirada.')
      const final: any[] = []; for (let i = 0; i < snap.length; i++) { const item = snap[i]; if (item.isExisting && item.originalImage) { final.push({ ...item.originalImage, sort_order: i, is_primary: i === 0 }); continue }; if (!item.file) continue; const nm = item.file.name.replace(/[^a-zA-Z0-9_.-]/g, '-'); const path = `${session.user.id}/${selected.id}/${String(i + 1).padStart(2, '0')}-${Date.now()}-${nm}`; const { error: ue } = await sb.storage.from('vehicle-listings').upload(path, item.file, { upsert: false, contentType: item.file.type }); if (ue) { setLocalImages((p) => p.filter((img) => img.id !== item.id)); throw new Error(`Upload falhou: ${ue.message}`) }; const { data: ud } = sb.storage.from('vehicle-listings').getPublicUrl(path); final.push({ storage_path: path, public_url: ud.publicUrl, sort_order: i, is_primary: i === 0 }); setPendingUploads((p) => Math.max(0, p - 1)) }
      const res = await fetch(`/api/marketplace/listings/${selected.id}/images`, { method: 'POST', headers: authH(session.access_token), body: JSON.stringify({ images: final }) }); if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(p.error || 'Falha ao salvar fotos') }
      setSaveStatus('saved'); setIsDirty(false); setPendingUploads(0); await loadListings()
    } catch (err) { const msg = err instanceof Error ? err.message : 'Erro ao atualizar fotos'; setGlobalError(msg); setImageError(msg) } finally { setIsUploading(false) }
  }, [selected, isUploading, loadListings])

  const handleDelete = useCallback(async () => {
    if (!selected) return; if (!window.confirm('Excluir este anúncio permanentemente?')) return; setIsDeleting(true)
    try { const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token) throw new Error('Sessão expirada.'); const res = await fetch(`/api/marketplace/listings/${selected.id}`, { method: 'DELETE', headers: authH(session.access_token) }); if (!res.ok) throw new Error('Falha ao excluir'); const next = listings.filter((l) => l.id !== selectedId); setListings(next); setSelectedId(next.length > 0 ? next[0].id : '') }
    catch (err) { setGlobalError(err instanceof Error ? err.message : 'Erro ao excluir') } finally { setIsDeleting(false) }
  }, [selected, listings, selectedId])



  if (!sessionReady) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
    </div>
  )
  if (!isAuthenticated) return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />

  return (
    <div className="space-y-6">
      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1A1A1A]">Meus anúncios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{listings.length} anúncio{listings.length !== 1 ? 's' : ''} encontrado{listings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
      <ListingSidebar
        listings={listings}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loadingListings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <main>
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ListingEditor
                listing={selected}
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
                isDirty={isDirty}
                setIsDirty={setIsDirty}
                saveStatus={saveStatus}
                onSave={() => void saveListing(false)}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                localImages={localImages}
                onImageRemove={removeImage}
                onImageSetPrimary={setPrimary}
                onImageReorder={(next) => { setLocalImages(next); localImgRef.current = next; setIsDirty(true); schedSync(next) }}
                onImageAdd={handleImageSelect}
                onImageSync={() => void syncImages()}
                isUploading={isUploading}
                pendingUploads={pendingUploads}
                imageError={imageError}
                isDraggingPhotos={isDraggingPhotos}
                onDragEnter={(e) => handlePhotosDrag(e, true)}
                onDragLeave={(e) => handlePhotosDrag(e, false)}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={handlePhotosDrop}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Car className="h-5 w-5 text-gray-400" />
              </div>
              <h2 className="text-sm font-medium text-[#1A1A1A]">Selecione um anúncio</h2>
              <p className="mt-1 text-xs text-gray-400 max-w-[240px]">
                Edite detalhes, fotos e preço do seu veículo.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {globalError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] lg:bottom-6 bg-red-600 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {globalError}
          <button onClick={() => setGlobalError(null)} className="ml-2 opacity-60 hover:opacity-100" aria-label="Fechar">
            ✕
          </button>
        </div>
      )}
      </div>

      <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px;height:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.05);border-radius:10px}@media(max-width:1024px){.no-scrollbar-mobile::-webkit-scrollbar{display:none}.no-scrollbar-mobile{-ms-overflow-style:none;scrollbar-width:none}}`}</style>
    </div>
  )
}
