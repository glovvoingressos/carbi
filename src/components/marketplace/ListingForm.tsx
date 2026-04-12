'use client'

import { useEffect, useMemo, useState, type DragEvent } from 'react'
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
  vin: string
}

interface CatalogCar {
  brand: string
  model: string
  version: string
  year: number
  transmission?: string
  engineType?: string
  displacement?: string
  horsepower?: number
  torque?: number
  category?: string
  segment?: string
  fuelEconomyCityGas?: number
  fuelEconomyRoadGas?: number
}

interface TechnicalSnapshot {
  engine: string
  horsepower: string
  torque: string
  fuel: string
  transmission: string
  consumption: string
  category: string
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
  vin: '',
}

const EMPTY_TECHNICAL: TechnicalSnapshot = {
  engine: 'Não informado',
  horsepower: 'Não informado',
  torque: 'Não informado',
  fuel: 'Não informado',
  transmission: 'Não informado',
  consumption: 'Não informado',
  category: 'Não informado',
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferTransmissionFromText(value: string): string {
  const n = normalize(value)
  if (n.includes('cvt')) return 'CVT'
  if (n.includes('aut') || n.includes('automatic')) return 'Automático'
  if (n.includes('manual')) return 'Manual'
  if (n.includes('automatizado')) return 'Automatizado'
  return 'Não informado'
}

function inferEngineFromText(value: string): string {
  const n = value.trim()
  const match = n.match(/\b\d\.\d\b/)
  return match ? `${match[0]}${/\bturbo\b/i.test(n) ? ' Turbo' : ''}` : 'Não informado'
}

function inferCategoryFromModel(model: string): string {
  const n = normalize(model)
  if (n.includes('suv') || n.includes('cross') || n.includes('tracker') || n.includes('compass')) return 'SUV'
  if (n.includes('sedan') || n.includes('plus')) return 'Sedan'
  if (n.includes('toro') || n.includes('strada') || n.includes('hilux') || n.includes('ranger') || n.includes('s10')) return 'Picape'
  if (n.includes('hatch') || n.includes('onix') || n.includes('polo') || n.includes('argo') || n.includes('208')) return 'Hatch'
  return 'Não informado'
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
  const [guidedStep, setGuidedStep] = useState<1 | 2 | 3 | 4>(1)
  const [fipeResult, setFipeResult] = useState<FipeResult | null>(null)
  const [catalogCars, setCatalogCars] = useState<CatalogCar[]>([])
  const [technical, setTechnical] = useState<TechnicalSnapshot>(EMPTY_TECHNICAL)

  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [fipeLoading, setFipeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationDetails, setValidationDetails] = useState<string[]>([])
  const [titleTouched, setTitleTouched] = useState(false)

  const resolveCatalogModelName = (brandName: string, rawModelName: string): string => {
    const normalizedRaw = normalize(rawModelName)
    const brandNorm = normalize(brandName)
    if (!normalizedRaw) return rawModelName

    const modelOptions = Array.from(
      new Set(
        catalogCars
          .filter((car) => normalize(car.brand || '') === brandNorm)
          .map((car) => String(car.model || '').trim())
          .filter(Boolean),
      ),
    )

    const ranked = modelOptions
      .map((model) => ({ model, n: normalize(model) }))
      .filter((item) => item.n && normalizedRaw.includes(item.n))
      .sort((a, b) => b.n.length - a.n.length)

    return ranked[0]?.model || rawModelName
  }

  const clearVehicleDependentFields = (scope: 'brand' | 'model' | 'year') => {
    setForm((prev) => ({
      ...prev,
      model: scope === 'brand' ? '' : prev.model,
      version: scope === 'brand' || scope === 'model' ? '' : prev.version,
      year: scope === 'brand' || scope === 'model' || scope === 'year' ? '' : prev.year,
      yearModel: scope === 'brand' || scope === 'model' || scope === 'year' ? '' : prev.yearModel,
      engine: '',
      horsepower: '',
      fuel: scope === 'brand' || scope === 'model' ? '' : prev.fuel,
      transmission: '',
      bodyType: '',
    }))
    setTechnical(EMPTY_TECHNICAL)
  }

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
    if (!selectedBrandCode) {
      clearVehicleDependentFields('brand')
    }
  }, [selectedBrandCode])

  useEffect(() => {
    if (!selectedModelCode) {
      clearVehicleDependentFields('model')
    }
  }, [selectedModelCode])

  useEffect(() => {
    if (!selectedYear) {
      clearVehicleDependentFields('year')
    }
  }, [selectedYear])

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
    const loadCatalogCars = async () => {
      try {
        const response = await fetch('/api/cars')
        if (!response.ok) return
        const payload = (await response.json()) as unknown
        if (Array.isArray(payload)) {
          setCatalogCars(payload as CatalogCar[])
        }
      } catch {
        // graceful fallback: keeps technical as "Não informado"
      }
    }

    void loadCatalogCars()
  }, [])

  useEffect(() => {
    if (!selectedBrandCode) {
      setModels([])
      setSelectedModelCode('')
      setGuidedStep(1)
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
      setGuidedStep((prev) => (prev > 2 ? 2 : prev))
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
      setGuidedStep((prev) => (prev > 3 ? 3 : prev))
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

  useEffect(() => {
    if (!form.brand || !form.model || !form.yearModel) {
      setTechnical(EMPTY_TECHNICAL)
      return
    }

    const targetBrand = normalize(form.brand)
    const targetModel = normalize(form.model)
    const targetVersion = normalize(form.version)
    const targetYear = Number(form.yearModel) || 0

    const candidates = catalogCars
      .filter((car) => normalize(car.brand || '') === targetBrand && normalize(car.model || '') === targetModel)
      .map((car) => {
        let score = 0
        const versionNorm = normalize(car.version || '')
        if (targetYear && Number(car.year) === targetYear) score += 30
        if (targetYear && Number(car.year) && Math.abs(Number(car.year) - targetYear) <= 1) score += 10
        if (targetVersion && versionNorm.includes(targetVersion)) score += 25
        if (targetVersion && targetVersion.split(' ').filter(Boolean).some((t) => versionNorm.includes(t))) score += 10
        if (car.horsepower) score += 5
        if (car.displacement) score += 5
        return { car, score }
      })
      .sort((a, b) => b.score - a.score)

    const matched = candidates[0]?.car || null

    const inferredTransmission = inferTransmissionFromText(form.version || '')
    const inferredEngine = inferEngineFromText(form.version || form.model || '')
    const inferredCategory = inferCategoryFromModel(form.model || '')

    const engineText = matched?.displacement?.trim() || matched?.engineType?.trim() || inferredEngine
    const hpText = matched?.horsepower ? `${matched.horsepower} cv` : 'Não informado'
    const torqueText = matched?.torque ? `${matched.torque} Nm` : 'Não informado'
    const fuelText = fipeResult?.fuel?.trim() || matched?.engineType?.trim() || form.fuel || 'Não informado'
    const transmissionText = matched?.transmission?.trim() || inferredTransmission || form.transmission || 'Não informado'
    const hasCity = Number.isFinite(matched?.fuelEconomyCityGas as number) && (matched?.fuelEconomyCityGas as number) > 0
    const hasRoad = Number.isFinite(matched?.fuelEconomyRoadGas as number) && (matched?.fuelEconomyRoadGas as number) > 0
    const consumptionText = hasCity || hasRoad
      ? `${hasCity ? `${matched?.fuelEconomyCityGas} km/l cidade` : ''}${hasCity && hasRoad ? ' • ' : ''}${hasRoad ? `${matched?.fuelEconomyRoadGas} km/l estrada` : ''}`
      : 'Não informado'
    const categoryText = matched?.category || matched?.segment || inferredCategory || form.bodyType || 'Não informado'

    setTechnical({
      engine: engineText,
      horsepower: hpText,
      torque: torqueText,
      fuel: fuelText,
      transmission: transmissionText,
      consumption: consumptionText,
      category: categoryText,
    })

    setForm((prev) => ({
      ...prev,
      engine: engineText === 'Não informado' ? '' : engineText,
      horsepower: hpText === 'Não informado' ? '' : hpText.replace(/[^\d]/g, ''),
      fuel: fuelText === 'Não informado' ? prev.fuel : fuelText,
      transmission: transmissionText === 'Não informado' ? prev.transmission : transmissionText,
      bodyType: categoryText === 'Não informado' ? prev.bodyType : categoryText,
    }))
  }, [catalogCars, form.brand, form.model, form.yearModel, form.version, form.fuel, form.transmission, form.bodyType, fipeResult])

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

  const onDropFiles = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handleImageSelect(event.dataTransfer.files)
  }

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!form.brand || !form.model || !form.year || !form.yearModel || !selectedVersionCode) {
        return 'Selecione marca, modelo, ano e versão para continuar.'
      }
    }

    if (step === 2) {
      if (!form.price || !form.mileage || !form.city || !form.state) {
        return 'Preencha preço, quilometragem, cidade e estado.'
      }
    }

    if (step === 3) {
      if (!form.price || !form.mileage || !form.city || !form.state) {
        return 'Complete preço, quilometragem e localização antes de publicar.'
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
      const resolvedTransmission = form.transmission || (technical.transmission !== 'Não informado' ? technical.transmission : 'Não informado')
      const resolvedFuel = form.fuel || (technical.fuel !== 'Não informado' ? technical.fuel : 'Não informado')
      const resolvedBodyType = form.bodyType || (technical.category !== 'Não informado' ? technical.category : 'Não informado')
      const resolvedEngine = form.engine || (technical.engine !== 'Não informado' ? technical.engine : null)
      const resolvedHorsepower = form.horsepower
        ? Number(form.horsepower)
        : technical.horsepower !== 'Não informado'
          ? Number(technical.horsepower.replace(/[^\d]/g, ''))
          : null

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
          transmission: resolvedTransmission,
          fuel: resolvedFuel,
          color: form.color || 'Não informado',
          body_type: resolvedBodyType,
          city: form.city,
          state: form.state,
          optional_items: normalizeOptionalItems(form.optionalItems),
          engine: resolvedEngine,
          horsepower: Number.isFinite(resolvedHorsepower) ? resolvedHorsepower : null,
          plate_final: form.plateFinal,
          doors: form.doors ? Number(form.doors) : null,
          vin: form.vin ? form.vin.trim().toUpperCase() : null,
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

  const canAdvanceGuidedStep =
    (guidedStep === 1 && !!selectedBrandCode)
    || (guidedStep === 2 && !!selectedModelCode)
    || (guidedStep === 3 && !!selectedYear)
    || (guidedStep === 4 && !!selectedVersionCode)

  const goToNextGuidedStep = () => {
    if (!canAdvanceGuidedStep) return
    setGuidedStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : 4))
  }

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
          {currentStep === 1 && 'Etapa 1 de 3: Selecione seu carro'}
          {currentStep === 2 && 'Etapa 2 de 3: Preço, km, cidade e fotos'}
          {currentStep === 3 && 'Etapa 3 de 3: Revisar e publicar'}
        </p>
      </div>

      <div className="rounded-2xl bg-[#f6f8fb] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-tertiary">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`rounded-full px-3 py-2 ${currentStep === step ? 'bg-dark text-white shadow-[0_4px_14px_rgba(10,10,10,0.2)]' : 'bg-white text-text-tertiary shadow-[0_2px_10px_rgba(0,0,0,0.06)]'}`}
          >
            Etapa {step}
          </div>
        ))}
      </div>
      </div>

      <div className="rounded-[28px] bg-[#f7f9fc] p-5 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-dark">Selecione seu carro</h3>
            <p className="text-sm font-medium text-text-secondary">
              Escolha marca, modelo, ano e versão. A ficha técnica é preenchida automaticamente.
            </p>
            <div className="guided-steps">
              <button type="button" onClick={() => setGuidedStep(1)} className={`guided-step ${selectedBrandCode ? 'is-done' : ''} ${guidedStep === 1 ? 'is-active' : ''}`}>1. Marca</button>
              <button type="button" onClick={() => selectedBrandCode && setGuidedStep(2)} className={`guided-step ${selectedModelCode ? 'is-done' : ''} ${guidedStep === 2 ? 'is-active' : ''}`}>2. Modelo</button>
              <button type="button" onClick={() => selectedModelCode && setGuidedStep(3)} className={`guided-step ${selectedYear ? 'is-done' : ''} ${guidedStep === 3 ? 'is-active' : ''}`}>3. Ano</button>
              <button type="button" onClick={() => selectedYear && setGuidedStep(4)} className={`guided-step ${selectedVersionCode ? 'is-done' : ''} ${guidedStep === 4 ? 'is-active' : ''}`}>4. Versão</button>
            </div>
            <div className="guided-flow-card">
              <p className="guided-flow-title">
                {guidedStep === 1 && 'Qual é a marca do carro?'}
                {guidedStep === 2 && 'Agora selecione o modelo'}
                {guidedStep === 3 && 'Escolha o ano'}
                {guidedStep === 4 && 'Selecione a versão/combustível'}
              </p>
              <p className="guided-flow-subtitle">
                {guidedStep === 1 && 'Vamos usar isso para puxar dados reais da base de referência.'}
                {guidedStep === 2 && 'Mostramos apenas os modelos disponíveis para a marca escolhida.'}
                {guidedStep === 3 && 'Exibimos só os anos mais recentes para esse modelo.'}
                {guidedStep === 4 && 'Cada versão tem preço de referência e ficha própria.'}
              </p>

              {guidedStep === 1 && (
                <select className={`input guided-input ${!selectedBrandCode ? 'guided-input-empty' : ''}`} value={selectedBrandCode} onChange={(e) => {
                  const code = e.target.value
                  setSelectedBrandCode(code)
                  const selected = brands.find((item) => item.code === code)
                  handleInput('brand', selected?.name || '')
                }}>
                  <option value="">Selecione a marca</option>
                  {brands.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
              )}

              {guidedStep === 2 && (
                <select className={`input guided-input ${!selectedModelCode ? 'guided-input-empty' : ''}`} value={selectedModelCode} onChange={(e) => {
                  const code = e.target.value
                  setSelectedModelCode(code)
                  const selected = models.find((item) => item.code === code)
                  const rawName = selected?.name || ''
                  handleInput('model', resolveCatalogModelName(form.brand, rawName))
                }} disabled={!selectedBrandCode}>
                  <option value="">Selecione o modelo</option>
                  {models.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
              )}

              {guidedStep === 3 && (
                <select className={`input guided-input ${!selectedYear ? 'guided-input-empty' : ''}`} value={selectedYear ?? ''} onChange={(e) => {
                  const year = e.target.value ? parseInt(e.target.value, 10) : null
                  setSelectedYear(year)
                  const yearText = year ? String(year) : ''
                  handleInput('year', yearText)
                  handleInput('yearModel', yearText)
                }} disabled={!selectedModelCode}>
                  <option value="">Selecione o ano</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              )}

              {guidedStep === 4 && (
                <select className={`input guided-input ${!selectedVersionCode ? 'guided-input-empty' : ''}`} value={selectedVersionCode} onChange={(e) => {
                  setSelectedVersionCode(e.target.value)
                  const selected = versions.find((item) => item.code === e.target.value)
                  handleInput('fuel', selected?.fuelType || '')
                  handleInput('version', selected?.name || form.version)
                }} disabled={!selectedYear}>
                  <option value="">Selecione a versão</option>
                  {versions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
              )}

              <div className="mt-4 flex justify-start">
                <button
                  type="button"
                  onClick={goToNextGuidedStep}
                  disabled={!canAdvanceGuidedStep || guidedStep === 4}
                  className="guided-continue-btn"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="guided-readonly">
                  <span>Ano fabricação</span>
                  <strong>{selectedYear ? form.year || '-' : 'Selecione o ano'}</strong>
                </div>
                <div className="guided-readonly">
                  <span>Ano/modelo</span>
                  <strong>{selectedYear ? form.yearModel || '-' : 'Selecione o ano'}</strong>
                </div>
              </div>
            </div>

            <div className="soft-panel p-4 sm:p-5">
              <p className="text-sm font-black text-dark">Ficha técnica automática</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="tech-item">
                  <span>Motorização</span>
                  <strong>{technical.engine}</strong>
                </div>
                <div className="tech-item">
                  <span>Potência</span>
                  <strong>{technical.horsepower}</strong>
                </div>
                <div className="tech-item">
                  <span>Torque</span>
                  <strong>{technical.torque}</strong>
                </div>
                <div className="tech-item">
                  <span>Combustível</span>
                  <strong>{technical.fuel}</strong>
                </div>
                <div className="tech-item">
                  <span>Câmbio</span>
                  <strong>{technical.transmission}</strong>
                </div>
                <div className="tech-item">
                  <span>Consumo</span>
                  <strong>{technical.consumption}</strong>
                </div>
                <div className="tech-item sm:col-span-2">
                  <span>Categoria</span>
                  <strong>{technical.category}</strong>
                </div>
              </div>
            </div>

            <div className="soft-panel p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-dark">Referência FIPE</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${fipeBadgeClass}`}>
                  {comparison.status === 'below' && 'Abaixo do preço médio'}
                  {comparison.status === 'near' && 'Próximo do preço médio'}
                  {comparison.status === 'above' && 'Acima do preço médio'}
                  {comparison.status === 'unknown' && 'Sem referência definida'}
                </span>
              </div>
              {!selectedVersionCode ? (
                <p className="mt-2 text-sm text-text-secondary">Complete marca, modelo, ano e versão para carregar o valor atualizado.</p>
              ) : fipeLoading ? (
                <p className="mt-2 text-sm text-text-secondary">Consultando valor atualizado...</p>
              ) : fipeResult ? (
                <div className="mt-3 grid gap-2 text-sm">
                  <p><strong>Preço FIPE:</strong> {fipeResult.price}</p>
                  <p><strong>Seu anúncio:</strong> {priceNumber ? formatBRL(priceNumber) : 'Informe o preço'}</p>
                  <p><strong>Diferença:</strong> {comparison.diffValue === null ? '-' : formatBRL(comparison.diffValue)}</p>
                  <p><strong>Percentual:</strong> {comparison.diffPercent === null ? '-' : `${comparison.diffPercent.toFixed(2)}%`}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">Nao foi possivel carregar a referencia para essa combinacao.</p>
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

            <label
              className="soft-panel flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-dark/20 p-4 text-sm font-bold text-dark"
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDrop={onDropFiles}
            >
              <ImagePlus className="h-4 w-4" />
              Arraste fotos ou clique para enviar ({images.length}/{LISTING_MAX_IMAGES})
              <span className="text-xs font-medium text-text-secondary">Até 10 imagens • JPG, PNG, WEBP</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>
            <p className="text-xs font-semibold text-text-secondary">Você pode publicar sem foto e enviar imagens depois no painel dos seus anúncios.</p>

            {images.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <div key={image.previewUrl} className="soft-panel p-3">
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
            <h3 className="text-2xl font-black text-dark">Revisar e publicar</h3>
            <div className="soft-panel p-4 sm:p-5">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><strong>Veículo:</strong> {form.brand} {form.model} {form.version}</p>
                <p><strong>Ano:</strong> {form.year}/{form.yearModel}</p>
                <p><strong>Preço:</strong> {form.price ? formatBRL(parseMoneyInputToNumber(form.price)) : 'Não informado'}</p>
                <p><strong>Quilometragem:</strong> {form.mileage ? `${Number(form.mileage).toLocaleString('pt-BR')} km` : 'Não informado'}</p>
                <p><strong>Cidade/UF:</strong> {form.city || '-'}{form.state ? `/${form.state}` : ''}</p>
                <p><strong>Fotos:</strong> {images.length} de {LISTING_MAX_IMAGES}</p>
              </div>
            </div>

            <textarea className="input min-h-32" placeholder="Descrição (opcional, mas ajuda a vender mais rápido)" value={form.description} onChange={(e) => handleInput('description', e.target.value)} />
            <input className="input" placeholder="Opcionais (opcional, separados por vírgula)" value={form.optionalItems} onChange={(e) => handleInput('optionalItems', e.target.value)} />

            <p className="text-xs text-text-tertiary">
              Seu contato direto não é exibido. Toda negociação acontece via chat interno da plataforma.
            </p>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 shadow-[0_4px_16px_rgba(220,38,38,0.08)]">
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
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 shadow-[0_4px_16px_rgba(16,185,129,0.08)]">
            <p className="text-sm font-semibold text-emerald-700">{success}</p>
            <Link href="/minha-conta/anuncios" className="mt-1 inline-block text-xs font-bold text-emerald-700 underline">
              Ver meus anúncios
            </Link>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || saving}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-bold disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          {currentStep < 3 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-full bg-dark px-6 py-3 text-sm font-black text-white">
              Próxima etapa <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-full bg-dark px-6 py-3 text-sm font-black text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publicar anúncio
            </button>
          )}
        </div>

        {currentStep === 3 ? (
          <div className="fixed inset-x-0 bottom-3 z-30 px-4 sm:hidden">
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="w-full rounded-full bg-dark px-6 py-3 text-sm font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] disabled:opacity-50"
            >
              {saving ? 'Publicando...' : 'Publicar anúncio'}
            </button>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .soft-panel {
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .guided-steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .guided-step {
          border-radius: 999px;
          background: #eef2f6;
          color: var(--color-text-3);
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 12px;
          border: none;
        }

        .guided-step.is-done {
          background: #dff7e8;
          color: var(--color-dark);
        }

        .guided-step.is-active {
          background: #111827;
          color: white;
        }

        .guided-flow-card {
          border-radius: 20px;
          background: #f8fafc;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .guided-flow-title {
          font-size: 30px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #111827;
        }

        .guided-flow-subtitle {
          margin-top: 8px;
          font-size: 17px;
          color: #6b7280;
          font-weight: 500;
        }

        .guided-input {
          margin-top: 10px;
          border: 1px solid transparent !important;
          border-color: transparent !important;
          border-radius: 30px;
          background: #eff1f3;
          box-shadow: none;
          height: 64px !important;
          min-height: 64px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          padding-left: 16px !important;
          padding-right: 40px !important;
          line-height: 64px;
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }

        .guided-input-empty {
          color: #8f959d;
          font-weight: 700;
        }

        .guided-continue-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 14px;
          border: none;
          background: #0a0a0a;
          color: #fff;
          padding: 12px 18px;
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
          transition: transform 180ms ease, opacity 180ms ease;
        }

        .guided-continue-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .guided-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .guided-field {
          border-radius: 18px;
          background: #f6f8fb;
          padding: 12px;
        }

        .guided-readonly {
          border-radius: 18px;
          background: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          box-shadow: 0 3px 14px rgba(0, 0, 0, 0.04);
        }

        .guided-readonly span {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-3);
        }

        .guided-readonly strong {
          font-size: 15px;
          font-weight: 800;
          color: var(--color-dark);
        }

        .input {
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 14px 16px;
          min-height: 52px;
          width: 100%;
          background: var(--color-bg);
          font-weight: 600;
          font-size: 15px;
        }

        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.12);
          border-color: rgba(10, 10, 10, 0.3);
        }

        .tech-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-radius: 14px;
          background: #ffffff;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--color-text-2);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }

        .tech-item strong {
          color: var(--color-dark);
          font-size: 13px;
          font-weight: 700;
          text-align: right;
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

        @media (max-width: 640px) {
          .guided-steps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .guided-flow-title {
            font-size: 22px;
          }

          .guided-flow-subtitle {
            font-size: 15px;
          }

          .guided-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
