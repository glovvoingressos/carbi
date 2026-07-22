'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Loader2, Save, Upload, Trash2, ScanSearch, Check, AlertCircle, Image as ImageIcon, GripVertical, Star, X, Search, Car } from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { LISTING_ALLOWED_TYPES, LISTING_MAX_IMAGES, LISTING_MAX_IMAGE_SIZE_MB, parseMoneyInputToNumber, parseBrazilianInt, formatBrazilianInt } from '@/lib/marketplace'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from './MarketplaceListingImage'

interface DashboardImage { id: string; public_url: string; storage_path: string; sort_order: number; is_primary: boolean }
interface DashboardListing { id: string; slug: string; title: string; description: string; brand: string; model: string; version: string | null; year: number; year_model: number; vin?: string | null; mileage: number; price: number; city: string; state: string; status: string; transmission: string; fuel: string; color: string; body_type: string; optional_items: string[]; engine: string | null; horsepower: number | null; doors: number | null; plate_final: string | null; images: DashboardImage[] | null; view_count?: number }
interface UploadImageItem { id: string; file?: File; previewUrl: string; isExisting: boolean; originalImage?: DashboardImage; is_primary: boolean; sort_order: number }

const authH = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' })

// ── StatusBadge ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', paused: 'bg-amber-50 text-amber-700 border-amber-200', sold: 'bg-gray-100 text-gray-500 border-gray-200' }
  const l: Record<string, string> = { active: 'Ativo', paused: 'Pausado', sold: 'Vendido', archived: 'Arquivado' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s[status] || s.active}`}>{l[status] || status}</span>
}

// ── PhotoGrid ──────────────────────────────────────────
function PhotoGrid({ images, isDragging, onDragEnter, onDragLeave, onDragOver, onDrop, onRemove, onSetPrimary, onReorder, onAdd, onSync, isUploading, pendingUploads, imageError, isDirty }: {
  images: UploadImageItem[]; isDragging: boolean; onDragEnter: (e: React.DragEvent) => void; onDragLeave: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
  onRemove: (id: string) => void; onSetPrimary: (id: string) => void; onReorder: (next: UploadImageItem[]) => void; onAdd: (files: FileList | null) => void; onSync: () => void
  isUploading: boolean; pendingUploads: number; imageError: string | null; isDirty: boolean
}) {
  return (
    <div className={`bg-white p-5 rounded-2xl border transition-colors ${isDragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/20' : 'border-[var(--color-border-strong)]'}`}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      <div className="flex items-center justify-between mb-4">
        <div><h3 className="font-heading font-bold text-[var(--color-text-primary)]">Fotos</h3><p className="text-xs text-[var(--color-text-tertiary)]">Arraste para reordenar. A primeira é capa.</p></div>
        <div className="flex gap-2">
          <label className="h-8 px-3 rounded-full bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-[var(--color-border)]">
            <Upload className="w-3 h-3" /> Adicionar
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
          </label>
          <button onClick={onSync} disabled={!isDirty || isUploading} className="h-8 px-4 rounded-full bg-[var(--color-text-primary)] text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-40">
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
          </button>
        </div>
      </div>
      {(isUploading || pendingUploads > 0) && <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-info-bg)] text-xs text-[var(--color-text-primary)] mb-3"><Loader2 className="w-3 h-3 animate-spin text-[var(--color-info)]" />{isUploading ? 'Enviando fotos…' : `${pendingUploads} foto(s) prontas`}</div>}
      {imageError && <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--color-danger-bg)] text-xs text-[var(--color-danger)] mb-3"><AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {imageError}</div>}
      {images.length === 0 ? (
        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] p-6 text-center transition-colors hover:border-[var(--color-accent)]">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[var(--color-text-disabled)]" />
          <p className="text-sm font-bold text-[var(--color-text-primary)]">Arraste fotos ou clique para selecionar</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">JPG, PNG ou WEBP · até {LISTING_MAX_IMAGES} · máx {LISTING_MAX_IMAGE_SIZE_MB}MB</p>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
        </label>
      ) : (
        <Reorder.Group axis="x" values={images} onReorder={onReorder} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <Reorder.Item key={img.id} value={img} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing border border-[var(--color-border)] bg-[var(--color-bg)]">
              <img src={img.previewUrl} className="w-full h-full object-cover select-none" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="bg-white/90 p-1 rounded-md"><GripVertical className="w-3 h-3 text-[var(--color-text-tertiary)]" /></div>
                  <button onClick={() => onRemove(img.id)} className="w-8 h-8 bg-[var(--color-danger)] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                </div>
                <button onClick={() => onSetPrimary(img.id)} className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${img.is_primary ? 'bg-[var(--color-success)] text-white' : 'bg-white text-[var(--color-text-primary)]'}`}>
                  {img.is_primary ? 'Capa' : 'Definir Capa'}
                </button>
              </div>
              {img.is_primary && <div className="absolute top-1.5 left-1.5 bg-[var(--color-success)] text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" /> Capa</div>}
              {!img.isExisting && <div className="absolute top-1.5 right-1.5 bg-[var(--color-accent)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">Novo</div>}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
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
    <aside className="space-y-3 lg:sticky lg:top-24">
      <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] px-1">Anúncios ({filtered.length})</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-disabled)]" />
        <input className="w-full h-10 pl-9 pr-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] transition-colors" placeholder="Buscar anúncio…" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
      <div className="flex gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {(['all', 'active', 'paused', 'sold'] as const).map((s) => (
          <button key={s} onClick={() => onStatusFilterChange(s)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border ${statusFilter === s ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)]' : 'bg-white text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
            {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : s === 'paused' ? 'Pausados' : 'Vendidos'}
          </button>
        ))}
      </div>
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-220px)] pb-2 lg:pb-0 custom-scrollbar no-scrollbar-mobile">
        {loading ? [1, 2, 3].map((i) => <div key={i} className="min-w-[200px] lg:w-full h-20 bg-white rounded-xl animate-pulse" />)
         : filtered.length === 0 ? <div className="w-full p-6 text-center rounded-xl bg-white border border-[var(--color-border)]"><Car className="w-8 h-8 mx-auto text-[var(--color-text-disabled)] mb-2" /><p className="text-xs font-bold text-[var(--color-text-tertiary)]">Nenhum anúncio</p></div>
         : filtered.map((l) => (
          <button key={l.id} onClick={() => onSelect(l.id)} className={`min-w-[220px] lg:w-full text-left p-3 rounded-xl border transition-all flex-shrink-0 ${selectedId === l.id ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] shadow-lg' : 'bg-white border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--color-bg)]">
                <MarketplaceListingImage brand={l.brand} model={l.model} year={l.year_model} imageUrls={l.images?.map((img) => img.public_url) || []} alt={l.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-bold truncate ${selectedId === l.id ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>{l.title}</p>
                  <StatusBadge status={l.status} />
                </div>
                <p className={`text-xs font-bold mt-0.5 ${selectedId === l.id ? 'text-white/60' : 'text-[var(--color-text-secondary)]'}`}>{formatBRL(l.price)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}

// ── ListingEditor ──────────────────────────────────────
function ListingEditor({ listing, formData, setFormData, errors, setErrors, isDirty, setIsDirty, saveStatus, onSave, onDelete, isDeleting, isBlurring, onBlurPlates, localImages, onImageRemove, onImageSetPrimary, onImageReorder, onImageAdd, onImageSync, isUploading, pendingUploads, imageError, isDraggingPhotos, onDragEnter, onDragLeave, onDragOver, onDrop }: {
  listing: DashboardListing; formData: Partial<DashboardListing>; setFormData: (fn: (p: Partial<DashboardListing>) => Partial<DashboardListing>) => void
  errors: Record<string, string>; setErrors: (e: Record<string, string>) => void; isDirty: boolean; setIsDirty: (d: boolean) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'; onSave: () => void; onDelete: () => void; isDeleting: boolean; isBlurring: boolean; onBlurPlates: () => void
  localImages: UploadImageItem[]; onImageRemove: (id: string) => void; onImageSetPrimary: (id: string) => void; onImageReorder: (next: UploadImageItem[]) => void
  onImageAdd: (files: FileList | null) => void; onImageSync: () => void; isUploading: boolean; pendingUploads: number; imageError: string | null
  isDraggingPhotos: boolean; onDragEnter: (e: React.DragEvent) => void; onDragLeave: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
}) {
  const update = useCallback((field: keyof DashboardListing, value: unknown) => {
    setFormData((p) => ({ ...p, [field]: value })); setIsDirty(true)
    const next = { ...errors }
    if (field === 'price' && (Number(value) <= 0 || isNaN(Number(value)))) next.price = 'Preço deve ser maior que zero'
    else if (field === 'title' && String(value).length < 8) next.title = 'Mín. 8 caracteres'
    else if (field === 'description' && String(value).length < 20) next.description = 'Mín. 20 caracteres'
    else if (field === 'mileage' && Number(value) < 0) next.mileage = 'KM inválida'
    else delete next[field]
    setErrors(next)
  }, [errors, setFormData, setIsDirty, setErrors])

  const ic = (f: string, x = '') => `w-full h-11 px-4 rounded-xl bg-[var(--color-bg)] border-2 border-transparent font-bold text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors ${x} ${errors[f] ? '!border-[var(--color-danger)]/20 text-[var(--color-danger)]' : ''}`

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[var(--color-border-strong)] rounded-xl px-4 py-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${saveStatus === 'saving' ? 'bg-[var(--color-info-bg)] text-[var(--color-info)]' : saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600' : saveStatus === 'error' ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : 'bg-[var(--color-bg)] text-[var(--color-text-tertiary)]'}`}>
          {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-3 h-3" /> : saveStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-current opacity-30" />}
          {saveStatus === 'saving' ? 'Salvando…' : saveStatus === 'saved' ? 'Salvo' : saveStatus === 'error' ? 'Erro' : 'Tudo salvo'}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSave} disabled={!isDirty || saveStatus === 'saving'} className="h-9 px-5 rounded-full bg-[var(--color-text-primary)] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"><Save className="w-3.5 h-3.5" /> Salvar</button>
          <button onClick={onDelete} disabled={isDeleting} className="h-10 w-10 rounded-full border border-[var(--color-danger)] flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Excluir">
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border border-[var(--color-border-strong)] rounded-xl px-5 py-4 flex items-center justify-between">
        <div><div className="text-xl md:text-2xl font-heading font-bold text-[var(--color-text-primary)]">{(listing.view_count || 0).toLocaleString('pt-BR')}</div><div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">visualizações</div></div>
        <a href={`/anuncios/${listing.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[var(--color-text-primary)] underline underline-offset-2 hover:text-[var(--color-success)]">Ver anúncio →</a>
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-[var(--color-border-strong)] rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-bold text-sm text-[var(--color-text-primary)]">Informações Básicas</h3>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">Título</label>
          <input autoFocus className={ic('title')} value={formData.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Ex: Toyota Corolla 2.0 XEi 2024" />
          {errors.title && <p className="text-[10px] font-bold text-[var(--color-danger)] mt-1 ml-1">{errors.title}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">Ano Fab.</label><input type="number" className={ic('year')} value={formData.year || ''} onChange={(e) => update('year', parseBrazilianInt(e.target.value))} /></div>
          <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">Ano Mod.</label><input type="number" className={ic('year_model')} value={formData.year_model || ''} onChange={(e) => update('year_model', parseBrazilianInt(e.target.value))} /></div>
        </div>
        <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">Status</label>
          <select className={`${ic('status')} appearance-none cursor-pointer`} value={formData.status || 'active'} onChange={(e) => update('status', e.target.value)}>
            <option value="active">🟢 Ativo</option><option value="paused">🟠 Pausado</option><option value="sold">✅ Vendido</option><option value="archived">⚪ Arquivado</option>
          </select>
        </div>
      </div>

      {/* Price & Location */}
      <div className="bg-white border border-[var(--color-border-strong)] rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-bold text-sm text-[var(--color-text-primary)]">Preço e Localização</h3>
        <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">Valor (R$)</label>
          <input className={`${ic('price')} text-lg md:text-xl`} value={formData.price || ''} onChange={(e) => update('price', e.target.value)} />
          {errors.price && <p className="text-[10px] font-bold text-[var(--color-danger)] mt-1 ml-1">{errors.price}</p>}
        </div>
        <div className="grid grid-cols-[1fr_70px] gap-3">
          <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">Cidade</label><input className={ic('city')} value={formData.city || ''} onChange={(e) => update('city', e.target.value)} /></div>
          <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">UF</label><input className={`${ic('state')} text-center`} value={formData.state || ''} maxLength={2} onChange={(e) => update('state', e.target.value.toUpperCase())} /></div>
        </div>
        <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">KM Atual</label>
          <input type="number" className={ic('mileage')} value={formatBrazilianInt(formData.mileage)} onChange={(e) => update('mileage', parseBrazilianInt(e.target.value))} />
          {errors.mileage && <p className="text-[10px] font-bold text-[var(--color-danger)] mt-1 ml-1">{errors.mileage}</p>}
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white border border-[var(--color-border-strong)] rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-bold text-sm text-[var(--color-text-primary)]">Especificações</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([['transmission', 'Câmbio', ['Manual', 'Automático', 'CVT', 'DCT']], ['fuel', 'Combustível', ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Híbrido', 'Elétrico']], ['engine', 'Motor', null], ['color', 'Cor', null], ['plate_final', 'Placa', null]] as const).map(([f, lbl, opts]) => (
            <div key={f}><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">{lbl}</label>
              {opts ? <select className={`${ic(f)} appearance-none cursor-pointer text-xs`} value={(formData as any)[f] || ''} onChange={(e) => update(f as any, e.target.value)}>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
               : <input className={ic(f)} value={(formData as any)[f] || ''} maxLength={f === 'plate_final' ? 1 : undefined} onChange={(e) => update(f as any, e.target.value)} />}
            </div>
          ))}
        </div>
        <div><label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-disabled)] ml-1 mb-1 block">VIN (Opcional)</label>
          <div className="relative">
            <input className={`${ic('vin')} pr-20 md:pr-28 font-mono text-xs`} value={formData.vin || ''} maxLength={17} placeholder="17 caracteres" onChange={(e) => update('vin', e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))} />
            <button onClick={onBlurPlates} disabled={isBlurring} className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-white rounded-lg text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] flex items-center gap-1 border border-[var(--color-border)]">
              {isBlurring ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanSearch className="w-3 h-3" />} Borrar Placas
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white border border-[var(--color-border-strong)] rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-bold text-sm text-[var(--color-text-primary)]">Descrição</h3>
        <textarea className={`w-full min-h-[120px] p-4 rounded-xl bg-[var(--color-bg)] border-2 border-transparent text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors leading-relaxed resize-y ${errors.description ? '!border-[var(--color-danger)]/20 text-[var(--color-danger)]' : ''}`} value={formData.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Descreva conservação, revisões, opcionais…" />
        <div className="flex justify-between px-1">
          {errors.description ? <p className="text-[10px] font-bold text-[var(--color-danger)]">{errors.description}</p> : <p className="text-[10px] text-[var(--color-text-disabled)]">Seja transparente.</p>}
          <p className="text-[10px] text-[var(--color-text-disabled)] font-bold">{(formData.description || '').length} chars</p>
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
  const [isBlurring, setIsBlurring] = useState(false)
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

  const handleBlurPlates = useCallback(async () => {
    if (!selected) return; setIsBlurring(true)
    try { const sb = getSupabaseBrowserClient(); const { data: { session } } = await sb.auth.getSession(); const res = await fetch(`/api/marketplace/listings/${selected.id}/blur-plates`, { method: 'POST', headers: authH(session!.access_token) }); if (!res.ok) throw new Error('Falha ao borrar placas'); await loadListings() }
    catch (err) { setGlobalError(err instanceof Error ? err.message : 'Erro ao borrar placas') } finally { setIsBlurring(false) }
  }, [selected, loadListings])

  if (!sessionReady) return <div className="flex flex-col items-center justify-center p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-primary)]" /><p className="mt-4 font-heading font-bold text-[var(--color-text-primary)]">Carregando…</p></div>
  if (!isAuthenticated) return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
      <ListingSidebar listings={listings} selectedId={selectedId} onSelect={setSelectedId} loading={loadingListings} searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
      <main>
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <ListingEditor listing={selected} formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} isDirty={isDirty} setIsDirty={setIsDirty} saveStatus={saveStatus} onSave={() => void saveListing(false)} onDelete={handleDelete} isDeleting={isDeleting} isBlurring={isBlurring} onBlurPlates={handleBlurPlates} localImages={localImages} onImageRemove={removeImage} onImageSetPrimary={setPrimary} onImageReorder={(next) => { setLocalImages(next); localImgRef.current = next; setIsDirty(true); schedSync(next) }} onImageAdd={handleImageSelect} onImageSync={() => void syncImages()} isUploading={isUploading} pendingUploads={pendingUploads} imageError={imageError} isDraggingPhotos={isDraggingPhotos} onDragEnter={(e) => handlePhotosDrag(e, true)} onDragLeave={(e) => handlePhotosDrag(e, false)} onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }} onDrop={handlePhotosDrop} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center rounded-2xl border border-[var(--color-border-strong)] bg-white p-8 md:p-16 text-center">
              <Car className="h-12 w-12 text-[var(--color-text-disabled)] mb-4" />
              <h2 className="font-heading font-bold text-lg md:text-xl text-[var(--color-text-primary)]">Selecione um anúncio</h2>
              <p className="mt-2 text-sm text-[var(--color-text-tertiary)] max-w-xs">Escolha um dos seus veículos para editar detalhes, fotos e preço.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {globalError && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[var(--color-danger)] text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-8"><AlertCircle className="w-4 h-4" /> {globalError}<button onClick={() => setGlobalError(null)} className="ml-3 opacity-60 hover:opacity-100" aria-label="Fechar">✕</button></div>}

      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar{width:4px;height:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.05);border-radius:10px}@media(max-width:1024px){.no-scrollbar-mobile::-webkit-scrollbar{display:none}.no-scrollbar-mobile{-ms-overflow-style:none;scrollbar-width:none}}`}</style>
    </div>
  )
}
