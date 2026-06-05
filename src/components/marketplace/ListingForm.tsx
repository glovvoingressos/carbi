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
  vehicle_type: 'car' | 'truck'
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
  // Truck-specific fields
  truck_type: string
  load_capacity: string
  axles: string
  truck_body_type: string
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
  vehicle_type: 'car',
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
  truck_type: '',
  load_capacity: '',
  axles: '',
  truck_body_type: '',
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
      if (!form.vehicle_type) {
        return 'Selecione o tipo de veículo.'
      }
      if (!selectedBrandCode || !selectedModelCode || !selectedYear || !form.brand || !form.model || !form.year || !form.yearModel) {
        return 'Selecione marca, modelo e ano para continuar.'
      }
    }

    if (step === 2) {
      if (!form.price || !form.mileage || !form.city || !form.state || !form.description.trim()) {
        return 'Preencha preço, quilometragem, cidade, estado e descrição.'
      }
      if (form.vehicle_type === 'truck') {
        if (!form.truck_type || !form.load_capacity || !form.axles || !form.truck_body_type) {
          return 'Para caminhões, preencha tipo, capacidade de carga, eixos e tipo de carroceria.'
        }
      }
    }

    if (step === 3) {
      if (!form.price || !form.mileage || !form.city || !form.state || !form.description.trim()) {
        return 'Complete preço, quilometragem, localização e descrição antes de publicar.'
      }
      if (form.vehicle_type === 'truck') {
        if (!form.truck_type || !form.load_capacity || !form.axles || !form.truck_body_type) {
          return 'Complete os campos específicos de caminhão.'
        }
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
          vehicle_type: form.vehicle_type,
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
          truck_type: form.vehicle_type === 'truck' ? form.truck_type : null,
          load_capacity: form.vehicle_type === 'truck' ? (form.load_capacity ? Number(form.load_capacity) : null) : null,
          axles: form.vehicle_type === 'truck' ? (form.axles ? Number(form.axles) : null) : null,
          truck_body_type: form.vehicle_type === 'truck' ? form.truck_body_type : null,
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
      ? 'bg-[#F2F2F7] text-[#0A0A0A] border border-[#E8E8E8]'
      : comparison.status === 'above'
      ? 'bg-[#F2F2F7] text-[#0A0A0A] border border-[#E8E8E8]'
      : comparison.status === 'near'
      ? 'bg-[#F2F2F7] text-[#0A0A0A] border border-[#E8E8E8]'
      : 'bg-[#F2F2F7] text-[#525252] border border-[#E8E8E8]'

  if (!sessionReady) {
    return (
      <div className="surface-strong p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#0A0A0A]" />
        <p className="mt-2 text-sm text-[#525252]">Carregando sessão...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="space-y-8 pb-4 max-w-3xl mx-auto">
      <div className="space-y-3">
        <div className="h-1.5 bg-[#FAFAF9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        <p className="label text-[#10B981]">
          {currentStep === 1 && 'Etapa 1 de 3: Selecione seu carro'}
          {currentStep === 2 && 'Etapa 2 de 3: Preço, descrição e fotos'}
          {currentStep === 3 && 'Etapa 3 de 3: Revisar e publicar'}
        </p>
      </div>

      <div className="surface-strong p-6 sm:p-8 space-y-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold font-bold text-[#0A0A0A] mb-2">Selecione seu veículo</h3>
              <p className="text-sm text-[#525252]">
                Escolha o tipo de veículo, depois marca, modelo e ano. O restante é automático.
              </p>
            </div>
            
            <div className="surface p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="label text-[#10B981]">Tipo de veículo</p>
                <span className="badge badge-brand text-[10px]">Obrigatório</span>
              </div>
              <select
                className="input"
                value={form.vehicle_type}
                onChange={(e) => handleInput('vehicle_type', e.target.value)}
              >
                <option value="car">Carro</option>
                <option value="truck">Caminhão</option>
              </select>
            </div>

            <div className="surface p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="label text-[#10B981]">Seleção do veículo</p>
                <span className="badge badge-neutral text-[10px]">Sequencial</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  className="input"
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
                  className="input"
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
                  className="input"
                  value={selectedYear ?? ''}
                  onChange={(e) => {
                    const code = e.target.value
                    setSelectedYear(Number(code))
                    setSelectedVersionCode('')
                    handleInput('year', code)
                    handleInput('yearModel', code)
                  }}
                >
                  <option value="">3. Selecione o ano</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              {selectedYear ? (
                <div className="grid gap-4 sm:grid-cols-3 mt-6">
                  <div className="bg-[#FAFAF9] rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Ano fab.</span>
                    <strong className="text-sm text-[#0A0A0A]">{form.year || '-'}</strong>
                  </div>
                  <div className="bg-[#FAFAF9] rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Ano/modelo</span>
                    <strong className="text-sm text-[#0A0A0A]">{form.yearModel || '-'}</strong>
                  </div>
                  <div className="bg-[#FAFAF9] rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Versão</span>
                    <strong className="text-sm text-[#0A0A0A] truncate" title={form.version}>{form.version || 'Automática'}</strong>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="surface-strong p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9F85F]/50 rounded-bl-full -z-10" />
              <div className="flex items-center justify-between gap-3 mb-6">
                <p className="text-lg font-semibold font-black text-[#0A0A0A]">Referência FIPE</p>
                <span className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm ${hasAskingPrice && comparison.status === 'below' ? 'bg-green-50 text-green-600 border-green-100' : hasAskingPrice && comparison.status === 'above' ? 'bg-red-50 text-red-600 border-red-100' : hasAskingPrice && comparison.status === 'near' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-[#FAFAF9] text-[#525252] border-[#EAEAE8]'}`}>
                  {!hasAskingPrice && 'Preço pendente'}
                  {hasAskingPrice && comparison.status === 'below' && 'Abaixo'}
                  {hasAskingPrice && comparison.status === 'near' && 'Próximo'}
                  {hasAskingPrice && comparison.status === 'above' && 'Acima'}
                  {hasAskingPrice && comparison.status === 'unknown' && 'Sem ref.'}
                </span>
              </div>
              {!selectedYear ? (
                <p className="text-sm font-medium text-[#525252] bg-[#FAFAF9] p-4 rounded-xl border border-[#EAEAE8]">Complete marca, modelo e ano para carregar os dados automáticos.</p>
              ) : fipeLoading ? (
                <p className="text-sm font-medium text-[#10B981] bg-[#FAFAF9] p-4 rounded-xl border border-[#EAEAE8] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Consultando valor atualizado...</p>
              ) : fipeResult ? (
                <div className="grid gap-3 text-sm font-medium text-[#525252]">
                  <div className="flex justify-between items-center py-2 border-b border-[#EAEAE8]"><span className="text-[#A3A3A3]">Versão automática:</span> <strong className="text-[#0A0A0A]">{form.version || 'Não informada'}</strong></div>
                  <div className="flex justify-between items-center py-2 border-b border-[#EAEAE8]"><span className="text-[#A3A3A3]">Preço FIPE:</span> <strong className="text-[#0A0A0A]">{fipeResult.price}</strong></div>
                  <div className="flex justify-between items-center py-2 border-b border-[#EAEAE8]"><span className="text-[#A3A3A3]">Seu anúncio:</span> <strong className="text-[#0A0A0A]">{hasAskingPrice ? formatBRL(priceNumber) : 'Informe o preço na próxima etapa'}</strong></div>
                  {hasAskingPrice ? (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-[#EAEAE8]"><span className="text-[#A3A3A3]">Diferença:</span> <strong className="text-[#0A0A0A]">{comparison.diffValue === null ? '-' : formatBRL(comparison.diffValue)}</strong></div>
                      <div className="flex justify-between items-center py-2"><span className="text-[#A3A3A3]">Percentual:</span> <strong className="text-[#0A0A0A]">{comparison.diffPercent === null ? '-' : `${comparison.diffPercent.toFixed(2)}%`}</strong></div>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm font-medium text-red-700 bg-red-50 p-4 rounded-xl border border-red-200">
                  Não foi possível carregar referência FIPE para essa combinação, mas você pode continuar normalmente.
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold font-bold text-[#0A0A0A] mb-2">Preço e descrição</h3>
              <p className="text-sm text-[#525252]">
                Preencha os detalhes para atrair mais compradores.
              </p>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Preço pedido (R$)" value={form.price} onChange={(e) => handleInput('price', e.target.value)} />
              <input className="input" placeholder="Quilometragem" value={form.mileage} onChange={(e) => handleInput('mileage', e.target.value.replace(/\D/g, ''))} />
              <input className="input" placeholder="Cidade" value={form.city} onChange={(e) => handleInput('city', e.target.value)} />
              <input className="input" placeholder="Estado (UF)" value={form.state} onChange={(e) => handleInput('state', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))} />
            </div>

            <textarea className="input min-h-[120px] py-3 resize-none leading-relaxed" placeholder="Descrição do veículo... Destaque os pontos fortes, manutenções recentes e opcionais." value={form.description} onChange={(e) => handleInput('description', e.target.value)} />
            <input className="input" placeholder="Opcionais extras (separados por vírgula)" value={form.optionalItems} onChange={(e) => handleInput('optionalItems', e.target.value)} />

            {form.vehicle_type === 'truck' && (
              <div className="card p-5 space-y-4">
                <h4 className="text-sm font-bold text-[#0A0A0A]">Informações do Caminhão</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" placeholder="Tipo (ex: Baú, Caçamba)" value={form.truck_type} onChange={(e) => handleInput('truck_type', e.target.value)} />
                  <input className="input" placeholder="Capacidade (toneladas)" value={form.load_capacity} onChange={(e) => handleInput('load_capacity', e.target.value.replace(/[^0-9.]/g, ''))} />
                  <input className="input" placeholder="Nº de eixos" value={form.axles} onChange={(e) => handleInput('axles', e.target.value.replace(/\D/g, ''))} />
                  <input className="input" placeholder="Tipo de carroceria" value={form.truck_body_type} onChange={(e) => handleInput('truck_body_type', e.target.value)} />
                </div>
              </div>
            )}

            <label
              className="surface border-2 border-dashed border-[#17170F]/18 p-8 flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 text-sm font-medium text-[#4F4A3E] hover:border-[#17170F]/30 hover:bg-[#D9F85F] transition-all group"
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDrop={onDropFiles}
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF8DF] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImagePlus className="h-6 w-6 text-[#17170F]" />
              </div>
              <span className="text-sm text-[#0A0A0A] mt-1">Arraste fotos ou clique ({images.length}/{LISTING_MAX_IMAGES})</span>
              <span className="badge badge-brand text-[10px] mt-1">JPG, PNG, WEBP • Até 10 imagens</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>
            <p className="text-xs text-[#A3A3A3] text-center">Você pode publicar sem foto e enviar depois no painel.</p>

            {images.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
                {images.map((image, index) => (
                  <div key={image.previewUrl} className="surface p-3 hover:shadow-md transition-shadow">
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} width={1080} height={1080} className="aspect-square w-full rounded-xl object-cover" />
                    <p className="mt-4 px-2 text-[10px] font-black uppercase tracking-widest text-[#525252]">{index === 0 ? 'Foto principal' : `Foto ${index + 1}`}</p>
                    <div className="mt-3 flex items-center gap-2 px-2 pb-1">
                      <button type="button" className="w-10 h-10 rounded-xl bg-[#FAFAF9] flex items-center justify-center text-[#525252] hover:text-[#10B981] hover:bg-[#FAFAF9]/80 transition-colors" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                        <MoveLeft className="h-4 w-4" />
                      </button>
                      <button type="button" className="w-10 h-10 rounded-xl bg-[#FAFAF9] flex items-center justify-center text-[#525252] hover:text-[#10B981] hover:bg-[#FAFAF9]/80 transition-colors" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                        <MoveRight className="h-4 w-4" />
                      </button>
                      <button type="button" className="w-10 h-10 rounded-xl bg-[#FAFAF9] flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-auto" onClick={() => removeImage(index)}>
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
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold font-bold text-[#0A0A0A] mb-2">Revisar e publicar</h3>
              <p className="text-sm text-[#525252]">
                Confira os detalhes antes de finalizar.
              </p>
            </div>
            
            <div className="card p-5 relative overflow-hidden">
              <p className="label text-[#16855C] mb-4">Informações</p>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="flex flex-col gap-0.5 border-b border-[#EAEAE8] pb-2"><span className="text-xs text-[#A3A3A3]">Veículo</span><strong className="text-sm text-[#0A0A0A]">{form.brand} {form.model} {form.version}</strong></div>
                <div className="flex flex-col gap-0.5 border-b border-[#EAEAE8] pb-2"><span className="text-xs text-[#A3A3A3]">Ano</span><strong className="text-sm text-[#0A0A0A]">{form.year}/{form.yearModel}</strong></div>
                <div className="flex flex-col gap-0.5 border-b border-[#EAEAE8] pb-2"><span className="text-xs text-[#A3A3A3]">Preço</span><strong className="text-sm text-[#0A0A0A]">{form.price ? formatBRL(parseMoneyInputToNumber(form.price)) : 'Não informado'}</strong></div>
                <div className="flex flex-col gap-0.5 border-b border-[#EAEAE8] pb-2"><span className="text-xs text-[#A3A3A3]">Quilometragem</span><strong className="text-sm text-[#0A0A0A]">{form.mileage ? `${Number(form.mileage).toLocaleString('pt-BR')} km` : 'Não informado'}</strong></div>
                <div className="flex flex-col gap-0.5 border-b border-[#EAEAE8] pb-2"><span className="text-xs text-[#A3A3A3]">Cidade/UF</span><strong className="text-sm text-[#0A0A0A]">{form.city || '-'}{form.state ? `/${form.state}` : ''}</strong></div>
                <div className="flex flex-col gap-0.5 border-b border-[#EAEAE8] pb-2"><span className="text-xs text-[#A3A3A3]">Fotos</span><strong className="text-sm text-[#0A0A0A]">{images.length} de {LISTING_MAX_IMAGES}</strong></div>
                <div className="sm:col-span-2 flex flex-col gap-2 mt-1"><span className="text-xs text-[#A3A3A3]">Descrição</span><p className="text-sm text-[#0A0A0A] bg-[#FAFAF9] p-4 rounded-xl leading-relaxed">{form.description.trim() || 'Não informada'}</p></div>
              </div>
            </div>

            <div className="surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981] font-bold text-[10px]">AI</span>
                <p className="label">Ficha técnica automática</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Motor</span>
                  <strong className="text-sm font-semibold text-[#0A0A0A]">{technical.engine}</strong>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Potência</span>
                  <strong className="text-sm font-semibold text-[#0A0A0A]">{technical.horsepower}</strong>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Torque</span>
                  <strong className="text-sm font-semibold text-[#0A0A0A]">{technical.torque}</strong>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Combustível</span>
                  <strong className="text-sm font-semibold text-[#0A0A0A]">{technical.fuel}</strong>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Câmbio</span>
                  <strong className="text-sm font-bold text-[#0A0A0A]">{technical.transmission}</strong>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5 lg:col-span-2">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Consumo</span>
                  <strong className="text-sm font-bold text-[#0A0A0A]">{technical.consumption}</strong>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Categoria</span>
                  <strong className="text-sm font-bold text-[#0A0A0A]">{technical.category}</strong>
                </div>
              </div>
            </div>

            <div className="bg-[#E9FFF2] border border-[#16855C]/20 rounded-2xl p-4 flex items-center justify-center text-center">
              <p className="text-xs font-bold text-[#16855C]">
                Seu contato direto não é exibido. Toda negociação acontece via chat seguro da plataforma.
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-6 shadow-sm">
            <p className="text-sm font-bold text-red-600">{error}</p>
            {validationDetails.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-xs font-bold text-red-600/80 bg-white/50 p-4 rounded-xl">
                {validationDetails.map((detail) => (
                  <li key={detail}>• {detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {success ? (
          <div className="bg-[#E9FFF2] rounded-2xl border border-[#16855C]/20 p-6 shadow-sm text-center">
            <p className="text-base font-black text-[#16855C]">{success}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row pt-6 border-t border-white/70">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-secondary btn-sm"
              disabled={saving || fipeLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={currentStep === 3 ? handleSubmit : nextStep}
            className="btn btn-primary"
            disabled={saving || fipeLoading}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : currentStep === 3 ? (
              'Publicar anúncio'
            ) : (
              <>
                Próxima etapa
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {currentStep === 3 ? (
          <div className="fixed inset-x-0 bottom-20 z-30 px-4 sm:hidden">
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="btn btn-primary w-full shadow-lg"
            >
              {saving ? 'Publicando...' : 'Publicar anúncio'}
            </button>
          </div>
        ) : null}
      </div>


    </div>
  )
}
