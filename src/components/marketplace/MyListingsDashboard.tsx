'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { 
  Loader2, Save, Upload, Trash2, ScanSearch, 
  ChevronRight, Check, AlertCircle, Image as ImageIcon, 
  GripVertical, Star, X, Info, BadgeDollarSign, Car, MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import {
  LISTING_ALLOWED_TYPES,
  LISTING_MAX_IMAGES,
  LISTING_MAX_IMAGE_SIZE_MB,
  parseMoneyInputToNumber,
  validateListingPayload,
} from '@/lib/marketplace'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import { getCarImageUrl } from '@/lib/car-image-fallback'

// --- Types ---

interface DashboardImage {
  id: string
  public_url: string
  storage_path: string
  sort_order: number
  is_primary: boolean
}

interface DashboardListing {
  id: string
  vehicle_id?: string | null
  slug: string
  title: string
  description: string
  brand: string
  model: string
  version: string | null
  year: number
  year_model: number
  vin?: string | null
  mileage: number
  price: number
  city: string
  state: string
  status: string
  transmission: string
  fuel: string
  color: string
  body_type: string
  optional_items: string[]
  engine: string | null
  horsepower: number | null
  doors: number | null
  plate_final: string | null
  images: DashboardImage[] | null
}

interface UploadImageItem {
  id: string // unique id for reordering
  file?: File
  previewUrl: string
  isExisting: boolean
  originalImage?: DashboardImage
  is_primary: boolean
  sort_order: number
}

// --- Utils ---

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// --- Components ---

