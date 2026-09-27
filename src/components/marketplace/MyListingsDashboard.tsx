'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Upload, Trash2, Check, AlertCircle, Image as ImageIcon, GripVertical, Star, X, Search, Car, Plus, Filter, Grid, List, Eye, TrendingUp, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { LISTING_ALLOWED_TYPES, LISTING_MAX_IMAGES, LISTING_MAX_IMAGE_SIZE_MB, normalizePlateFinal, parseMoneyInputToNumber, parseBrazilianInt, formatBrazilianInt } from '@/lib/marketplace'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from './MarketplaceListingImage'
import PlateInput from './PlateInput'

interface DashboardImage { id: string; public_url: string; storage_path: string; sort_order: number; is_primary: boolean }
interface DashboardListing { id: string; slug: string; title: string; description: string; vehicle_type?: 'car' | 'truck'; brand: string; model: string; version: string | null; year: number; year_model: number; vin?: string | null; mileage: number; price: number; city: string; state: string; status: string; transmission: string; fuel: string; color: string; body_type: string; optional_items: string[]; engine: string | null; horsepower: number | null; doors: number | null; plate_final: string | null; truck_type?: string | null; load_capacity?: number | null; axles?: number | null; truck_body_type?: string | null; structured_data?: Record<string, unknown> | null; images: DashboardImage[] | null; view_count?: number }
interface UploadImageItem { id: string; file?: File; previewUrl: string; isExisting: boolean; originalImage?: DashboardImage; is_primary: boolean; sort_order: number }

const authH = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' })

const ease = [0.23, 1, 0.32, 1] as const

