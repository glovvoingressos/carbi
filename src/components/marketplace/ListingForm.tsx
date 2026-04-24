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
import { enrichVehicle } from '@/lib/vehicle-enrichment'
import { brandsAreEquivalent } from '@/lib/brand-normalization'

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
  const match = n.match(/\b\d(?:[.,]\d)\b/)
  return match ? `${match[0].replace(',', '.')}${/\bturbo\b/i.test(n) ? ' Turbo' : ''}` : 'Não informado'
}

function inferCategoryFromModel(model: string): string {
  const n = normalize(model)
  if (n.includes('suv') || n.includes('cross') || n.includes('tracker') || n.includes('compass')) return 'SUV'
  if (n.includes('3008') || n.includes('2008') || n.includes('q3') || n.includes('q5') || n.includes('q8')) return 'SUV'
  if (n.includes('sedan') || n.includes('plus')) return 'Sedan'
  if (n.includes('toro') || n.includes('strada') || n.includes('hilux') || n.includes('ranger') || n.includes('s10')) return 'Picape'
  if (n.includes('hatch') || n.includes('onix') || n.includes('polo') || n.includes('argo') || n.includes('208')) return 'Hatch'
  return 'Não informado'
}

function extractVersionFromFipeModel(fullModelName: string, selectedModelName: string): string {
  const full = fullModelName.trim()
  const model = selectedModelName.trim()
  if (!full) return ''
  if (!model) return full

  const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const directStrip = full.replace(new RegExp(`^${escaped}\\s*[-–]?\\s*`, 'i'), '').trim()
  if (directStrip && directStrip.length < full.length) return directStrip

  const fullNorm = normalize(full)
  const modelNorm = normalize(model)
  if (fullNorm === modelNorm) return ''
  if (fullNorm.startsWith(`${modelNorm} `)) {
    return full.slice(model.length).trim()
  }

  return full
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
    if (!selectedYear) return
    if (versions.length === 0) {
      setSelectedVersionCode('')
      setFipeResult(null)
      return
    }

    const preserved = versions.find((item) => item.code === selectedVersionCode)
    const nextCode = preserved?.code || versions[0]?.code || ''
    if (!nextCode || nextCode === selectedVersionCode) return

    const selected = versions.find((item) => item.code === nextCode)
    setSelectedVersionCode(nextCode)
    setForm((prev) => ({
      ...prev,
      fuel: selected?.fuelType || prev.fuel,
    }))
  }, [selectedYear, selectedVersionCode, versions])

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
    if (!fipeResult) return

    const parsedVersion = extractVersionFromFipeModel(fipeResult.model || '', form.model || '')
    setForm((prev) => ({
      ...prev,
      fuel: prev.fuel || fipeResult.fuel || '',
      version: parsedVersion || prev.version,
    }))
  }, [fipeResult, form.model])

  useEffect(() => {
    if (!form.brand || !form.model || !form.yearModel) {
      setTechnical(EMPTY_TECHNICAL)
      return
    }

    const targetBrand = normalize(form.brand)
    const targetModel = normalize(form.model)
    const targetVersion = normalize(form.version)
    const targetYear = Number(form.yearModel) || 0

    // Matching melhorado com normalização de marcas
    const candidates = catalogCars
      .filter((car) => {
        const carBrand = normalize(car.brand || '')
        const carModel = normalize(car.model || '')
        // Matching exato
        if (carBrand === targetBrand && carModel === targetModel) return true
        // Matching com normalização
        if (brandsAreEquivalent(car.brand || '', form.brand) && carModel === targetModel) return true
        // Matching parcial de modelo
        if (carModel === targetModel || targetModel.includes(carModel) || carModel.includes(targetModel)) return true
        return false
      })
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

    // ENRIQUECIMENTO AUTOMÁTICO: Usa catálogo, inferência ou regex
    const enriched = enrichVehicle(
      {
        brand: form.brand,
        model: form.model,
        version: form.version,
        year: Number(form.year),
        yearModel: Number(form.yearModel),
      },
      matched
    )

    const rawDetailText = [form.version, fipeResult?.model, form.model].filter(Boolean).join(' ')
    const inferredTransmission = inferTransmissionFromText(rawDetailText)
    const inferredEngine = inferEngineFromText(rawDetailText)
    const inferredCategory = inferCategoryFromModel(form.model || '')

    // Hierarquia: catálogo > enriquecimento > inferência
    const engineText = enriched.engine || inferredEngine
    const hpText = enriched.horsepower ? `${enriched.horsepower} cv` : 'Não informado'
    const torqueText = enriched.torque ? `${enriched.torque} Nm` : 'Não informado'
    const fuelText = enriched.fuel || fipeResult?.fuel?.trim() || form.fuel || 'Não informado'
    const transmissionText = enriched.transmission || inferredTransmission || form.transmission || 'Não informado'
    const hasCity = Number.isFinite(enriched.fuelEconomyCityGas as number) && (enriched.fuelEconomyCityGas as number) > 0
    const hasRoad = Number.isFinite(enriched.fuelEconomyRoadGas as number) && (enriched.fuelEconomyRoadGas as number) > 0
    const consumptionText = hasCity || hasRoad
      ? `${hasCity ? `${enriched.fuelEconomyCityGas} km/l cidade` : ''}${hasCity && hasRoad ? ' • ' : ''}${hasRoad ? `${enriched.fuelEconomyRoadGas} km/l estrada` : ''}`
      : 'Não informado'
    const categoryText = enriched.category || enriched.bodyType || inferredCategory || form.bodyType || 'Não informado'

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
      horsepower: enriched.horsepower ? String(enriched.horsepower) : (hpText === 'Não informado' ? '' : hpText.replace(/[^\d]/g, '')),
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
  const hasAskingPrice = form.price.trim().length > 0 && priceNumber > 0

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
      if (!selectedBrandCode || !selectedModelCode || !selectedYear || !form.brand || !form.model || !form.year || !form.yearModel) {
        return 'Selecione marca, modelo e ano para continuar.'
      }
    }

    if (step === 2) {
      if (!form.price || !form.mileage || !form.city || !form.state || !form.description.trim()) {
        return 'Preencha preço, quilometragem, cidade, estado e descrição.'
      }
    }

    if (step === 3) {
      if (!form.price || !form.mileage || !form.city || !form.state || !form.description.trim()) {
        return 'Complete preço, quilometragem, localização e descrição antes de publicar.'
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
      ? 'bg-[#F2F2F7] text-dark border border-[#E8E8E8]'
      : comparison.status === 'above'
      ? 'bg-[#F2F2F7] text-dark border border-[#E8E8E8]'
      : comparison.status === 'near'
      ? 'bg-[#F2F2F7] text-dark border border-[#E8E8E8]'
      : 'bg-[#F2F2F7] text-text-secondary border border-[#E8E8E8]'

  if (!sessionReady) {
    return (
      <div className="bg-white rounded-[32px] border border-black/5 p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-dark" />
        <p className="mt-2 text-sm text-text-secondary">Carregando sessão...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="space-y-12 pb-4">
      <div className="space-y-4">
        <div className="h-2 rounded-[999px] bg-[#f5f5f3]">
          <div
            className="h-full rounded-[999px] bg-dark transition-all"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">
          {currentStep === 1 && 'Etapa 1 de 3: Selecione seu carro'}
          {currentStep === 2 && 'Etapa 2 de 3: Preço, descrição e fotos'}
          {currentStep === 3 && 'Etapa 3 de 3: Revisar e publicar'}
        </p>
      </div>

      <div className="bg-white rounded-[32px] border border-black/5 p-3 shadow-sm inline-block">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`rounded-[999px] px-5 py-2.5 transition-colors ${currentStep === step ? 'bg-dark text-white' : 'bg-[#f5f5f3] text-dark/40'}`}
            >
              Etapa {step}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-black/5 p-8 sm:p-12 shadow-sm space-y-12">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-dark tracking-tight">Selecione seu carro</h3>
            <p className="text-base font-medium text-dark/50">
              Fluxo rápido e sem poluição: escolha marca, depois modelo, depois ano. O resto é carregado automaticamente.
            </p>
            <div className="bg-[#f5f5f3] rounded-2xl p-6 space-y-4 border border-black/5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Seleção do veículo</p>
                <span className="rounded-full bg-white border border-black/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">
                  Sequencial
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <select
                  className={`w-full h-14 bg-white rounded-2xl px-5 text-sm font-bold outline-none border transition-all ${!selectedBrandCode ? 'border-transparent text-dark/30' : 'border-black/5 text-dark'} focus:border-black/10 focus:shadow-sm`}
                  value={selectedBrandCode}
                  onChange={(e) => {
                    const code = e.target.value
                    setSelectedBrandCode(code)
                    const selected = brands.find((item) => item.code === code)
                    handleInput('brand', selected?.name || '')
                  }}
                >
                  <option value="">1. Selecione a marca</option>
                  {brands.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>

                <select
                  className={`w-full h-14 bg-white rounded-2xl px-5 text-sm font-bold outline-none border transition-all ${!selectedModelCode ? 'border-transparent text-dark/30' : 'border-black/5 text-dark'} focus:border-black/10 focus:shadow-sm`}
                  value={selectedModelCode}
                  onChange={(e) => {
                    const code = e.target.value
                    setSelectedModelCode(code)
                    const selected = models.find((item) => item.code === code)
                    const rawName = selected?.name || ''
                    handleInput('model', resolveCatalogModelName(form.brand, rawName))
                  }}
                  disabled={!selectedBrandCode}
                >
                  <option value="">2. Selecione o modelo</option>
                  {models.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>

                <select
                  className={`w-full h-14 bg-white rounded-2xl px-5 text-sm font-bold outline-none border transition-all ${!selectedYear ? 'border-transparent text-dark/30' : 'border-black/5 text-dark'} focus:border-black/10 focus:shadow-sm`}
                  value={selectedYear ?? ''}
                  onChange={(e) => {
                    const year = e.target.value ? parseInt(e.target.value, 10) : null
                    setSelectedYear(year)
                    const yearText = year ? String(year) : ''
                    handleInput('year', yearText)
                    handleInput('yearModel', yearText)
                  }}
                  disabled={!selectedModelCode}
                >
                  <option value="">3. Selecione o ano</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              {selectedYear ? (
                <div className="grid gap-3 sm:grid-cols-3 mt-4">
                  <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Ano fabricação</span>
                    <strong className="text-sm text-dark">{form.year || '-'}</strong>
                  </div>
                  <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Ano/modelo</span>
                    <strong className="text-sm text-dark">{form.yearModel || '-'}</strong>
                  </div>
                  <div className="bg-white rounded-xl border border-black/5 p-4 flex flex-col gap-1 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Versão</span>
                    <strong className="text-sm text-dark truncate" title={form.version}>{form.version || 'Automática'}</strong>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-[#f5f5f3] rounded-2xl p-6 border border-black/5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-dark">Referência FIPE</p>
                <span className="rounded-full bg-white border border-black/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">
                  {!hasAskingPrice && 'Preço pendente'}
                  {hasAskingPrice && comparison.status === 'below' && 'Abaixo'}
                  {hasAskingPrice && comparison.status === 'near' && 'Próximo'}
                  {hasAskingPrice && comparison.status === 'above' && 'Acima'}
                  {hasAskingPrice && comparison.status === 'unknown' && 'Sem ref.'}
                </span>
              </div>
              {!selectedYear ? (
                <p className="mt-2 text-sm text-text-secondary">Complete marca, modelo e ano para carregar os dados automáticos.</p>
              ) : fipeLoading ? (
                <p className="mt-2 text-sm text-text-secondary">Consultando valor atualizado...</p>
              ) : fipeResult ? (
                <div className="mt-3 grid gap-2 text-sm">
                  <p><strong>Versão automática:</strong> {form.version || 'Não informada'}</p>
                  <p><strong>Preço FIPE:</strong> {fipeResult.price}</p>
                  <p><strong>Seu anúncio:</strong> {hasAskingPrice ? formatBRL(priceNumber) : 'Informe o preço na próxima etapa'}</p>
                  {hasAskingPrice ? (
                    <>
                      <p><strong>Diferença:</strong> {comparison.diffValue === null ? '-' : formatBRL(comparison.diffValue)}</p>
                      <p><strong>Percentual:</strong> {comparison.diffPercent === null ? '-' : `${comparison.diffPercent.toFixed(2)}%`}</p>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  Não foi possível carregar referência FIPE para essa combinação, mas você pode continuar normalmente.
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-dark tracking-tight">Preço e descrição</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="w-full h-14 bg-[#f5f5f3] rounded-2xl px-5 text-sm font-bold outline-none border border-transparent focus:border-black/10 focus:bg-white transition-all placeholder:text-dark/30" placeholder="Preço pedido (R$)" value={form.price} onChange={(e) => handleInput('price', e.target.value)} />
              <input className="w-full h-14 bg-[#f5f5f3] rounded-2xl px-5 text-sm font-bold outline-none border border-transparent focus:border-black/10 focus:bg-white transition-all placeholder:text-dark/30" placeholder="Quilometragem" value={form.mileage} onChange={(e) => handleInput('mileage', e.target.value.replace(/\D/g, ''))} />
              <input className="w-full h-14 bg-[#f5f5f3] rounded-2xl px-5 text-sm font-bold outline-none border border-transparent focus:border-black/10 focus:bg-white transition-all placeholder:text-dark/30" placeholder="Cidade" value={form.city} onChange={(e) => handleInput('city', e.target.value)} />
              <input className="w-full h-14 bg-[#f5f5f3] rounded-2xl px-5 text-sm font-bold outline-none border border-transparent focus:border-black/10 focus:bg-white transition-all placeholder:text-dark/30" placeholder="Estado (UF)" value={form.state} onChange={(e) => handleInput('state', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))} />
            </div>

            <textarea className="w-full min-h-32 bg-[#f5f5f3] rounded-2xl px-5 py-4 text-sm font-bold outline-none border border-transparent focus:border-black/10 focus:bg-white transition-all placeholder:text-dark/30 resize-none" placeholder="Descrição do veículo" value={form.description} onChange={(e) => handleInput('description', e.target.value)} />
            <input className="w-full h-14 bg-[#f5f5f3] rounded-2xl px-5 text-sm font-bold outline-none border border-transparent focus:border-black/10 focus:bg-white transition-all placeholder:text-dark/30" placeholder="Opcionais (separados por vírgula)" value={form.optionalItems} onChange={(e) => handleInput('optionalItems', e.target.value)} />

            <label
              className="bg-[#f5f5f3] rounded-2xl flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-dark/20 p-8 text-sm font-black text-dark/40 hover:bg-dark/5 transition-colors"
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDrop={onDropFiles}
            >
              <ImagePlus className="h-6 w-6 mb-2" />
              Arraste fotos ou clique para enviar ({images.length}/{LISTING_MAX_IMAGES})
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/30 mt-2">Até 10 imagens • JPG, PNG, WEBP</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>
            <p className="text-xs font-semibold text-text-secondary">Você pode publicar sem foto e enviar imagens depois no painel dos seus anúncios.</p>

            {images.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                {images.map((image, index) => (
                  <div key={image.previewUrl} className="bg-[#f5f5f3] rounded-2xl overflow-hidden p-3 border border-black/5">
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} className="h-40 w-full rounded-xl object-cover" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">{index === 0 ? 'Foto principal' : `Foto ${index + 1}`}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-dark/40 hover:text-dark hover:shadow-sm transition-all border border-black/5" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                        <MoveLeft className="h-4 w-4" />
                      </button>
                      <button type="button" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-dark/40 hover:text-dark hover:shadow-sm transition-all border border-black/5" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                        <MoveRight className="h-4 w-4" />
                      </button>
                      <button type="button" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all border border-black/5 ml-auto" onClick={() => removeImage(index)}>
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
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-dark tracking-tight">Revisar e publicar</h3>
            <div className="bg-[#f5f5f3] rounded-2xl p-6 border border-black/5">
              <div className="grid gap-4 text-sm sm:grid-cols-2 font-medium text-dark/60">
                <p><strong className="text-dark font-bold">Veículo:</strong> {form.brand} {form.model} {form.version}</p>
                <p><strong className="text-dark font-bold">Ano:</strong> {form.year}/{form.yearModel}</p>
                <p><strong className="text-dark font-bold">Preço:</strong> {form.price ? formatBRL(parseMoneyInputToNumber(form.price)) : 'Não informado'}</p>
                <p><strong className="text-dark font-bold">Quilometragem:</strong> {form.mileage ? `${Number(form.mileage).toLocaleString('pt-BR')} km` : 'Não informado'}</p>
                <p><strong className="text-dark font-bold">Cidade/UF:</strong> {form.city || '-'}{form.state ? `/${form.state}` : ''}</p>
                <p><strong className="text-dark font-bold">Fotos:</strong> {images.length} de {LISTING_MAX_IMAGES}</p>
                <p className="sm:col-span-2"><strong className="text-dark font-bold">Descrição:</strong> {form.description.trim() || 'Não informada'}</p>
              </div>
            </div>

            <div className="bg-[#f5f5f3] rounded-2xl p-6 border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 mb-4">Ficha técnica automática</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Motorização</span>
                  <strong className="text-sm font-bold text-dark">{technical.engine}</strong>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Potência</span>
                  <strong className="text-sm font-bold text-dark">{technical.horsepower}</strong>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Torque</span>
                  <strong className="text-sm font-bold text-dark">{technical.torque}</strong>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Combustível</span>
                  <strong className="text-sm font-bold text-dark">{technical.fuel}</strong>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Câmbio</span>
                  <strong className="text-sm font-bold text-dark">{technical.transmission}</strong>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Consumo</span>
                  <strong className="text-sm font-bold text-dark">{technical.consumption}</strong>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Categoria</span>
                  <strong className="text-sm font-bold text-dark">{technical.category}</strong>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-dark/40 text-center mt-6">
              Seu contato direto não é exibido. Toda negociação acontece via chat interno da plataforma.
            </p>
          </div>
        )}

        {error ? (
          <div className="bg-red-50 rounded-2xl border border-red-100 px-6 py-5">
            <p className="text-sm font-bold text-red-700">{error}</p>
            {validationDetails.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-xs font-bold text-red-700/80">
                {validationDetails.map((detail) => (
                  <li key={detail}>• {detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {success ? (
          <div className="bg-green-50 rounded-2xl border border-green-100 px-6 py-5">
            <p className="text-sm font-bold text-green-700">{success}</p>
          </div>
        ) : null}

        <div className="mt-12 flex flex-col-reverse justify-between gap-4 sm:flex-row pt-6 border-t border-black/5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="h-14 px-8 rounded-full font-bold text-dark hover:bg-[#f5f5f3] transition-colors flex items-center justify-center gap-2"
              disabled={saving || fipeLoading}
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar etapa
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={currentStep === 3 ? handleSubmit : nextStep}
            className="h-14 px-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={saving || fipeLoading}
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Publicando...
              </>
            ) : currentStep === 3 ? (
              'Publicar anúncio'
            ) : (
              <>
                Próxima etapa
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

        {currentStep === 3 ? (
          <div className="fixed inset-x-0 bottom-3 z-30 px-4 sm:hidden">
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="w-full rounded-[999px] bg-dark px-6 py-4 text-sm font-black text-white shadow-sm disabled:opacity-50"
            >
              {saving ? 'Publicando...' : 'Publicar anúncio'}
            </button>
          </div>
        ) : null}
      </div>


    </div>
  )
}