export default function MyListingsDashboard() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [listings, setListings] = useState<DashboardListing[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loadingListings, setLoadingListings] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState<Partial<DashboardListing>>({})
  const [localImages, setLocalImages] = useState<UploadImageItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Status State
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingUploads, setPendingUploads] = useState(0)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)

  const syncImagesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragCounter = useRef(0)

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedId) || null,
    [listings, selectedId],
  )

  // --- Auth Boot ---
  useEffect(() => {
    if (!supabaseReady) {
      setSessionReady(true)
      setIsAuthenticated(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const boot = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
      setSessionReady(true)

      const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session)
      })
      unsubscribe = () => authData.subscription.unsubscribe()
    }

    void boot()
    return () => {
      unsubscribe?.()
    }
  }, [supabaseReady])

  // --- Load Listings ---
  const loadListings = useCallback(async (selectFirst = false) => {
    if (!supabaseReady) return

    setLoadingListings(true)
    setGlobalError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setGlobalError('Faça login para gerenciar seus anúncios.')
        return
      }

      const response = await fetch('/api/marketplace/my-listings', {
        headers: authHeader(session.access_token),
      })
      const payload = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao carregar seus anúncios.')
      }

      const list = Array.isArray(payload) ? (payload as DashboardListing[]) : []
      setListings(list)

      if (selectFirst && list.length > 0) {
        setSelectedId(list[0].id)
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Falha ao carregar seus anúncios.')
    } finally {
      setLoadingListings(false)
    }
  }, [supabaseReady])

  useEffect(() => {
    if (isAuthenticated) {
      void loadListings(true)
    }
  }, [isAuthenticated, loadListings])

  // --- sync local form with selected listing ---
  useEffect(() => {
    if (!selectedListing) return
    
    // Cleanup previous object URLs
    localImages.forEach(img => {
      if (!img.isExisting) URL.revokeObjectURL(img.previewUrl)
    })

    setFormData({
      title: selectedListing.title,
      description: selectedListing.description,
      price: selectedListing.price,
      vin: selectedListing.vin || '',
      status: selectedListing.status,
      mileage: selectedListing.mileage,
      brand: selectedListing.brand,
      model: selectedListing.model,
      version: selectedListing.version,
      year: selectedListing.year,
      year_model: selectedListing.year_model,
      transmission: selectedListing.transmission,
      fuel: selectedListing.fuel,
      color: selectedListing.color,
      body_type: selectedListing.body_type,
      city: selectedListing.city,
      state: selectedListing.state,
      optional_items: selectedListing.optional_items || [],
      engine: selectedListing.engine,
      horsepower: selectedListing.horsepower,
      doors: selectedListing.doors,
      plate_final: selectedListing.plate_final,
    })

    const initialImages: UploadImageItem[] = (selectedListing.images || []).map(img => ({
      id: img.id,
      previewUrl: img.public_url,
      isExisting: true,
      originalImage: img,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })).sort((a, b) => a.sort_order - b.sort_order)

    setLocalImages(initialImages)
    setIsDirty(false)
    setSaveStatus('idle')
    setErrors({})
  }, [selectedListing?.id])

  // --- Unsaved changes warning ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // --- Form Updates ---
  const updateField = (field: keyof DashboardListing, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    setSaveStatus('idle')
    
    // Real-time validation
    const tempErrors = { ...errors }
    if (field === 'price' && (Number(value) <= 0 || isNaN(Number(value)))) {
      tempErrors.price = 'Preço deve ser maior que zero'
    } else if (field === 'title' && String(value).length < 8) {
      tempErrors.title = 'Título muito curto (mín. 8 chars)'
    } else if (field === 'description' && String(value).length < 20) {
      tempErrors.description = 'Descrição muito curta (mín. 20 chars)'
    } else if (field === 'mileage' && Number(value) < 0) {
      tempErrors.mileage = 'KM não pode ser negativo'
    } else {
      delete tempErrors[field]
    }
    setErrors(tempErrors)
  }

  // --- Auto Save Logic ---
  const saveListing = async (silent = true) => {
    if (!selectedListing || !isDirty) return
    
    // Don't auto-save if there are validation errors
    if (Object.keys(errors).length > 0) return

    if (!silent) setSaveStatus('saving')
    else setSaveStatus('saving') // show indicator anyway per requirement

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) throw new Error('Sessão expirada.')

      // Sanitize payload for API
      const sanitizedPayload = {
        ...formData,
        price: typeof formData.price === 'string' ? parseMoneyInputToNumber(formData.price) : Number(formData.price),
        mileage: Number(formData.mileage),
        year: Number(formData.year),
        year_model: Number(formData.year_model),
        horsepower: formData.horsepower ? Number(formData.horsepower) : undefined,
        doors: formData.doors ? Number(formData.doors) : undefined,
      }

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}`, {
        method: 'PATCH',
        headers: authHeader(session.access_token),
        body: JSON.stringify(sanitizedPayload),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao salvar')

      setSaveStatus('saved')
      setIsDirty(false)
      
      // Update local listings state
      setListings(prev => prev.map(l => l.id === selectedListing.id ? { ...l, ...formData } : l))
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
      setGlobalError(err instanceof Error ? err.message : 'Falha ao salvar automaticamente.')
    }
  }

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      saveListing()
    }, 2000)
    return () => clearTimeout(timer)
  }, [formData])

  // --- Image Handling ---
  const handleImageSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const next: UploadImageItem[] = [...localImages]
    const accepted: File[] = []
    const rejected: { name: string; reason: string }[] = []

    Array.from(fileList).forEach((file) => {
      if (next.length >= LISTING_MAX_IMAGES) {
        rejected.push({ name: file.name, reason: `Limite de ${LISTING_MAX_IMAGES} fotos atingido` })
        return
      }
      if (!LISTING_ALLOWED_TYPES.includes(file.type)) {
        rejected.push({ name: file.name, reason: 'Formato não suportado (use JPG, PNG ou WEBP)' })
        return
      }
      if (file.size > LISTING_MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        rejected.push({ name: file.name, reason: `Maior que ${LISTING_MAX_IMAGE_SIZE_MB}MB` })
        return
      }
      next.push({
        id: `new-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isExisting: false,
        is_primary: next.length === 0,
        sort_order: next.length,
      })
      accepted.push(file)
    })

    if (accepted.length > 0) {
      setLocalImages(next)
      setIsDirty(true)
      setPendingUploads(accepted.length)
      setImageError(null)
      scheduleAutoSync()
    }

    if (rejected.length > 0) {
      setImageError(rejected.map(r => `${r.name}: ${r.reason}`).join(' • '))
      setTimeout(() => setImageError(null), 6000)
    }
  }

  const scheduleAutoSync = () => {
    if (syncImagesTimer.current) clearTimeout(syncImagesTimer.current)
    syncImagesTimer.current = setTimeout(() => {
      syncImages()
    }, 700)
  }

  const removeImage = (id: string) => {
    setLocalImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      // Re-order remaining
      return filtered.map((img, idx) => ({
        ...img,
        sort_order: idx,
        is_primary: idx === 0
      }))
    })
    setIsDirty(true)
    scheduleAutoSync()
  }

  const setPrimary = (id: string) => {
    setLocalImages(prev => {
      const target = prev.find(img => img.id === id)
      if (!target) return prev
      const remaining = prev.filter(img => img.id !== id)
      const sorted = [target, ...remaining].map((img, idx) => ({
        ...img,
        sort_order: idx,
        is_primary: idx === 0
      }))
      return sorted
    })
    setIsDirty(true)
    scheduleAutoSync()
  }

  const handlePhotosDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingPhotos(true)
    }
  }

  const handlePhotosDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDraggingPhotos(false)
    }
  }

  const handlePhotosDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePhotosDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDraggingPhotos(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageSelect(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }

  const syncImages = async () => {
    if (!selectedListing) return
    if (isUploading) return
    setIsUploading(true)
    setGlobalError(null)
    setImageError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token || !session.user) throw new Error('Sessão expirada.')

      const finalImages: any[] = []

      for (let i = 0; i < localImages.length; i++) {
        const item = localImages[i]
        if (item.isExisting && item.originalImage) {
          finalImages.push({
            ...item.originalImage,
            sort_order: i,
            is_primary: i === 0
          })
        } else if (item.file) {
          // Upload new
          const sanitizedName = item.file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')
          const storagePath = `${session.user.id}/${selectedListing.id}/${String(i + 1).padStart(2, '0')}-${Date.now()}-${sanitizedName}`

          const { error: uploadError } = await supabase.storage
            .from('vehicle-listings')
            .upload(storagePath, item.file, { upsert: false, contentType: item.file.type })

          if (uploadError) {
            // Remove the failed item from local state so user can retry
            setLocalImages(prev => prev.filter(img => img.id !== item.id))
            throw new Error(`Falha no upload de "${item.file.name}": ${uploadError.message}`)
          }

          const { data: urlData } = supabase.storage.from('vehicle-listings').getPublicUrl(storagePath)
          finalImages.push({
            storage_path: storagePath,
            public_url: urlData.publicUrl,
            sort_order: i,
            is_primary: i === 0,
          })
          setPendingUploads(prev => Math.max(0, prev - 1))
        }
      }

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}/images`, {
        method: 'POST',
        headers: authHeader(session.access_token),
        body: JSON.stringify({ images: finalImages }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Falha ao salvar ordem/fotos')
      }

      setSaveStatus('saved')
      setIsDirty(false)
      setPendingUploads(0)
      await loadListings()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar fotos'
      setGlobalError(msg)
      setImageError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  // --- Other Actions ---
  const handleDelete = async () => {
    if (!selectedListing) return
    if (!window.confirm('Excluir este anúncio permanentemente?')) return
    
    setIsDeleting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sessão expirada.')

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}`, {
        method: 'DELETE',
        headers: authHeader(session.access_token),
      })
      if (!response.ok) throw new Error('Falha ao excluir')
      
      const next = listings.filter(l => l.id !== selectedId)
      setListings(next)
      if (next.length > 0) setSelectedId(next[0].id)
      else setSelectedId('')
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBlurPlates = async () => {
    if (!selectedListing) return
    setIsBlurring(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}/blur-plates`, {
        method: 'POST',
        headers: authHeader(session!.access_token),
      })
      if (!response.ok) throw new Error('Falha ao borrar placas')
      await loadListings()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Erro ao borrar placas')
    } finally {
      setIsBlurring(false)
    }
  }

  if (!sessionReady) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-2xl border border-[#EAEAE8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A0A0A]" />
        <p className="mt-4 font-bold text-[#0A0A0A]">Carregando sua garagem...</p>
      </div>
    )
  }

  if (!isAuthenticated) return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
      
      {/* --- Sidebar: Listings List --- */}
      <aside className="space-y-4 lg:sticky lg:top-32">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#0A0A0A]">Anúncios ({listings.length})</h3>
        </div>
        
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 pr-2 custom-scrollbar no-scrollbar-mobile">
          {loadingListings ? (
            [1,2,3].map(i => <div key={i} className="min-w-[200px] lg:w-full h-24 bg-white rounded-3xl animate-pulse flex-shrink-0" />)
          ) : listings.length === 0 ? (
            <div className="w-full p-8 text-center bg-white rounded-3xl border border-[#EAEAE8]">
              <p className="text-sm font-bold text-[#A3A3A3]">Nenhum anúncio encontrado.</p>
            </div>
          ) : (
            listings.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`min-w-[240px] lg:w-full group text-left p-3 lg:p-4 rounded-3xl border transition-all flex-shrink-0 ${
                  selectedId === l.id 
                    ? 'bg-[#10B981] border-[#10B981] text-white shadow-xl ' 
                    : 'bg-white border-[#EAEAE8] text-[#0A0A0A] hover:border-[#10B981]'
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-[#FAFAF9] overflow-hidden flex-shrink-0">
                    {l.images?.[0] ? (
                      <img src={getCarImageUrl(l.images[0].public_url) || l.images[0].public_url} width={1080} height={1080} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 opacity-20" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black tracking-tight truncate text-sm lg:text-base ${selectedId === l.id ? 'text-white' : 'text-[#0A0A0A]'}`}>
                      {l.title}
                    </p>
                    <p className={`text-[10px] lg:text-xs font-bold mt-0.5 lg:mt-1 ${selectedId === l.id ? 'text-white/60' : 'text-[#0A0A0A]'}`}>
                      {formatBRL(l.price)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* --- Main Content: Editor --- */}
      <main className="space-y-6">
        <AnimatePresence mode="wait">
          {selectedListing ? (
            <motion.div
              key={selectedListing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAEAE8] shadow-sm sticky top-24 z-20">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                    saveStatus === 'saving' ? 'bg-[#FAFAF9] text-[#0A0A0A]' :
                    saveStatus === 'saved' ? 'bg-green-50 text-green-500' :
                    saveStatus === 'error' ? 'bg-red-50 text-red-500' :
                    'bg-[#FAFAF9] text-[#A3A3A3]'
                  }`}>
                    {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     saveStatus === 'saved' ? <Check className="w-3 h-3" /> :
                     saveStatus === 'error' ? <AlertCircle className="w-3 h-3" /> :
                     <div className="w-3 h-3 rounded-full bg-current opacity-20" />}
                    {saveStatus === 'saving' ? 'Salvando...' : 
                     saveStatus === 'saved' ? 'Alterações Salvas' :
                     saveStatus === 'error' ? 'Erro ao Salvar' : 'Todas as alterações salvas'}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => saveListing(false)}
                    disabled={!isDirty || saveStatus === 'saving'}
                    className="btn btn-primary btn-sm px-8"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Agora
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-12 w-12 rounded-full border border-danger flex items-center justify-center text-danger hover:bg-danger/10 transition-colors"
                    title="Excluir Anúncio"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sections Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* --- Section: Basic --- */}
                <div className="bg-white p-8 rounded-2xl border border-[#EAEAE8] shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAFAF9] flex items-center justify-center text-[#10B981]"><Info className="w-5 h-5" /></div>
                    <h3 className="font-black text-lg">Informações Básicas</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Título do Anúncio</label>
                      <input 
                        autoFocus
                        className={`w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-2 transition-all font-bold text-[#0A0A0A] focus:outline-none ${errors.title ? 'border-red-500/20 text-red-600' : 'border-transparent focus:border-[#10B981]'}`}
                        value={formData.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Ex: Toyota Corolla 2.0 XEi 2024"
                      />
                      {errors.title && <p className="text-[10px] font-bold text-red-500 ml-4">{errors.title}</p>}
                    </div>
 
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Ano Fabricação</label>
                        <input 
                          type="number"
                          className="w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-transparent border-2 focus:border-[#10B981] transition-all font-bold text-[#0A0A0A] focus:outline-none"
                          value={formData.year || ''}
                          onChange={(e) => updateField('year', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Ano Modelo</label>
                        <input 
                          type="number"
                          className="w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-transparent border-2 focus:border-[#10B981] transition-all font-bold text-[#0A0A0A] focus:outline-none"
                          value={formData.year_model || ''}
                          onChange={(e) => updateField('year_model', Number(e.target.value))}
                        />
                      </div>
                    </div>
 
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Status do Anúncio</label>
                      <select
                        className="w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-transparent border-2 focus:border-[#10B981] transition-all font-bold text-[#0A0A0A] focus:outline-none appearance-none cursor-pointer"
                        value={formData.status || 'active'}
                        onChange={(e) => updateField('status', e.target.value)}
                      >
                        <option value="active">🟢 Ativo (Visível para todos)</option>
                        <option value="paused">🟠 Pausado (Oculto temporariamente)</option>
                        <option value="sold">✅ Vendido</option>
                        <option value="archived">⚪ Arquivado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* --- Section: Price & Location --- */}
                <div className="bg-white p-8 rounded-2xl border border-[#EAEAE8] shadow-sm space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAFAF9] flex items-center justify-center text-[#10B981]"><BadgeDollarSign className="w-5 h-5" /></div>
                    <h3 className="font-black text-lg">Preço e Localização</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Valor de Venda (R$)</label>
                      <input 
                        className={`w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-2 transition-all font-bold text-[#0A0A0A] focus:outline-none text-2xl ${errors.price ? 'border-red-500/20 text-red-600' : 'border-transparent focus:border-[#10B981]'}`}
                        value={formData.price || ''}
                        onChange={(e) => updateField('price', e.target.value)}
                      />
                      {errors.price && <p className="text-[10px] font-bold text-red-500 ml-4">{errors.price}</p>}
                    </div>

                    <div className="grid grid-cols-[1fr_80px] gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Cidade</label>
                        <input 
                          className="w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-transparent border-2 focus:border-[#10B981] transition-all font-bold text-[#0A0A0A] focus:outline-none"
                          value={formData.city || ''}
                          onChange={(e) => updateField('city', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">UF</label>
                        <input 
                          className="w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-transparent border-2 focus:border-[#10B981] transition-all font-bold text-[#0A0A0A] focus:outline-none text-center"
                          value={formData.state || ''}
                          maxLength={2}
                          onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">KM Atual</label>
                      <input 
                        type="number"
                        className={`w-full h-14 px-6 rounded-2xl bg-[#FAFAF9] border-2 transition-all font-bold text-[#0A0A0A] focus:outline-none ${errors.mileage ? 'border-red-500/20 text-red-600' : 'border-transparent focus:border-[#10B981]'}`}
                        value={formData.mileage || ''}
                        onChange={(e) => updateField('mileage', Number(e.target.value))}
                      />
                      {errors.mileage && <p className="text-[10px] font-bold text-red-500 ml-4">{errors.mileage}</p>}
                    </div>
                  </div>
                </div>

                {/* --- Section: Details --- */}
                <div className="bg-white p-8 rounded-2xl border border-[#EAEAE8] shadow-sm space-y-6 md:col-span-2">
                   <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAFAF9] flex items-center justify-center text-[#10B981]"><Car className="w-5 h-5" /></div>
                    <h3 className="font-black text-lg">Especificações Técnicas</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Câmbio</label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl bg-[#FAFAF9] font-bold text-[#0A0A0A] focus:outline-none border-none cursor-pointer"
                        value={formData.transmission || ''}
                        onChange={(e) => updateField('transmission', e.target.value)}
                      >
                        <option value="Manual">Manual</option>
                        <option value="Automático">Automático</option>
                        <option value="CVT">CVT</option>
                        <option value="DCT">Dupla Embreagem</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Combustível</label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl bg-[#FAFAF9] font-bold text-[#0A0A0A] focus:outline-none border-none cursor-pointer"
                        value={formData.fuel || ''}
                        onChange={(e) => updateField('fuel', e.target.value)}
                      >
                        <option value="Flex">Flex</option>
                        <option value="Gasolina">Gasolina</option>
                        <option value="Etanol">Etanol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Híbrido">Híbrido</option>
                        <option value="Elétrico">Elétrico</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Cor</label>
                      <input 
                        className="w-full h-12 px-4 rounded-xl bg-[#FAFAF9] font-bold text-[#0A0A0A] focus:outline-none border-none"
                        value={formData.color || ''}
                        onChange={(e) => updateField('color', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Final da Placa</label>
                      <input 
                        className="w-full h-12 px-4 rounded-xl bg-[#FAFAF9] font-bold text-[#0A0A0A] focus:outline-none border-none text-center"
                        value={formData.plate_final || ''}
                        maxLength={1}
                        onChange={(e) => updateField('plate_final', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] ml-4">Chassi (VIN) - Opcional</label>
                    <div className="relative group">
                      <input 
                        className="w-full h-14 px-6 pr-40 rounded-2xl bg-[#FAFAF9] border-transparent border-2 focus:border-[#10B981] transition-all font-mono font-bold text-[#0A0A0A] focus:outline-none"
                        value={formData.vin || ''}
                        maxLength={17}
                        placeholder="17 caracteres"
                        onChange={(e) => updateField('vin', e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
                      />
                      <button 
                        onClick={handleBlurPlates}
                        disabled={isBlurring}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-white rounded-xl text-xs font-medium uppercase tracking-wider text-[#525252] hover:text-[#0A0A0A] hover:bg-black/5 transition-all flex items-center gap-2 border border-[#EAEAE8] shadow-sm"
                      >
                        {isBlurring ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanSearch className="w-3 h-3" />}
                        Borrar Placas AI
                      </button>
                    </div>
                    <p className="text-[10px] text-[#A3A3A3] font-medium ml-4 mt-2">Dica: Adicionar o VIN ajuda a comprovar a procedência e acelera a venda.</p>
                  </div>
                </div>

                {/* --- Section: Description --- */}
                <div className="bg-white p-8 rounded-2xl border border-[#EAEAE8] shadow-sm space-y-6 md:col-span-2">
                   <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAFAF9] flex items-center justify-center text-[#10B981]"><MessageSquare className="w-5 h-5" /></div>
                    <h3 className="font-black text-lg">Descrição do Veículo</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <textarea 
                      className={`w-full min-h-[200px] p-6 rounded-2xl bg-[#FAFAF9] border-2 transition-all font-bold text-[#0A0A0A] focus:outline-none leading-relaxed ${errors.description ? 'border-red-500/20 text-red-600' : 'border-transparent focus:border-[#10B981]'}`}
                      value={formData.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Descreva o estado de conservação, revisões, pneus, opcionais e tudo que valoriza seu carro..."
                    />
                    <div className="flex justify-between items-center px-4 mt-2">
                      {errors.description ? (
                        <p className="text-[10px] font-bold text-red-500">{errors.description}</p>
                      ) : (
                        <p className="text-[10px] text-[#A3A3A3] font-medium italic">Seja transparente para evitar visitas frustradas.</p>
                      )}
                      <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">{(formData.description || '').length} chars</p>
                    </div>
                  </div>
                </div>

                {/* --- Section: Photos --- */}
                <div
                  className={`bg-white p-8 rounded-2xl border shadow-sm space-y-8 md:col-span-2 transition-colors ${
                    isDraggingPhotos ? 'border-[#10B981] bg-[#ECFDF5]/30' : 'border-[#EAEAE8]'
                  }`}
                  onDragEnter={handlePhotosDragEnter}
                  onDragLeave={handlePhotosDragLeave}
                  onDragOver={handlePhotosDragOver}
                  onDrop={handlePhotosDrop}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAFAF9] flex items-center justify-center text-[#10B981]"><ImageIcon className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-black text-lg leading-tight">Fotos do Anúncio</h3>
                        <p className="text-xs font-bold text-[#A3A3A3] mt-0.5">Arraste para reordenar. A primeira é a principal.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="h-12 px-6 rounded-full bg-[#FAFAF9] hover:bg-[#EAEAE8] text-[#0A0A0A] text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all border border-[#EAEAE8]">
                        <Upload className="w-4 h-4" />
                        Adicionar
                        <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { handleImageSelect(e.target.files); e.target.value = '' }} />
                      </label>
                      <button
                        onClick={syncImages}
                        disabled={!isDirty || isUploading}
                        className="btn btn-primary btn-sm px-8"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Fotos
                      </button>
                    </div>
                  </div>

                  {(isUploading || pendingUploads > 0) && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/20 text-[13px] text-[#0A0A0A]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" strokeWidth={1.75} />
                      <span className="font-medium tracking-tight">
                        {isUploading ? 'Enviando fotos para o servidor…' : `${pendingUploads} foto(s) prontas para upload…`}
                      </span>
                    </div>
                  )}

                  {imageError && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                      <span className="font-medium tracking-tight">{imageError}</span>
                    </div>
                  )}

                  {localImages.length === 0 ? (
                    <label className="block p-20 text-center border-2 border-dashed border-[#EAEAE8] rounded-2xl bg-[#FAFAF9] cursor-pointer hover:border-[#10B981] hover:bg-[#ECFDF5]/30 transition-colors">
                      <ImageIcon className="w-12 h-12 text-[#A3A3A3] mx-auto mb-4" />
                      <p className="text-sm font-bold text-[#0A0A0A] mb-1">Arraste fotos aqui ou clique para selecionar</p>
                      <p className="text-xs text-[#A3A3A3]">JPG, PNG ou WEBP • até {LISTING_MAX_IMAGES} fotos • máx {LISTING_MAX_IMAGE_SIZE_MB}MB cada</p>
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { handleImageSelect(e.target.files); e.target.value = '' }} />
                    </label>
                  ) : (
                    <Reorder.Group
                      axis="x"
                      values={localImages}
                      onReorder={(next) => {
                        const reordered = next.map((img, idx) => ({
                          ...img,
                          sort_order: idx,
                          is_primary: idx === 0,
                        }))
                        setLocalImages(reordered)
                        setIsDirty(true)
                        scheduleAutoSync()
                      }}
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
                    >
                      {localImages.map((img) => (
                        <Reorder.Item 
                          key={img.id} 
                          value={img}
                          className="relative aspect-square rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing border border-[#EAEAE8] bg-[#FAFAF9]"
                        >
                          <img src={img.previewUrl} className="w-full h-full object-cover select-none" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                            <div className="flex justify-between items-start">
                              <div className="bg-white/90 p-1.5 rounded-lg shadow-sm">
                                <GripVertical className="w-4 h-4 text-[#A3A3A3]" />
                              </div>
                              <button 
                                onClick={() => removeImage(img.id)}
                                className="w-8 h-8 bg-danger text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg border border-danger/10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => setPrimary(img.id)}
                              className={`w-full py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-all ${
                                img.is_primary ? 'bg-success text-white font-bold' : 'bg-white text-[#0A0A0A] hover:bg-[#FAFAF9]'
                              }`}
                            >
                              {img.is_primary ? 'Capa' : 'Definir Capa'}
                            </button>
                          </div>
                          
                          {img.is_primary && (
                            <div className="absolute top-3 left-3 bg-success text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" /> Capa
                            </div>
                          )}
                          
                          {!img.isExisting && (
                            <div className="absolute top-3 right-3 bg-[#10B981] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                              Novo
                            </div>
                          )}
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>

              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-[48px] p-20 text-center border border-[#EAEAE8] shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-[#FAFAF9] rounded-full flex items-center justify-center mb-8"><Car className="w-10 h-10 text-[#A3A3A3]" /></div>
              <h2 className="text-3xl font-black text-[#0A0A0A] tracking-tight">Selecione um anúncio</h2>
              <p className="mt-4 text-lg font-medium text-[#525252] max-w-sm">Escolha um dos seus veículos ao lado para editar detalhes, fotos e preço.</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {globalError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8">
          <AlertCircle className="w-5 h-5" />
          {globalError}
          <button onClick={() => setGlobalError(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.1);
        }
        @media (max-width: 1024px) {
          .no-scrollbar-mobile::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar-mobile {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  )
}