// Price formatting helpers
const formatPriceDisplay = (value: number | string): string => {
  const num = typeof value === 'string'
    ? parseFloat(value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.'))
    : value
  if (isNaN(num) || num <= 0) return ''
  return Math.round(num).toLocaleString('pt-BR')
}

const parsePriceInput = (input: string): number => {
  const cleaned = input.replace(/\D/g, '')
  if (!cleaned) return 0
  return parseInt(cleaned, 10)
}

// ── StatusBadge ────────────────────────────────────────
function StatusBadge({ status, isSelected = false }: { status: string; isSelected?: boolean }) {
  const l: Record<string, string> = { active: 'Ativo', paused: 'Pausado', sold: 'Vendido', archived: 'Arquivado' }

  const getStyles = () => {
    if (isSelected) {
      return { backgroundColor: 'rgba(0,0,0,0.12)', color: '#0A0A0A' }
    }
    switch (status) {
      case 'active': return { backgroundColor: 'rgba(184,255,0,0.18)', color: '#4D6900' }
      case 'paused': return { backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
      case 'sold': return { backgroundColor: '#F3F4F6', color: '#6B7280' }
      default: return { backgroundColor: 'rgba(184,255,0,0.18)', color: '#4D6900' }
    }
  }

  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold" style={getStyles()}>
      {l[status] || status}
    </span>
  )
}

// ── PhotoGrid ──────────────────────────────────────────
function PhotoGrid({ images, isDragging, onDragEnter, onDragLeave, onDragOver, onDrop, onRemove, onSetPrimary, onReorder, onAdd, onSync, isUploading, pendingUploads, imageError, isDirty }: {
  images: UploadImageItem[]; isDragging: boolean; onDragEnter: (e: React.DragEvent) => void; onDragLeave: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
  onRemove: (id: string) => void; onSetPrimary: (id: string) => void; onReorder: (next: UploadImageItem[]) => void; onAdd: (files: FileList | null) => void; onSync: () => void
  isUploading: boolean; pendingUploads: number; imageError: string | null; isDirty: boolean
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#B8FF00] sm:h-10 sm:w-10">
            <ImageIcon className="h-4 w-4 text-[#0A0A0A] sm:h-5 sm:w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] md:text-[15px] font-bold text-[#1A1A1A] whitespace-nowrap">Fotos do veículo</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Arraste para reordenar. A primeira é a capa.</p>
          </div>
        </div>
        <div className="flex w-full lg:w-auto gap-2">
          <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#F1F1F6] lg:flex-none">
            <Upload className="w-4 h-4" /> Adicionar
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
          </label>
          <button onClick={onSync} disabled={!isDirty || isUploading} className="flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#00A36A] px-5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#008E5D] disabled:cursor-not-allowed disabled:bg-[#DDE9E4] disabled:text-[#557066] lg:flex-none">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
        </div>
      </div>

      <div
        className={`rounded-[22px] border-2 border-dashed transition-all ${isDragging ? 'border-[#B8FF00] bg-[#B8FF00]/10' : 'border-black/10 bg-[#F1F1F6]'}`}
        onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
      >
        {(isUploading || pendingUploads > 0) && (
          <div className="m-4 flex items-center gap-2 rounded-[16px] bg-[#B8FF00]/15 px-4 py-3 text-sm text-[#4D6900]">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isUploading ? 'Enviando fotos...' : `${pendingUploads} foto(s) prontas para salvar`}
          </div>
        )}
        {imageError && (
          <div className="flex items-start gap-2 px-4 py-3 bg-[#DC2626]/5 text-sm text-[#DC2626] m-4 rounded-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {imageError}
          </div>
        )}

        {images.length === 0 ? (
          <label className="block cursor-pointer p-12 text-center transition-colors hover:bg-gray-100 rounded-2xl">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-[14px] font-semibold text-[#0A0A0A] md:text-[15px]">Arraste fotos ou clique para selecionar</p>
            <p className="mt-2 text-sm text-[#5C5C66]">JPG, PNG ou WEBP · até {LISTING_MAX_IMAGES} imagens · máx {LISTING_MAX_IMAGE_SIZE_MB}MB cada</p>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
          </label>
        ) : (
          <Reorder.Group axis="x" values={images} onReorder={onReorder} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {images.map((img) => (
              <Reorder.Item key={img.id} value={img} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing bg-gray-100">
                <img src={img.previewUrl} className="w-full h-full object-cover select-none" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="bg-white/90 p-1.5 rounded-lg"><GripVertical className="w-4 h-4 text-gray-600" /></div>
                    <button onClick={() => onRemove(img.id)} className="w-8 h-8 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-[#DC2626]/90 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => onSetPrimary(img.id)} className={`w-full rounded-full py-2 text-xs font-semibold transition-colors ${img.is_primary ? 'bg-[#B8FF00] text-[#0A0A0A]' : 'bg-white text-[#0A0A0A]'}`}>
                    {img.is_primary ? '✓ Capa' : 'Definir como capa'}
                  </button>
                </div>
                {img.is_primary && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#B8FF00] px-2.5 py-1 text-[10px] font-semibold text-[#0A0A0A]">
                    <Star className="w-3 h-3 fill-current" /> Capa
                  </div>
                )}
                {!img.isExisting && (
                  <div className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0A0A0A]">Novo</div>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}

// ── ListingCard ─────────────────────────────────────────
function ListingCard({ listing, isSelected, onSelect }: { listing: DashboardListing; isSelected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className="w-full rounded-[22px] border p-3 text-left transition-all"
      style={{
        backgroundColor: isSelected ? '#00A36A' : '#FFFFFF',
        borderColor: isSelected ? '#00A36A' : 'rgba(0,0,0,0.08)',
        boxShadow: isSelected ? '0 12px 24px rgba(0,0,0,0.12)' : undefined
      }}
    >
      <div className="flex gap-3">
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[14px]" style={{ backgroundColor: isSelected ? '#B8FF00' : '#F1F1F6' }}>
          <MarketplaceListingImage brand={listing.brand} model={listing.model} year={listing.year_model} imageUrls={listing.images?.map((img) => img.public_url) || []} alt={listing.title} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-xs font-bold text-[#0A0A0A]">{listing.title}</p>
            <StatusBadge status={listing.status} isSelected={isSelected} />
          </div>
          <p className="mt-1 text-sm font-bold text-[#0A0A0A]">{formatBRL(listing.price)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px]" style={{ color: isSelected ? 'rgba(10,10,10,0.7)' : '#6B7280' }}>{listing.year}/{listing.year_model}</span>
            <span className="text-[10px]" style={{ color: isSelected ? 'rgba(10,10,10,0.7)' : '#6B7280' }}>{listing.mileage?.toLocaleString('pt-BR')} km</span>
          </div>
        </div>
      </div>
    </motion.button>
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

  const ic = (f: string, x = '') => `w-full h-11 sm:h-12 px-3 sm:px-4 rounded-[16px] bg-[#F1F1F6] border border-black/[0.06] text-sm text-[#0A0A0A] placeholder-[#6A6A74] focus:outline-none focus:border-[#B8FF00] focus:ring-2 focus:ring-[#B8FF00]/20 transition-all ${x} ${errors[f] ? '!border-[#D94A3A] !text-[#D94A3A]' : ''}`

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-[28px] bg-[#00A36A] p-5 text-[#0A0A0A] sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-6">
        <div className={`flex min-h-10 min-w-0 items-center gap-3 whitespace-nowrap text-sm font-semibold ${saveStatus === 'saving' ? 'text-[#5B3800]' : saveStatus === 'saved' ? 'text-[#0A0A0A]' : saveStatus === 'error' ? 'text-[#8B1E16]' : 'text-[#0A0A0A]'}`}>
          {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : saveStatus === 'saved' ? <Check className="h-4 w-4" /> : saveStatus === 'error' ? <AlertCircle className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-[#0A0A0A]" />}
          {saveStatus === 'saving' ? 'Salvando alterações...' : saveStatus === 'saved' ? 'Alterações salvas' : saveStatus === 'error' ? 'Erro ao salvar' : 'Todas alterações salvas'}
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button onClick={onDelete} disabled={isDeleting} className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/25 px-5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:border-black/15 disabled:text-black/45 sm:min-w-36 sm:flex-none">
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </button>
          <button onClick={onSave} disabled={!isDirty || saveStatus === 'saving'} className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#B8FF00] px-8 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#A9EE00] disabled:cursor-not-allowed disabled:bg-[#DCE5B6] disabled:text-[#4D6900] sm:min-w-48 sm:flex-none">
            <Save className="h-4 w-4" /> Salvar anúncio
          </button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="flex flex-col gap-4 rounded-[28px] bg-[#00A36A] p-4 text-[#0A0A0A] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#B8FF00] sm:h-12 sm:w-12">
                <Eye className="h-5 w-5 text-[#0A0A0A] sm:h-6 sm:w-6" strokeWidth={1.75} />
              </div>
              <div>
                <span className="block text-[14px] font-bold leading-none text-[#0A0A0A] md:text-[15px]">{(listing.view_count || 0).toLocaleString('pt-BR')}</span>
                <span className="mt-1 block text-[11px] text-black/70">visualizações</span>
              </div>
            </div>
          </div>
          <a href={`/anuncios/${listing.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-black/25 px-3 py-2 text-xs font-semibold text-[#0A0A0A] transition-colors hover:bg-black/10 md:px-5 md:py-2.5 md:text-sm">
            Ver ao vivo →
          </a>
        </div>
      </div>

      {/* Plate Input */}
      <PlateInput onPlateFound={(data) => {
        console.log('Plate data received:', data)
        setFormData(prev => {
          const newData = { ...prev }
          
          // Fill in empty fields with plate data
          if (data.brand && !prev.brand) newData.brand = data.brand
          if (data.model && !prev.model) newData.model = data.model
          if (data.year && !prev.year) newData.year = data.year
          if (data.yearModel && !prev.year_model) newData.year_model = data.yearModel
          else if (data.year && !prev.year_model) newData.year_model = data.year
          if (data.color && !prev.color) newData.color = data.color
          if (data.fuel && !prev.fuel) newData.fuel = data.fuel
          if (data.engine && !prev.engine) newData.engine = data.engine
          if (data.transmission && !prev.transmission) newData.transmission = data.transmission
          if (data.bodyType && !prev.body_type) newData.body_type = data.bodyType
          if (data.plate && !prev.plate_final) newData.plate_final = data.plate.slice(-1).toUpperCase()
          
          // Always update title if empty
          if (!prev.title && data.brand && data.model && data.year) {
            newData.title = `${data.brand} ${data.model} ${data.year}`
          }
          
          // Update price if empty or zero
          if (data.fipePrice && (!prev.price || Number(prev.price) === 0)) {
            newData.price = data.fipePrice
          }
          
          console.log('Updated form data:', newData)
          return newData
        })
        setIsDirty(true)
      }} />

      {/* Basic Info */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#B8FF00] sm:h-10 sm:w-10">
            <Car className="h-4 w-4 text-[#0A0A0A] sm:h-5 sm:w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Informações do veículo</h3>
            <p className="text-[11px] sm:text-xs text-gray-500">Dados básicos do anúncio</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-semibold text-[#1A1A1A] mb-1.5 sm:mb-2 block">Título do anúncio</label>
            <input className={ic('title')} value={formData.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Ex: Toyota Corolla 2.0 XEi 2024" />
            {errors.title && <p className="text-sm font-medium text-[#DC2626] mt-2">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Marca</label><input className={ic('brand')} value={formData.brand || ''} onChange={(e) => update('brand', e.target.value)} /></div>
            <div><label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Modelo</label><input className={ic('model')} value={formData.model || ''} onChange={(e) => update('model', e.target.value)} /></div>
            <div><label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Ano Fabricação</label><input type="number" className={ic('year')} value={formData.year || ''} onChange={(e) => update('year', parseBrazilianInt(e.target.value))} /></div>
            <div><label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Ano Modelo</label><input type="number" className={ic('year_model')} value={formData.year_model || ''} onChange={(e) => update('year_model', parseBrazilianInt(e.target.value))} /></div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Status do anúncio</label>
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
      <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#B8FF00] sm:h-10 sm:w-10">
            <TrendingUp className="h-4 w-4 text-[#0A0A0A] sm:h-5 sm:w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Preço e localização</h3>
            <p className="text-[11px] sm:text-xs text-gray-500">Onde está o veículo</p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Preço de venda</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">R$</span>
                <input 
                  className={`${ic('price')} pl-10`} 
                  value={formData.price ? formatPriceDisplay(formData.price) : ''} 
                  onChange={(e) => update('price', parsePriceInput(e.target.value))} 
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              {errors.price && <p className="text-sm font-medium text-[#DC2626] mt-2">{errors.price}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Cidade</label>
              <input className={ic('city')} value={formData.city || ''} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">UF</label>
              <input className={`${ic('state')} text-center font-bold uppercase`} value={formData.state || ''} maxLength={2} onChange={(e) => update('state', e.target.value.toUpperCase())} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Quilometragem (KM)</label>
            <input type="number" className={ic('mileage')} value={formData.mileage ?? ''} onChange={(e) => update('mileage', parseBrazilianInt(e.target.value))} />
            {errors.mileage && <p className="text-sm font-medium text-[#DC2626] mt-2">{errors.mileage}</p>}
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#B8FF00] sm:h-10 sm:w-10">
            <BarChart3 className="h-4 w-4 text-[#0A0A0A] sm:h-5 sm:w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Especificações</h3>
            <p className="text-[11px] sm:text-xs text-gray-500">Detalhes técnicos do veículo</p>
          </div>
        </div>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Câmbio</label>
            <select className={`${ic('transmission')} cursor-pointer`} value={formData.transmission || ''} onChange={(e) => update('transmission', e.target.value)}>
              <option value="Manual">Manual</option>
              <option value="Automático">Automático</option>
              <option value="CVT">CVT</option>
              <option value="DCT">Automático DCT</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Combustível</label>
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
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Motor</label>
            <input className={ic('engine')} value={formData.engine || ''} placeholder="Ex: 2.0 Flex" onChange={(e) => update('engine', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Cor</label>
            <input className={ic('color')} value={formData.color || ''} onChange={(e) => update('color', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Carroceria</label>
            <input className={ic('body_type')} value={formData.body_type || ''} placeholder="Hatch, SUV, Sedan..." onChange={(e) => update('body_type', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Final da placa</label>
            <input className={`${ic('plate_final')} text-center font-bold uppercase`} maxLength={1} value={formData.plate_final || ''} onChange={(e) => update('plate_final', e.target.value.toUpperCase())} />
          </div>
        </div>
         {formData.vehicle_type === 'truck' && (
           <div className="mt-4 grid grid-cols-1 gap-4 rounded-[18px] bg-[#B8FF00]/15 p-4 min-[480px]:grid-cols-2 sm:grid-cols-3">
             {([['truck_type', 'Tipo de caminhão'], ['load_capacity', 'Capacidade (kg)'], ['axles', 'Eixos'], ['truck_body_type', 'Carroceria']] as const).map(([field, label]) => (
               <div key={field}><label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">{label}</label><input type={field === 'load_capacity' || field === 'axles' ? 'number' : 'text'} className={ic(field)} value={formData[field] ?? ''} onChange={(e) => update(field, field === 'load_capacity' || field === 'axles' ? parseBrazilianInt(e.target.value) : e.target.value)} /></div>
             ))}
           </div>
         )}
         <div className="mt-4">
           <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">VIN / Chassi (opcional)</label>
          <input className={`${ic('vin')} uppercase font-mono`} value={formData.vin || ''} maxLength={17} placeholder="Número do chassi (17 caracteres)" onChange={(e) => update('vin', e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))} />
        </div>
      </div>

      {/* Description */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#B8FF00] sm:h-10 sm:w-10">
              <span className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Aa</span>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Descrição</h3>
            <p className="text-[11px] sm:text-xs text-gray-500">Detalhes sobre o veículo</p>
          </div>
        </div>
        <textarea
          className={`min-h-[140px] w-full resize-y rounded-[18px] border border-black/[0.06] bg-[#F1F1F6] p-4 text-sm leading-relaxed text-[#0A0A0A] placeholder-[#6A6A74] transition-all focus:border-[#B8FF00] focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/20 ${errors.description ? '!border-[#D94A3A] !text-[#D94A3A]' : ''}`}
          value={formData.description || ''}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Descreva o estado de conservação, revisões feitas, opcionais e diferenciais do veículo..."
        />
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center mt-3">
          {errors.description ? <p className="text-sm font-medium text-[#DC2626]">{errors.description}</p> : <p className="text-sm text-gray-500">Seja transparente sobre o estado do veículo</p>}
          <p className="text-sm text-gray-400 font-medium">{(formData.description || '').length} caracteres</p>
        </div>
      </div>

      {/* Photos */}
      <PhotoGrid images={localImages} isDragging={isDraggingPhotos} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} onRemove={onImageRemove} onSetPrimary={onImageSetPrimary} onReorder={onImageReorder} onAdd={onImageAdd} onSync={onImageSync} isUploading={isUploading} pendingUploads={pendingUploads} imageError={imageError} isDirty={isDirty} />
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────
export default function MyListingsDashboard({ vehicleType }: { vehicleType?: 'car' | 'truck' } = {}) {
  const router = useRouter()
  const supabaseReady = isSupabaseBrowserConfigured()
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [listings, setListings] = useState<DashboardListing[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loadingListings, setLoadingListings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
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
    if (!supabaseReady) {
      const timer = setTimeout(() => setSessionReady(true), 0)
      return () => clearTimeout(timer)
    }
    let unsub: (() => void) | null = null
    const boot = async () => { const sb = getSupabaseBrowserClient(); const { data } = await sb.auth.getSession(); setIsAuthenticated(!!data.session); setSessionReady(true); const { data: d } = sb.auth.onAuthStateChange((_e: string, s: { access_token?: string } | null) => setIsAuthenticated(!!s)); unsub = () => d.subscription.unsubscribe() }
    void boot(); return () => { unsub?.() }
  }, [supabaseReady])

  const loadListings = useCallback(async (selectFirst = false) => {
     if (!supabaseReady) return; setLoadingListings(true); setGlobalError(null)
     try { const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token) { setGlobalError('Faça login.'); return }; const res = await fetch('/api/marketplace/my-listings', { headers: authH(session.access_token) }); const p = await res.json().catch(() => []); if (!res.ok) throw new Error(p.error || 'Falha ao carregar.'); const list = Array.isArray(p) ? (p as (DashboardListing & { vehicle_type?: string })[]) : []; const filteredList = vehicleType ? list.filter((item) => item.vehicle_type === vehicleType) : list; setListings(filteredList); if (selectFirst && filteredList.length > 0) setSelectedId(filteredList[0].id) }
     catch (err) { setGlobalError(err instanceof Error ? err.message : 'Falha ao carregar.') } finally { setLoadingListings(false) }
  }, [supabaseReady, vehicleType])

  useEffect(() => {
    if (!isAuthenticated) return
    const timer = setTimeout(() => { void loadListings(true) }, 0)
    return () => clearTimeout(timer)
  }, [isAuthenticated, loadListings])

  // Sync form
  useEffect(() => {
    if (!selected) return
    localImages.forEach((img) => { if (!img.isExisting) URL.revokeObjectURL(img.previewUrl) })
    const timer = setTimeout(() => {
      setFormData({ title: selected.title, description: selected.description, vehicle_type: selected.vehicle_type, price: selected.price, vin: selected.vin || '', status: selected.status, mileage: selected.mileage, brand: selected.brand, model: selected.model, version: selected.version, year: selected.year, year_model: selected.year_model, transmission: selected.transmission, fuel: selected.fuel, color: selected.color, body_type: selected.body_type, city: selected.city, state: selected.state, optional_items: selected.optional_items || [], engine: selected.engine, horsepower: selected.horsepower, doors: selected.doors, plate_final: normalizePlateFinal(selected.plate_final), truck_type: selected.truck_type, load_capacity: selected.load_capacity, axles: selected.axles, truck_body_type: selected.truck_body_type, structured_data: selected.structured_data || null })
      setLocalImages((selected.images || []).map((img) => ({ id: img.id, previewUrl: img.public_url, isExisting: true, originalImage: img, is_primary: img.is_primary, sort_order: img.sort_order })).sort((a, b) => a.sort_order - b.sort_order))
      setIsDirty(false); setSaveStatus('idle'); setErrors({})
    }, 0)
    return () => clearTimeout(timer)
  }, [selected?.id])

  useEffect(() => { localImgRef.current = localImages }, [localImages])

  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h) }, [isDirty])

  // Save
  const saveListing = useCallback(async (silent = true) => {
    if (!selected || !isDirty || Object.keys(errors).length > 0) return; if (!silent) setSaveStatus('saving'); else setSaveStatus('saving')
    try {
      const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token) throw new Error('Sessão expirada.')
      // Remove plate_final from data - plate is only used for lookup, not published
      const { plate_final, ...bodyWithoutPlate } = formData
      const body = { ...bodyWithoutPlate, price: typeof formData.price === 'string' ? parseMoneyInputToNumber(formData.price) : Number(formData.price), mileage: formData.mileage ? parseBrazilianInt(formData.mileage) : undefined, year: formData.year ? parseBrazilianInt(formData.year) : undefined, year_model: formData.year_model ? parseBrazilianInt(formData.year_model) : undefined, horsepower: formData.horsepower ? parseBrazilianInt(formData.horsepower) : undefined, doors: formData.doors ? parseBrazilianInt(formData.doors) : undefined }
      const res = await fetch(`/api/marketplace/listings/${selected.id}`, { method: 'PATCH', headers: authH(session.access_token), body: JSON.stringify(body) }); const p = await res.json(); if (!res.ok) throw new Error(p.error || 'Erro ao salvar')
      setSaveStatus('saved'); setIsDirty(false); setListings((prev) => prev.map((l) => l.id === selected.id ? { ...l, ...formData } : l)); setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) { setSaveStatus('error'); setGlobalError(err instanceof Error ? err.message : 'Falha ao salvar.') }
  }, [selected, isDirty, errors, formData])

  useEffect(() => { if (!isDirty) return; const t = setTimeout(() => { void saveListing() }, 2000); return () => clearTimeout(t) }, [formData])

  // Images
  function schedSync(snap: UploadImageItem[] = localImgRef.current) { if (syncTimer.current) clearTimeout(syncTimer.current); syncTimer.current = setTimeout(() => { void syncImages(snap) }, 700) }

  const handleImageSelect = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return; const next = [...localImgRef.current]; const ok: File[] = []; const rej: { name: string; reason: string }[] = []
    Array.from(fileList).forEach((f) => { if (next.length >= LISTING_MAX_IMAGES) { rej.push({ name: f.name, reason: 'Limite' }); return }; if (!LISTING_ALLOWED_TYPES.includes(f.type)) { rej.push({ name: f.name, reason: 'Formato' }); return }; if (f.size > LISTING_MAX_IMAGE_SIZE_MB * 1024 * 1024) { rej.push({ name: f.name, reason: `>${LISTING_MAX_IMAGE_SIZE_MB}MB` }); return }; next.push({ id: `new-${Math.random().toString(36).substr(2, 9)}`, file: f, previewUrl: URL.createObjectURL(f), isExisting: false, is_primary: next.length === 0, sort_order: next.length }); ok.push(f) })
    if (ok.length > 0) { setLocalImages(next); localImgRef.current = next; setIsDirty(true); setPendingUploads(ok.length); setImageError(null); schedSync(next) }
    if (rej.length > 0) { setImageError(rej.map((r) => `${r.name}: ${r.reason}`).join(' · ')); setTimeout(() => setImageError(null), 6000) }
  }, [schedSync])

  const removeImage = useCallback((id: string) => { setLocalImages((prev) => { const n = prev.filter((img) => img.id !== id).map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 })); localImgRef.current = n; return n }); setIsDirty(true); schedSync() }, [])

  const setPrimary = useCallback((id: string) => { setLocalImages((prev) => { const t = prev.find((img) => img.id === id); if (!t) return prev; const n = [t, ...prev.filter((img) => img.id !== id)].map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 })); localImgRef.current = n; return n }); setIsDirty(true); schedSync() }, [])

  const handlePhotosDrag = useCallback((e: React.DragEvent, enter: boolean) => { e.preventDefault(); e.stopPropagation(); if (enter) { dragC.current += 1; if (dragC.current === 1) setIsDraggingPhotos(true) } else { dragC.current = Math.max(0, dragC.current - 1); if (dragC.current === 0) setIsDraggingPhotos(false) } }, [])
  const handlePhotosDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragC.current = 0; setIsDraggingPhotos(false); if (e.dataTransfer.files?.length) handleImageSelect(e.dataTransfer.files) }, [handleImageSelect])

  async function syncImages(snap: UploadImageItem[] = localImgRef.current) {
    if (!selected || isUploading) return; setIsUploading(true); setGlobalError(null); setImageError(null)
    try {
      const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token || !session.user) throw new Error('Sessão expirada.')
      const final: any[] = []; for (let i = 0; i < snap.length; i++) { const item = snap[i]; if (item.isExisting && item.originalImage) { final.push({ ...item.originalImage, sort_order: i, is_primary: i === 0 }); continue }; if (!item.file) continue; const nm = item.file.name.replace(/[^a-zA-Z0-9_.-]/g, '-'); const path = `${session.user.id}/${selected.id}/${String(i + 1).padStart(2, '0')}-${Date.now()}-${nm}`; const { error: ue } = await sb.storage.from('vehicle-listings').upload(path, item.file, { upsert: false, contentType: item.file.type }); if (ue) { setLocalImages((p) => p.filter((img) => img.id !== item.id)); throw new Error(`Upload falhou: ${ue.message}`) }; const { data: ud } = sb.storage.from('vehicle-listings').getPublicUrl(path); final.push({ storage_path: path, public_url: ud.publicUrl, sort_order: i, is_primary: i === 0 }); setPendingUploads((p) => Math.max(0, p - 1)) }
      const res = await fetch(`/api/marketplace/listings/${selected.id}/images`, { method: 'POST', headers: authH(session.access_token), body: JSON.stringify({ images: final }) }); if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(p.error || 'Falha ao salvar fotos') }
      setSaveStatus('saved'); setIsDirty(false); setPendingUploads(0); await loadListings()
    } catch (err) { const msg = err instanceof Error ? err.message : 'Erro ao atualizar fotos'; setGlobalError(msg); setImageError(msg) } finally { setIsUploading(false) }
  }

  const handleDelete = useCallback(async () => {
    if (!selected) return; if (!window.confirm('Excluir este anúncio permanentemente?')) return; setIsDeleting(true)
    try { const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); if (!session?.access_token) throw new Error('Sessão expirada.'); const res = await fetch(`/api/marketplace/listings/${selected.id}`, { method: 'DELETE', headers: authH(session.access_token) }); if (!res.ok) throw new Error('Falha ao excluir'); const next = listings.filter((l) => l.id !== selectedId); setListings(next); setSelectedId(next.length > 0 ? next[0].id : '') }
    catch (err) { setGlobalError(err instanceof Error ? err.message : 'Erro ao excluir') } finally { setIsDeleting(false) }
  }, [selected, listings, selectedId])

  if (!sessionReady) return (
    <div className="min-w-0 space-y-6">
      <div className="h-12 bg-gray-100 rounded-2xl animate-pulse w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
  if (!isAuthenticated) return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />

  const filteredListings = listings.filter((l) => {
    const matchQ = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchQ && (statusFilter === 'all' || l.status === statusFilter)
  })

  return (
    <div className="min-w-0 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#00A36A] p-5 text-[#0A0A0A] md:p-8">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#B8FF00]/30 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">Member inventory</p>
              <h1 className="text-[14px] font-bold tracking-tight text-[#0A0A0A] md:text-[15px]">Meus anúncios</h1>
              <p className="mt-2 font-medium text-[#0A0A0A]">{listings.length} anúncio{listings.length !== 1 ? 's' : ''} encontrado{listings.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => router.push('/anunciar-carro')}
              className="inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-6 py-3 text-sm font-bold text-[#0A0A0A] transition-transform hover:-translate-y-0.5 hover:bg-[#A9EE00]"
            >
              <Plus className="w-5 h-5" />
              Novo anúncio
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-[18px] border border-black/10 bg-white/80 p-3 sm:p-4">
              <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{listings.length}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#0A0A0A] md:text-xs">Total</p>
            </div>
            <div className="rounded-[18px] border border-black/10 bg-white/80 p-3 sm:p-4">
              <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{listings.filter(l => l.status === 'active').length}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#0A0A0A] md:text-xs">Ativos</p>
            </div>
            <div className="rounded-[18px] border border-black/10 bg-white/80 p-3 sm:p-4">
              <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{listings.reduce((sum, l) => sum + (l.view_count || 0), 0)}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#0A0A0A] md:text-xs">Visualizações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[28px] border border-black/[0.06] bg-white p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5C5C66]" />
            <input className="h-12 w-full rounded-full border border-black/[0.06] bg-[#F1F1F6] pl-12 pr-4 text-sm text-[#0A0A0A] placeholder-[#6A6A74] transition-all focus:border-[#B8FF00] focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/20" placeholder="Buscar anúncio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'active', 'paused', 'sold'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className="whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition-all" style={{
                backgroundColor: statusFilter === s ? '#00A36A' : '#F1F1F6',
                color: statusFilter === s ? '#B8FF00' : '#55555D',
                borderColor: statusFilter === s ? '#00A36A' : 'rgba(0,0,0,0.06)'
              }}>
                {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : s === 'paused' ? 'Pausados' : 'Vendidos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-8 items-start">
        {/* Listings List */}
        <div className="space-y-3 xl:sticky xl:top-24 mb-6 xl:mb-0">
          {loadingListings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#B8FF00]">
                <Car className="h-8 w-8 text-[#0A0A0A]" />
              </div>
              <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Nenhum anúncio</p>
              <p className="mb-6 mt-2 text-sm text-[#5C5C66]">Crie seu primeiro anúncio para começar a vender.</p>
              <button
                onClick={() => router.push('/anunciar-carro')}
                className="inline-flex items-center gap-2 rounded-full bg-[#00A36A] px-6 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#008E5D]"
              >
                <Plus className="w-4 h-4" /> Criar anúncio
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  isSelected={selectedId === l.id}
                  onSelect={() => setSelectedId(l.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <main>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease }}
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
                className="rounded-[28px] border border-black/[0.06] bg-white p-16 text-center"
              >
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#B8FF00]">
                  <Car className="h-10 w-10 text-[#0A0A0A]" />
                </div>
                <h2 className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Selecione um anúncio</h2>
                <p className="mx-auto mt-2 max-w-[300px] text-sm text-[#5C5C66]">Escolha um dos seus veículos para editar detalhes, fotos e preço.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Error Toast */}
      {globalError && (
        <div className="fixed bottom-28 lg:bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3.5 bg-[#DC2626] text-white text-sm font-semibold rounded-2xl shadow-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {globalError}
          <button onClick={() => setGlobalError(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px;height:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.05);border-radius:10px}@media(max-width:1024px){.no-scrollbar-mobile::-webkit-scrollbar{display:none}.no-scrollbar-mobile{-ms-overflow-style:none;scrollbar-width:none}}`}</style>
    </div>
  )
}
