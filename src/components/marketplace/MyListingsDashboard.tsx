'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save, Upload, Trash2, ScanSearch } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import {
  LISTING_ALLOWED_TYPES,
  LISTING_MAX_IMAGES,
  LISTING_MAX_IMAGE_SIZE_MB,
  parseMoneyInputToNumber,
} from '@/lib/marketplace'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'

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
  images: DashboardImage[] | null
}

interface UploadImageItem {
  file: File
  previewUrl: string
}

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export default function MyListingsDashboard() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [listings, setListings] = useState<DashboardListing[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [newImages, setNewImages] = useState<UploadImageItem[]>([])
  const [vin, setVin] = useState('')
  const [status, setStatus] = useState<'active' | 'sold' | 'paused' | 'archived'>('active')
  const [loadingListings, setLoadingListings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [blurringPlates, setBlurringPlates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedId) || null,
    [listings, selectedId],
  )

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

  const loadListings = async () => {
    if (!supabaseReady) return

    setLoadingListings(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Faça login para gerenciar seus anúncios.')
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

      const target = list[0]
      if (target) {
        setSelectedId(target.id)
        setTitle(target.title)
        setDescription(target.description)
        setPrice(String(target.price))
        setVin(target.vin || '')
      }
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : 'Falha ao carregar seus anúncios.')
    } finally {
      setLoadingListings(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadListings()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!selectedListing) return
    setTitle(selectedListing.title)
    setDescription(selectedListing.description)
    setPrice(String(selectedListing.price))
    setVin(selectedListing.vin || '')
    setStatus((selectedListing.status as 'active' | 'sold' | 'paused' | 'archived') || 'active')
    setNewImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
  }, [selectedListing?.id])

  const handleImageSelect = (fileList: FileList | null) => {
    if (!fileList) return
    const next: UploadImageItem[] = []

    Array.from(fileList).forEach((file) => {
      if (next.length >= LISTING_MAX_IMAGES) return
      if (!LISTING_ALLOWED_TYPES.includes(file.type)) return
      if (file.size > LISTING_MAX_IMAGE_SIZE_MB * 1024 * 1024) return
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
      })
    })

    setNewImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return next
    })
  }

  const saveDetails = async () => {
    if (!selectedListing) return

    const parsedPrice = parseMoneyInputToNumber(price)
    if (!parsedPrice || parsedPrice <= 0) {
      setError('Preço inválido.')
      return
    }
    if (description.trim().length < 20) {
      setError('Descrição deve ter no mínimo 20 caracteres.')
      return
    }
    if (title.trim().length < 8) {
      setError('Título deve ter no mínimo 8 caracteres.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Faça login novamente para continuar.')
        return
      }

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}`, {
        method: 'PATCH',
        headers: authHeader(session.access_token),
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parsedPrice,
          status,
          vin: vin.trim().toUpperCase() || null,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao salvar anúncio.')
      }

      setListings((prev) => prev.map((item) => (
        item.id === selectedListing.id
          ? { ...item, title: title.trim(), description: description.trim(), price: parsedPrice, status, vin: vin.trim().toUpperCase() || null }
          : item
      )))
      setSuccess('Anúncio atualizado com sucesso.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar anúncio.')
    } finally {
      setSaving(false)
    }
  }

  const deleteListing = async () => {
    if (!selectedListing) return
    const confirmed = window.confirm('Deseja excluir este anúncio? Esta ação não pode ser desfeita.')
    if (!confirmed) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Faça login novamente para continuar.')
        return
      }

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}`, {
        method: 'DELETE',
        headers: authHeader(session.access_token),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao excluir anúncio.')
      }

      const next = listings.filter((item) => item.id !== selectedListing.id)
      setListings(next)
      if (next[0]) {
        setSelectedId(next[0].id)
      } else {
        setSelectedId('')
      }
      setSuccess('Anúncio excluído com sucesso.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Falha ao excluir anúncio.')
    } finally {
      setSaving(false)
    }
  }

  const uploadImages = async () => {
    if (!selectedListing) return
    if (newImages.length === 0) {
      setError('Selecione ao menos uma nova imagem para substituir as fotos atuais.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token || !session.user) {
        setError('Faça login novamente para continuar.')
        return
      }

      const uploaded: Array<{
        storage_path: string
        public_url: string
        sort_order: number
        is_primary: boolean
      }> = []

      for (let i = 0; i < newImages.length; i += 1) {
        const image = newImages[i]
        const sanitizedName = image.file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')
        const storagePath = `${session.user.id}/${selectedListing.id}/${String(i + 1).padStart(2, '0')}-${Date.now()}-${sanitizedName}`

        const { error: uploadError } = await supabase.storage
          .from('vehicle-listings')
          .upload(storagePath, image.file, { upsert: false, contentType: image.file.type })

        if (uploadError) {
          throw new Error(`Falha no upload da imagem: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage.from('vehicle-listings').getPublicUrl(storagePath)
        uploaded.push({
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          sort_order: i,
          is_primary: i === 0,
        })
      }

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}/images`, {
        method: 'POST',
        headers: authHeader(session.access_token),
        body: JSON.stringify({ images: uploaded }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao salvar imagens.')
      }

      setSuccess('Fotos atualizadas com sucesso.')
      setNewImages((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        return []
      })
      await loadListings()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Falha ao atualizar fotos.')
    } finally {
      setUploading(false)
    }
  }

  const blurListingPlates = async () => {
    if (!selectedListing) return

    setBlurringPlates(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Faça login novamente para continuar.')
        return
      }

      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}/blur-plates`, {
        method: 'POST',
        headers: authHeader(session.access_token),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao borrar placas.')
      }

      const summary = payload?.data
      setSuccess(
        summary
          ? `Borrar placa concluído: ${summary.blurred} foto(s) ajustada(s), ${summary.skipped} sem placa visível.`
          : 'Borrar placa concluído com sucesso.'
      )
      await loadListings()
    } catch (blurError) {
      setError(blurError instanceof Error ? blurError.message : 'Falha ao borrar placas.')
    } finally {
      setBlurringPlates(false)
    }
  }

  if (!sessionReady) {
    return (
      <div className="pastel-card pastel-card-green p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-dark" />
        <p className="mt-2 text-sm text-text-secondary">Carregando sessão...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="space-y-6">
      <div className="pastel-card p-5 sm:p-6" style={{ backgroundColor: '#edf2f7' }}>
        <h2 className="text-2xl font-black text-dark">Meus anúncios</h2>
        <p className="mt-1 text-base font-medium text-text-secondary">
          Edite preço, descrição, título e substitua as fotos com dados reais.
        </p>
      </div>

      {loadingListings ? (
        <div className="pastel-card p-8 text-center" style={{ backgroundColor: '#edf2f7' }}>
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-dark" />
          <p className="mt-2 text-sm text-text-secondary">Carregando anúncios...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="pastel-card p-8 text-sm font-semibold text-text-secondary" style={{ backgroundColor: '#edf2f7' }}>
          Você ainda não possui anúncios ativos.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="pastel-card p-3" style={{ backgroundColor: '#edf2f7' }}>
            <div className="space-y-2">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  onClick={() => setSelectedId(listing.id)}
                  className={`w-full rounded-2xl p-3 text-left transition ${selectedId === listing.id ? 'bg-[#dce7f5]' : 'bg-white hover:bg-[#f6f8fb]'}`}
                >
                  <p className="line-clamp-1 text-sm font-black text-dark">{listing.title}</p>
                  <p className="mt-0.5 text-sm font-medium text-text-secondary">
                    {listing.brand} {listing.model} • {formatBRL(Number(listing.price))}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                    Status: {listing.status}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          {selectedListing ? (
            <section className="pastel-card p-5 sm:p-6" style={{ backgroundColor: '#f1f4f8' }}>
              <div className="grid gap-4 sm:grid-cols-2">
                {(selectedListing.images || []).map((image) => (
                  <div key={image.id} className="aspect-square overflow-hidden rounded-2xl bg-white">
                    <img
                      src={image.public_url}
                      alt={selectedListing.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
                {(selectedListing.images || []).length === 0 ? (
                  <div className="aspect-square rounded-2xl bg-white/70 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Sem fotos no anúncio
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3">
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título"
                />
                <input
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Preço"
                />
                <input
                  className="input"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17))}
                  placeholder="VIN (opcional, 17 caracteres)"
                />
                <textarea
                  className="input min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição"
                />
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'sold' | 'paused' | 'archived')}
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="sold">Vendido</option>
                  <option value="archived">Arquivado</option>
                </select>
                <p className="text-xs text-text-secondary">
                  Ao salvar com VIN válido, o sistema sincroniza ficha técnica e fotos automaticamente.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveDetails}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-dark px-5 py-2 text-sm font-black text-white disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar alterações
                </button>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold text-dark">
                  <Upload className="h-4 w-4" />
                  Selecionar novas fotos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files)}
                  />
                </label>

                <button
                  type="button"
                  onClick={uploadImages}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#dce7f5] px-5 py-2 text-sm font-black text-dark disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Atualizar fotos
                </button>

                <button
                  type="button"
                  onClick={blurListingPlates}
                  disabled={blurringPlates || !selectedListing.images?.length}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-black text-dark shadow-[0_4px_20px_rgba(0,0,0,0.05)] disabled:opacity-60"
                >
                  {blurringPlates ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                  Borrar placa
                </button>

                <button
                  type="button"
                  onClick={deleteListing}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-red-500 px-5 py-2 text-sm font-black text-red-600 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir anúncio
                </button>
              </div>

              {newImages.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {newImages.map((image, index) => (
                    <div key={image.previewUrl} className="aspect-square overflow-hidden rounded-xl bg-white/75">
                      <img src={image.previewUrl} alt={`Nova foto ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}

      <style jsx>{`
        .input {
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 12px 14px;
          width: 100%;
          background: var(--color-bg);
          font-weight: 500;
        }

        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.12);
          border-color: rgba(10, 10, 10, 0.3);
        }
      `}</style>
    </div>
  )
}
