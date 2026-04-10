'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, ArrowLeft, ImagePlus, MoveLeft, MoveRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { FipeItem, FipeResult, FipeVersionOption } from '@/lib/fipe-api'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'
import {
  LISTING_ALLOWED_TYPES,
  LISTING_MAX_IMAGES,
  LISTING_MAX_IMAGE_SIZE_MB,
  buildFipeSnapshot,
  getFipeComparison,
  normalizeOptionalItems,
  parseMoneyInputToNumber,
} from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'

const DRAFT_KEY = 'carbi_listing_draft_v1'

interface UploadImageItem {
  file: File
  previewUrl: string
}

interface FormState {
  title: string
  brand: string
  model: string
  version: string
  year: string
  yearModel: string
  mileage: string
  price: string
  transmission: string
  fuel: string
  color: string
  bodyType: string
  city: string
  state: string
  description: string
  optionalItems: string
  engine: string
  horsepower: string
  plateFinal: string
  doors: string
}

const INITIAL_STATE: FormState = {
  title: '',
  brand: '',
  model: '',
  version: '',
  year: '',
  yearModel: '',
  mileage: '',
  price: '',
  transmission: '',
  fuel: '',
  color: '',
  bodyType: '',
  city: '',
  state: '',
  description: '',
  optionalItems: '',
  engine: '',
  horsepower: '',
  plateFinal: '',
  doors: '',
}

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export default function ListingForm() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [images, setImages] = useState<UploadImageItem[]>([])

  const [brands, setBrands] = useState<FipeItem[]>([])
  const [models, setModels] = useState<FipeItem[]>([])
  const [years, setYears] = useState<number[]>([])
  const [versions, setVersions] = useState<FipeVersionOption[]>([])
  const [selectedBrandCode, setSelectedBrandCode] = useState('')
  const [selectedModelCode, setSelectedModelCode] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedVersionCode, setSelectedVersionCode] = useState('')
  const [fipeResult, setFipeResult] = useState<FipeResult | null>(null)

  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [fipeLoading, setFipeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationDetails, setValidationDetails] = useState<string[]>([])
  const [titleTouched, setTitleTouched] = useState(false)

  useEffect(() => {
    try {
      const cached = localStorage.getItem(DRAFT_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as { form: FormState }
        if (parsed.form) setForm({ ...INITIAL_STATE, ...parsed.form })
      }
    } catch {
      // ignore malformed draft
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form }))
  }, [form])

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

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await fetch('/api/fipe/brands')
        if (!response.ok) throw new Error('Falha na consulta de marcas.')
        const data = (await response.json()) as unknown
        setBrands(Array.isArray(data) ? (data as FipeItem[]) : [])
      } catch {
        setError('Falha ao carregar marcas de referência.')
      }
    }

    void loadBrands()
  }, [])

  useEffect(() => {
    if (!selectedBrandCode) {
      setModels([])
      setSelectedModelCode('')
      return
    }

    const loadModels = async () => {
      try {
        const response = await fetch(`/api/fipe/models?brandCode=${selectedBrandCode}`)
        if (!response.ok) throw new Error('Falha na consulta de modelos.')
        const data = (await response.json()) as unknown
        setModels(Array.isArray(data) ? (data as FipeItem[]) : [])
      } catch {
        setError('Falha ao carregar modelos.')
      }
      setSelectedModelCode('')
      setYears([])
      setSelectedYear(null)
      setVersions([])
      setSelectedVersionCode('')
      setFipeResult(null)
    }

    void loadModels()
  }, [selectedBrandCode])

  useEffect(() => {
    if (!selectedBrandCode || !selectedModelCode) {
      setYears([])
      setSelectedYear(null)
      return
    }

    const loadYears = async () => {
      try {
        const response = await fetch(`/api/fipe/years?brandCode=${selectedBrandCode}&modelCode=${selectedModelCode}`)
        if (!response.ok) throw new Error('Falha na consulta de anos.')
        const data = (await response.json()) as unknown
        setYears(Array.isArray(data) ? (data as number[]) : [])
      } catch {
        setError('Falha ao carregar anos.')
      }
      setSelectedYear(null)
      setVersions([])
      setSelectedVersionCode('')
      setFipeResult(null)
    }

    void loadYears()
  }, [selectedBrandCode, selectedModelCode])

  useEffect(() => {
    if (!selectedBrandCode || !selectedModelCode || !selectedYear) {
      setVersions([])
      setSelectedVersionCode('')
      setFipeResult(null)
      return
    }

    const loadVersions = async () => {
      try {
        const response = await fetch(
          `/api/fipe/versions?brandCode=${selectedBrandCode}&modelCode=${selectedModelCode}&year=${selectedYear}`,
        )
        if (!response.ok) throw new Error('Falha na consulta de versões.')
        const data = (await response.json()) as unknown
        setVersions(Array.isArray(data) ? (data as FipeVersionOption[]) : [])
      } catch {
        setError('Falha ao carregar versões.')
      }
      setSelectedVersionCode('')
      setFipeResult(null)
    }

    void loadVersions()
  }, [selectedBrandCode, selectedModelCode, selectedYear])

  useEffect(() => {
    if (!selectedBrandCode || !selectedModelCode || !selectedVersionCode) {
      setFipeResult(null)
      return
    }

    const loadFipe = async () => {
      setFipeLoading(true)
      try {
        const response = await fetch(
          `/api/fipe/detail?brandCode=${selectedBrandCode}&modelCode=${selectedModelCode}&yearCode=${selectedVersionCode}`,
        )
        if (!response.ok) {
          setFipeResult(null)
          setError('Não foi possível obter o valor atualizado para esta versão.')
          return
        }
        const data = (await response.json()) as FipeResult | null
        if (!data?.codeFipe || !data?.price) {
          setFipeResult(null)
          setError('Resposta inválida para esta combinação de modelo/ano/versão.')
          return
        }
        setFipeResult(data)
      } finally {
        setFipeLoading(false)
      }
    }

    void loadFipe()
  }, [selectedBrandCode, selectedModelCode, selectedVersionCode])

  const priceNumber = useMemo(() => parseMoneyInputToNumber(form.price), [form.price])
  const fipeNumber = useMemo(() => {
    if (!fipeResult) return null
    const raw = fipeResult.price.replace(/[^\d,]/g, '').replace(',', '.')
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }, [fipeResult])
  const comparison = useMemo(() => getFipeComparison(priceNumber, fipeNumber), [priceNumber, fipeNumber])

  const handleInput = (field: keyof FormState, value: string) => {
    if (field === 'title') setTitleTouched(true)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (!form.brand || !form.model || !form.yearModel) return
    if (titleTouched && form.title.trim().length >= 8) return

    const nextTitle = `${form.brand} ${form.model} ${form.yearModel}${form.version ? ` ${form.version}` : ''}`.trim()
    if (!nextTitle) return

    setForm((prev) => ({
      ...prev,
      title: nextTitle,
    }))
  }, [form.brand, form.model, form.yearModel, form.version, form.title, titleTouched])

  const handleImageSelect = (fileList: FileList | null) => {
    if (!fileList) return

    const next = [...images]
    Array.from(fileList).forEach((file) => {
      if (next.length >= LISTING_MAX_IMAGES) return
      if (!LISTING_ALLOWED_TYPES.includes(file.type)) return
      if (file.size > LISTING_MAX_IMAGE_SIZE_MB * 1024 * 1024) return
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
      })
    })

    setImages(next)
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const image = prev[index]
      if (image) URL.revokeObjectURL(image.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const copy = [...prev]
      const current = copy[index]
      copy[index] = copy[target]
      copy[target] = current
      return copy
    })
  }

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!form.title || !form.brand || !form.model || !form.year || !form.yearModel) {
        return 'Preencha título, marca, modelo, ano e ano/modelo.'
      }
    }

    if (step === 2) {
      if (!form.price || !form.mileage || !form.city || !form.state) {
        return 'Preencha preço, quilometragem, cidade e estado.'
      }
    }

    if (step === 3) {
      if (!form.description || form.description.trim().length < 20) {
        return 'Descrição deve ter no mínimo 20 caracteres.'
      }
      if (!form.transmission || !form.fuel || !form.color || !form.bodyType) {
        return 'Preencha câmbio, combustível, cor e carroceria.'
      }
    }

    return null
  }

  const nextStep = () => {
    const validation = validateStep(currentStep)
    if (validation) {
      setError(validation)
      setValidationDetails([])
      return
    }
    setError(null)
    setValidationDetails([])
    setCurrentStep((prev) => Math.min(3, prev + 1))
  }

  const prevStep = () => {
    setError(null)
    setValidationDetails([])
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmit = async () => {
    const validation = validateStep(3)
    if (validation) {
      setError(validation)
      setValidationDetails([])
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    setValidationDetails([])

    try {
      if (!supabaseReady) {
        setError('Supabase não configurado no ambiente. Não é possível publicar o anúncio.')
        return
      }

      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token || !session.user) {
        setError('Faça login para publicar seu anúncio.')
        return
      }

      const fipeSnapshot = buildFipeSnapshot(fipeResult)

      const createResponse = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: authHeader(session.access_token),
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          brand: form.brand,
          model: form.model,
          version: form.version,
          year: Number(form.year),
          year_model: Number(form.yearModel),
          mileage: Number(form.mileage),
          price: parseMoneyInputToNumber(form.price),
          transmission: form.transmission,
          fuel: form.fuel,
          color: form.color,
          body_type: form.bodyType,
          city: form.city,
          state: form.state,
          optional_items: normalizeOptionalItems(form.optionalItems),
          engine: form.engine,
          horsepower: form.horsepower ? Number(form.horsepower) : null,
          plate_final: form.plateFinal,
          doors: form.doors ? Number(form.doors) : null,
          fipe_brand_code: selectedBrandCode || null,
          fipe_model_code: selectedModelCode || null,
          fipe_year_code: selectedVersionCode || null,
          ...fipeSnapshot,
          structured_data: {
            source: 'web_form',
          },
        }),
      })

      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => ({}))
        const details = Array.isArray(body?.details)
          ? body.details.filter((item: unknown): item is string => typeof item === 'string')
          : []
        setValidationDetails(details)
        throw new Error(body.error || 'Falha ao criar anúncio.')
      }

      const created = (await createResponse.json()) as { id: string; slug: string }

      const uploaded: Array<{ storage_path: string; public_url: string; sort_order: number; is_primary: boolean }> = []

      for (let i = 0; i < images.length; i += 1) {
        const image = images[i]
        const sanitizedName = image.file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')
        const storagePath = `${session.user.id}/${created.id}/${String(i + 1).padStart(2, '0')}-${Date.now()}-${sanitizedName}`

        const { error: uploadError } = await supabase.storage
          .from('vehicle-listings')
          .upload(storagePath, image.file, { upsert: false, contentType: image.file.type })

        if (uploadError) {
          throw new Error(`Falha no upload de imagem: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage.from('vehicle-listings').getPublicUrl(storagePath)

        uploaded.push({
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          sort_order: i,
          is_primary: i === 0,
        })
      }

      if (uploaded.length > 0) {
        const imageResponse = await fetch(`/api/marketplace/listings/${created.id}/images`, {
          method: 'POST',
          headers: authHeader(session.access_token),
          body: JSON.stringify({ images: uploaded }),
        })

        if (!imageResponse.ok) {
          const body = await imageResponse.json().catch(() => ({}))
          throw new Error(body.error || 'Falha ao persistir imagens do anúncio.')
        }
      }

      localStorage.removeItem(DRAFT_KEY)
      setSuccess('Carro anunciado com sucesso')
      setTimeout(() => {
        router.push(`/anuncios/${created.slug}`)
      }, 800)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao publicar anúncio.')
    } finally {
      setSaving(false)
    }
  }

  const fipeBadgeClass =
    comparison.status === 'below'
      ? 'bg-emerald-100 text-emerald-800'
      : comparison.status === 'above'
      ? 'bg-amber-100 text-amber-800'
      : comparison.status === 'near'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-zinc-100 text-zinc-700'

  if (!sessionReady) {
    return (
      <div className="rounded-[32px] border border-border bg-white p-8 text-center">
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
      <div className="space-y-3">
        <div className="h-2 rounded-full bg-border/80">
          <div
            className="h-full rounded-full bg-dark transition-all"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        <p className="text-xs font-bold text-text-secondary">
          {currentStep === 1 && 'Etapa 1 de 3: Dados principais do veículo'}
          {currentStep === 2 && 'Etapa 2 de 3: Fotos, preço e localização'}
          {currentStep === 3 && 'Etapa 3 de 3: Detalhes finais e publicação'}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-tertiary">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`rounded-full px-3 py-1 ${currentStep === step ? 'bg-dark text-white' : 'bg-white border border-border text-text-tertiary'}`}
          >
            Etapa {step}
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border-2 border-dark bg-white p-5 sm:p-8 shadow-[5px_5px_0_#000] space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-dark">Dados do veículo</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Título do anúncio" value={form.title} onChange={(e) => handleInput('title', e.target.value)} />
              <input className="input" placeholder="Versão" value={form.version} onChange={(e) => handleInput('version', e.target.value)} />

              <select className="input" value={selectedBrandCode} onChange={(e) => {
                const code = e.target.value
                setSelectedBrandCode(code)
                const selected = brands.find((item) => item.code === code)
                handleInput('brand', selected?.name || '')
              }}>
                <option value="">Marca (referência)</option>
                {brands.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>

              <select className="input" value={selectedModelCode} onChange={(e) => {
                const code = e.target.value
                setSelectedModelCode(code)
                const selected = models.find((item) => item.code === code)
                handleInput('model', selected?.name || '')
              }} disabled={!selectedBrandCode}>
                <option value="">Modelo (referência)</option>
                {models.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>

              <select className="input" value={selectedYear ?? ''} onChange={(e) => {
                const year = e.target.value ? parseInt(e.target.value, 10) : null
                setSelectedYear(year)
                const yearText = year ? String(year) : ''
                handleInput('year', yearText)
                handleInput('yearModel', yearText)
              }} disabled={!selectedModelCode}>
                <option value="">Ano (referência)</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>

              <select className="input" value={selectedVersionCode} onChange={(e) => {
                setSelectedVersionCode(e.target.value)
                const selected = versions.find((item) => item.code === e.target.value)
                handleInput('fuel', selected?.fuelType || '')
                handleInput('version', selected?.name || form.version)
              }} disabled={!selectedYear}>
                <option value="">Versão/Combustível (referência)</option>
                {versions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>

              <input className="input" placeholder="Ano fabricação" value={form.year} onChange={(e) => handleInput('year', e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <input className="input" placeholder="Ano/modelo" value={form.yearModel} onChange={(e) => handleInput('yearModel', e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <input className="input" placeholder="Motor (ex: 1.0 Turbo)" value={form.engine} onChange={(e) => handleInput('engine', e.target.value)} />
              <input className="input" placeholder="Potência (cv)" value={form.horsepower} onChange={(e) => handleInput('horsepower', e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-dark">Referência de preço</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${fipeBadgeClass}`}>
                  {comparison.status === 'below' && 'Abaixo do preço médio'}
                  {comparison.status === 'near' && 'Próximo do preço médio'}
                  {comparison.status === 'above' && 'Acima do preço médio'}
                  {comparison.status === 'unknown' && 'Sem referência definida'}
                </span>
              </div>
              {fipeLoading ? (
                <p className="mt-2 text-sm text-text-secondary">Consultando valor atualizado...</p>
              ) : fipeResult ? (
                <div className="mt-3 grid gap-2 text-sm">
                  <p><strong>Preço médio:</strong> {fipeResult.price}</p>
                  <p><strong>Seu anúncio:</strong> {priceNumber ? formatBRL(priceNumber) : 'Informe o preço'}</p>
                  <p><strong>Diferença:</strong> {comparison.diffValue === null ? '-' : formatBRL(comparison.diffValue)}</p>
                  <p><strong>Percentual:</strong> {comparison.diffPercent === null ? '-' : `${comparison.diffPercent.toFixed(2)}%`}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">Selecione marca, modelo, ano e versão para exibir o valor atualizado em tempo real.</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-dark">Preço, localização e fotos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Preço pedido (R$)" value={form.price} onChange={(e) => handleInput('price', e.target.value)} />
              <input className="input" placeholder="Quilometragem" value={form.mileage} onChange={(e) => handleInput('mileage', e.target.value.replace(/\D/g, ''))} />
              <input className="input" placeholder="Cidade" value={form.city} onChange={(e) => handleInput('city', e.target.value)} />
              <input className="input" placeholder="Estado (UF)" value={form.state} onChange={(e) => handleInput('state', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))} />
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dark/40 p-4 text-sm font-bold text-dark">
              <ImagePlus className="h-4 w-4" />
              Adicionar fotos (opcional) ({images.length}/{LISTING_MAX_IMAGES})
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>
            <p className="text-xs font-semibold text-text-secondary">Você pode publicar sem foto e enviar as imagens depois no painel dos seus anúncios.</p>

            {images.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <div key={image.previewUrl} className="rounded-2xl border border-border bg-surface p-3">
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} className="h-36 w-full rounded-xl object-cover" />
                    <p className="mt-2 text-xs font-bold text-dark">{index === 0 ? 'Foto principal' : `Foto ${index + 1}`}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" className="btn-icon" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                        <MoveLeft className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-icon" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                        <MoveRight className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-icon text-red-600" onClick={() => removeImage(index)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-dark">Detalhes finais</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input" value={form.transmission} onChange={(e) => handleInput('transmission', e.target.value)}>
                <option value="">Câmbio</option>
                <option>Manual</option>
                <option>Automático</option>
                <option>CVT</option>
                <option>Automatizado</option>
              </select>
              <select className="input" value={form.fuel} onChange={(e) => handleInput('fuel', e.target.value)}>
                <option value="">Combustível</option>
                <option>Flex</option>
                <option>Gasolina</option>
                <option>Diesel</option>
                <option>Elétrico</option>
                <option>Híbrido</option>
              </select>
              <input className="input" placeholder="Cor" value={form.color} onChange={(e) => handleInput('color', e.target.value)} />
              <input className="input" placeholder="Carroceria" value={form.bodyType} onChange={(e) => handleInput('bodyType', e.target.value)} />
              <input className="input" placeholder="Portas" value={form.doors} onChange={(e) => handleInput('doors', e.target.value.replace(/\D/g, '').slice(0, 1))} />
              <input className="input" placeholder="Final da placa" value={form.plateFinal} onChange={(e) => handleInput('plateFinal', e.target.value.replace(/\D/g, '').slice(0, 1))} />
            </div>

            <textarea className="input min-h-32" placeholder="Descrição detalhada" value={form.description} onChange={(e) => handleInput('description', e.target.value)} />
            <input className="input" placeholder="Opcionais (separados por vírgula)" value={form.optionalItems} onChange={(e) => handleInput('optionalItems', e.target.value)} />

            <p className="text-xs text-text-tertiary">
              Seu contato direto não é exibido. Toda negociação acontece via chat interno da plataforma.
            </p>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            {validationDetails.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs font-medium text-red-700/90">
                {validationDetails.map((detail) => (
                  <li key={detail}>• {detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-700">{success}</p>
            <Link href="/minha-conta/anuncios" className="mt-1 inline-block text-xs font-bold text-emerald-700 underline">
              Ver meus anúncios
            </Link>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || saving}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-bold disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          {currentStep < 3 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-full bg-dark px-6 py-2 text-sm font-black text-white">
              Próxima etapa <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bento-yellow)] px-6 py-2 text-sm font-black text-dark disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publicar anúncio real
            </button>
          )}
        </div>
      </div>

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

        .btn-icon {
          border: 1px solid var(--color-border);
          border-radius: 999px;
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: white;
        }
      `}</style>
    </div>
  )
}
