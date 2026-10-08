'use client'

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, ArrowLeft, ImagePlus, MoveLeft, MoveRight, Trash2, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { FipeResult } from '@/lib/fipe-api'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { trackEvent } from '@/lib/analytics'
import { lookupPlateClient, readPlateLookup } from '@/lib/integrations/placaapi/client'
import type { PlacaApiResponse } from '@/lib/integrations/placaapi/types'
import PlateInput from '@/components/marketplace/PlateInput'
import ListingStepper from '@/components/marketplace/ListingStepper'
import {
  ACCOUNT_INITIAL,
  ACCOUNT_INPUT_IDS,
  formatCPF,
  formatPhone,
  getAccountErrors as getAccountErrorsShared,
  type AccountField,
} from '@/components/marketplace/account-fields'
import {
  LISTING_ALLOWED_TYPES,
  LISTING_MAX_IMAGES,
  LISTING_MAX_IMAGE_SIZE_MB,
  buildFipeSnapshot,
  buildFipeResultFromPlateLookup,
  getListingImageRejection,
  getFipeComparison,
  normalizeOptionalItems,
  normalizePlateFinal,
  formatBrazilianInt,
  parseBrazilianInt,
  parseMoneyInputToNumber,
} from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import { enrichVehicle } from '@/lib/vehicle-enrichment'
import { brandsAreEquivalent } from '@/lib/brand-normalization'
import { parseDescription } from '@/lib/format-description'
import FadeContent from '@/components/FadeContent'
import { FUEL_OPTIONS, TRANSMISSION_OPTIONS } from '@/lib/vehicle-filter-normalization'
import {
  LISTING_DRAFT_KEY,
  clearListingDraftImages,
  loadListingDraftImages,
  parseListingDraft,
  saveListingDraftImages,
  serializeListingDraft,
} from '@/lib/listing-draft'

// Format price input: 123456 -> 123.456 (reais)
const formatPriceInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  const num = parseInt(numbers, 10)
  return num.toLocaleString('pt-BR')
}

// Parse formatted price: 123.456 -> 123456 (number as string, reais)
const parsePriceInput = (value: string): string => {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return ''
  return String(num)
}

interface UploadImageItem {
  id: string
  file: File
  previewUrl: string
}

type PlateFormData = {
  brand: string
  model: string
  year: number
  yearModel: number
  color: string
  fuel: string
  engine: string
  horsepower: string
  transmission: string
  bodyType: string
  plate: string
  version: string
  fipePrice?: number | null
  fipeReference?: string | null
  truck_type?: string | null
  truck_body_type?: string | null
  load_capacity?: number | null
  axles?: number | null
  cabin_type?: string | null
  pbt?: number | null
  cmt?: number | null
  truck_category?: string | null
  structured_data?: Record<string, unknown>
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
  truck_type: string
  load_capacity: string
  axles: string
  truck_body_type: string
  cabin_type: string
  pbt: string
  cmt: string
  truck_category: string
  structured_data: Record<string, unknown>
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
  cabin_type: '',
  pbt: '',
  cmt: '',
  truck_category: '',
  structured_data: {},

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

const BRAZIL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

function withSelectOption(options: readonly string[], value: string): string[] {
  if (!value) return [...options]
  const match = options.find((option) => normalize(option) === normalize(value))
  return match ? [...options] : [value, ...options]
}

function canonicalOption(options: readonly string[], value: string): string {
  return options.find((option) => normalize(option) === normalize(value)) || value
}

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export default function ListingForm({ vehicleType = 'car' }: { vehicleType?: 'car' | 'truck' }) {
  const supabaseReady = isSupabaseBrowserConfigured()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [listingSubStep, setListingSubStep] = useState(1)
  const [form, setForm] = useState<FormState>({ ...INITIAL_STATE, vehicle_type: vehicleType })
  const [images, setImages] = useState<UploadImageItem[]>([])

  const [fipeResult, setFipeResult] = useState<FipeResult | null>(null)
  const [catalogCars, setCatalogCars] = useState<CatalogCar[]>([])
  const [technical, setTechnical] = useState<TechnicalSnapshot>(EMPTY_TECHNICAL)
  const plateFipeLookupRef = useRef(false)

  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [fipeLoading, setFipeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [account, setAccount] = useState(ACCOUNT_INITIAL)
  const [accountEmailExists, setAccountEmailExists] = useState(false)
  const [validationDetails, setValidationDetails] = useState<string[]>([])
  const [imageErrors, setImageErrors] = useState<string[]>([])
  const [manualVehicleMode, setManualVehicleMode] = useState(false)
  const [titleTouched, setTitleTouched] = useState(false)
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, boolean>>>({})
  const [accountErrors, setAccountErrors] = useState<Partial<Record<keyof typeof ACCOUNT_INITIAL, string>>>({})
  const draftHydrated = useRef(false)
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const [draftReady, setDraftReady] = useState(false)

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

  useEffect(() => {
    let cancelled = false
    const restoreDraft = async () => {
      let parsed: { form: FormState; currentStep: number; listingSubStep: number } | null = null
      try {
        parsed = parseListingDraft<FormState>(localStorage.getItem(LISTING_DRAFT_KEY))
      } catch {
        // Continue with an empty draft when browser storage is unavailable.
      }
      if (parsed && !cancelled) {
        setForm({ ...INITIAL_STATE, ...parsed.form, plateFinal: normalizePlateFinal(parsed.form.plateFinal) || '' })
        setCurrentStep(parsed.currentStep)
        setListingSubStep(parsed.listingSubStep)
      }

      try {
        const savedImages = await loadListingDraftImages()
        if (cancelled) return
        setImages(savedImages.map((image) => ({
          id: image.id,
          file: new File([image.blob], image.name, { type: image.type, lastModified: image.lastModified }),
          previewUrl: URL.createObjectURL(image.blob),
        })))
      } catch {
        // A browser without IndexedDB can still recover the text fields.
      } finally {
        if (!cancelled) {
          draftHydrated.current = true
          setDraftReady(true)
        }
      }
    }

    void restoreDraft()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!draftReady) return
    const queryPlate = new URLSearchParams(window.location.search).get('placa')
    let cached: PlacaApiResponse | null = null

    try {
      cached = readPlateLookup()
    } catch {
      cached = null
    }

    const plate = queryPlate || cached?.placa || ''
    if (!plate) return

    // Keep backwards compatibility with old links, but remove the sensitive
    // value from the visible URL as soon as the flow is opened.
    if (queryPlate) {
      const url = new URL(window.location.href)
      url.searchParams.delete('placa')
      window.history.replaceState(window.history.state, '', url)
    }

    const applyData = (data: PlacaApiResponse) => {
      setForm((prev) => ({
        ...prev,
        brand: data.marca,
        model: data.modelo,
        version: data.versao || prev.version,
        year: data.anoFabricacao ? String(data.anoFabricacao) : prev.year,
        yearModel: (data.anoModelo || data.anoFabricacao) ? String(data.anoModelo || data.anoFabricacao) : prev.yearModel,
        color: data.cor,
        fuel: data.combustivel || prev.fuel,
        engine: data.cilindradas || prev.engine,
        horsepower: data.potencia || prev.horsepower,
        transmission: data.cambio || 'Automático',
        bodyType: data.tipoVeiculo || prev.bodyType,
        plateFinal: normalizePlateFinal(data.placa || plate) || '',
      }))
      const nextFipeResult = data.fipe_price && data.fipe_price > 0
        ? buildFipeResultFromPlateLookup({
          brand: data.marca,
          model: data.modelo,
          yearModel: data.anoModelo || data.anoFabricacao,
          fuel: data.combustivel || '',
          plate: data.placa || plate,
          fipePrice: data.fipe_price,
          fipeReference: data.fipe_reference_month,
        })
        : null
      plateFipeLookupRef.current = Boolean(nextFipeResult)
      setFipeResult(nextFipeResult)
      setListingSubStep(2)
    }

    try {
      if (cached) {
        applyData(cached)
        return
      }
      void lookupPlateClient(plate)
        .then((data) => {
          if (data?.marca) applyData(data)
        })
        .catch(() => {
          setError('Não conseguimos consultar essa placa agora. Você pode preencher os dados manualmente.')
        })
    } catch {
      // ignore malformed cache
    }
  }, [draftReady])

  useEffect(() => {
    if (!draftHydrated.current) return
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(LISTING_DRAFT_KEY, serializeListingDraft({ form, currentStep, listingSubStep }))
      } catch {
        // Private browsing or a full storage quota should not block publishing.
      }
      void saveListingDraftImages(images.map((image) => ({
        id: image.id,
        name: image.file.name,
        type: image.file.type,
        lastModified: image.file.lastModified,
        blob: image.file,
      }))).catch(() => undefined)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [form, currentStep, listingSubStep, images])

  useEffect(() => {
    if (!draftHydrated.current) return
    const url = new URL(window.location.href)
    url.searchParams.set('etapa', String(currentStep))
    url.searchParams.set('subetapa', String(listingSubStep))
    window.history.replaceState(window.history.state, '', url)
  }, [currentStep, listingSubStep])

  useEffect(() => {
    if (!draftReady) return
    const timeout = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      stepHeadingRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [currentStep, listingSubStep, draftReady])

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

      const { data: authData } = supabase.auth.onAuthStateChange((_event: string, session: { access_token?: string; user?: { id?: string } } | null) => {
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
    if (currentStep < 2) return
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
  }, [currentStep])

  useEffect(() => {
    if (currentStep !== 2 || fipeResult) return
    if (!form.brand.trim() || !form.model.trim() || !form.yearModel.trim()) return

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setFipeLoading(true)
      try {
        const params = new URLSearchParams({
          brand: form.brand.trim(),
          model: form.model.trim(),
          year: form.yearModel.trim(),
        })
        if (form.version.trim()) params.set('version', form.version.trim())
        const response = await fetch(`/api/fipe/price?${params.toString()}`, { signal: AbortSignal.timeout(15000) })
        const data = response.ok ? ((await response.json()) as FipeResult) : null
        if (!cancelled) setFipeResult(data?.price ? data : null)
      } catch {
        if (!cancelled) setFipeResult(null)
      } finally {
        if (!cancelled) setFipeLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      setFipeLoading(false)
    }
  }, [currentStep, form.brand, form.model, form.yearModel, form.version, fipeResult])

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
    const engineText = enriched.engine || (inferredEngine !== 'Não informado' ? inferredEngine : '') || form.engine || 'Não informado'
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
  const fipeComparisonStatusLabel =
    !fipeResult
      ? 'Sem referência'
      : !hasAskingPrice
      ? 'Informe o preço'
      : comparison.status === 'below'
      ? 'Abaixo da FIPE'
      : comparison.status === 'above'
      ? 'Acima da FIPE'
      : comparison.status === 'near'
      ? 'Na média da FIPE'
      : 'Sem referência'
  const fipeComparisonStatusClass =
    !fipeResult || !hasAskingPrice
      ? 'bg-white/10 text-white/70 border border-white/15'
      : comparison.status === 'below'
      ? 'bg-[#D4F576]/20 text-[#D4F576] border border-[#D4F576]/30'
      : comparison.status === 'above'
      ? 'bg-[#FF6B52]/20 text-[#FF6B52] border border-[#FF6B52]/30'
      : 'bg-[#D4F576]/15 text-[#D4F576] border border-[#D4F576]/25'
  const fipeProgressWidth =
    !fipeResult || !hasAskingPrice
      ? '50%'
      : comparison.status === 'below'
      ? '34%'
      : comparison.status === 'above'
      ? '66%'
      : '50%'
  const fipeDiffValueLabel =
    comparison.diffValue === null
      ? null
      : `${comparison.diffValue > 0 ? '+' : '-'} ${formatBRL(Math.abs(comparison.diffValue))}`
  const fipeDiffPercentLabel =
    comparison.diffPercent === null
      ? null
      : `${comparison.diffPercent > 0 ? '+' : '-'}${Math.abs(comparison.diffPercent).toFixed(1)}%`
  const resolvedTransmissionValue = form.transmission || (technical.transmission !== 'Não informado' ? technical.transmission : '')
  const resolvedFuelValue = form.fuel || (technical.fuel !== 'Não informado' ? technical.fuel : '')
  const resolvedBodyTypeValue = form.bodyType || (technical.category !== 'Não informado' ? technical.category : '')
  const requiredItems = [
    { label: 'Marca', complete: Boolean(form.brand.trim()) },
    { label: 'Modelo', complete: Boolean(form.model.trim()) },
    // Versão é opcional (preenchida pela API quando disponível)
    { label: 'Ano', complete: Boolean(form.year.trim() && form.yearModel.trim()) },
    { label: 'Quilometragem', complete: Boolean(form.mileage.trim()) },
    { label: 'Combustível', complete: Boolean(resolvedFuelValue.trim()) },
    { label: 'Câmbio', complete: Boolean(resolvedTransmissionValue.trim()) },
    { label: 'Cor', complete: Boolean(form.color.trim()) },
    { label: 'Preço', complete: hasAskingPrice },
    { label: 'Cidade', complete: Boolean(form.city.trim()) },
    { label: 'Estado', complete: /^[A-Za-z]{2}$/.test(form.state) },
    { label: 'Fotos', complete: images.length > 0 },
  ]
  const recommendedItems = [
    { label: 'Descrição', complete: form.description.trim().length >= 20 },
    { label: 'Opcionais', complete: normalizeOptionalItems(form.optionalItems).length > 0 },
     { label: 'FIPE consultada', complete: form.vehicle_type === 'truck' || Boolean(fipeResult?.price) },
    { label: 'Categoria', complete: Boolean(resolvedBodyTypeValue.trim()) },
    { label: 'Motor', complete: Boolean(form.engine.trim() || technical.engine !== 'Não informado') },
    { label: 'Potência', complete: Boolean(form.horsepower.trim() || technical.horsepower !== 'Não informado') },
    { label: 'Final de placa', complete: Boolean(form.plateFinal.trim()) },
    { label: 'Portas', complete: Boolean(form.doors.trim()) },
    { label: 'VIN', complete: Boolean(form.vin.trim()) },
  ]
  const requiredCompleted = requiredItems.filter((item) => item.complete).length
  const recommendedCompleted = recommendedItems.filter((item) => item.complete).length
  const missingRequiredLabels = requiredItems.filter((item) => !item.complete).map((item) => item.label)
  const qualityScore = Math.min(
    100,
    Math.round((requiredCompleted / requiredItems.length) * 65 + (recommendedCompleted / recommendedItems.length) * 35),
  )
  const qualityLabel = qualityScore >= 100 ? 'Máxima Transparência' : qualityScore >= 95 ? 'Anúncio Completo' : 'Anúncio Básico'

  const handleInput = (field: keyof FormState, value: string) => {
    if (field === 'title') setTitleTouched(true)
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: false }))
    if (['brand', 'model', 'year', 'yearModel', 'version'].includes(field)) {
      plateFipeLookupRef.current = false
      setFipeResult(null)
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (!form.brand || !form.model || !form.yearModel) return
    if (titleTouched && form.title.trim().length >= 8) return

    const yearSuffix = form.yearModel && !form.model.includes(form.yearModel) ? ` ${form.yearModel}` : ''
    const versionSuffix = form.version && !form.model.includes(form.version) ? ` ${form.version}` : ''
    const nextTitle = `${form.brand} ${form.model}${yearSuffix}${versionSuffix}`.trim()
    if (!nextTitle) return

    setForm((prev) => ({
      ...prev,
      title: nextTitle,
    }))
  }, [form.brand, form.model, form.yearModel, form.version, form.title, titleTouched])

  const handleImageSelect = (fileList: FileList | null) => {
    if (!fileList) return

    const next = [...images]
    const rejections: string[] = []
    Array.from(fileList).forEach((file) => {
      const rejection = getListingImageRejection(file, next.length)
      if (rejection) {
        if (!rejections.includes(rejection)) rejections.push(rejection)
        return
      }
      next.push({
        id: `${file.name}-${file.lastModified}-${file.size}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    })

    setImages(next)
    setImageErrors(rejections)
    if (next.length > 0) setFieldErrors((prev) => ({ ...prev, images: false }))
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
    setIsDraggingImages(false)
    handleImageSelect(event.dataTransfer.files)
  }

  const FIELD_INPUT_IDS: Record<string, string> = {
    brand: 'manual-brand',
    model: 'manual-model',
    year: 'manual-year',
    yearModel: 'manual-year-model',
    price: 'listing-price',
    mileage: 'listing-mileage',
    fuel: 'listing-fuel',
    transmission: 'listing-transmission',
    color: 'listing-color',
    city: 'listing-city',
    state: 'listing-state',
    images: 'listing-images',
  }

  const getMissingFields = (step: number): Array<{ key: string; label: string }> => {
    const items = step === 1
      ? [
        { key: 'brand', label: 'marca', complete: Boolean(form.brand.trim()) },
        { key: 'model', label: 'modelo', complete: Boolean(form.model.trim()) },
        { key: 'year', label: 'ano', complete: Boolean(form.year.trim()) },
        { key: 'yearModel', label: 'ano/modelo', complete: Boolean(form.yearModel.trim()) },
      ]
      : step === 2
      ? [
        { key: 'price', label: 'Preço', complete: hasAskingPrice },
        { key: 'mileage', label: 'Quilometragem', complete: Boolean(form.mileage.trim()) },
        { key: 'fuel', label: 'Combustível', complete: Boolean(resolvedFuelValue.trim()) },
        { key: 'transmission', label: 'Câmbio', complete: Boolean(resolvedTransmissionValue.trim()) },
        { key: 'color', label: 'Cor', complete: Boolean(form.color.trim()) },
        { key: 'city', label: 'Cidade', complete: Boolean(form.city.trim()) },
        { key: 'state', label: 'Estado', complete: /^[A-Za-z]{2}$/.test(form.state) },
        { key: 'images', label: 'Fotos', complete: images.length > 0 },
      ]
      : []
    return items.filter((item) => !item.complete).map(({ key, label }) => ({ key, label }))
  }

  const validateStep = (step: number): string | null => {
    if (step === 3) {
      if (missingRequiredLabels.length > 0) {
        return `Complete os dados obrigatórios: ${missingRequiredLabels.join(', ')}.`
      }
      return null
    }

    const missing = getMissingFields(step)
    if (missing.length > 0) {
      return `Preencha: ${missing.map((item) => item.label).join(', ')}.`
    }
    return null
  }

  const markInvalidFields = (step: number) => {
    const keys = getMissingFields(step).map((item) => item.key)
    setFieldErrors(Object.fromEntries(keys.map((key) => [key, true])))
    const firstId = keys[0] ? FIELD_INPUT_IDS[keys[0]] : undefined
    if (firstId) window.setTimeout(() => document.getElementById(firstId)?.focus(), 0)
  }

  const nextStep = () => {
    const validation = validateStep(currentStep)
    if (validation) {
      setError(validation)
      setValidationDetails([])
      markInvalidFields(currentStep)
      return
    }
    setError(null)
    setValidationDetails([])
    setFieldErrors({})
    setListingSubStep(1)
    setCurrentStep((prev) => Math.min(3, prev + 1))
  }

  const prevStep = () => {
    setError(null)
    setValidationDetails([])
    if (currentStep === 1 && listingSubStep > 1) {
      setListingSubStep((prev) => prev - 1)
      return
    }
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubStepNext = () => {
    if (listingSubStep === 1) {
      const hasVehicle = Boolean(form.brand.trim() && form.model.trim() && form.year.trim() && form.yearModel.trim())
      if (!hasVehicle) {
        setError('Busque a placa ou preencha os dados manualmente para continuar.')
        return
      }
    }
    setError(null)
    setListingSubStep((prev) => Math.min(4, prev + 1))
  }

  const startManualVehicleEntry = () => {
    setManualVehicleMode(true)
    setError(null)
    setForm((prev) => ({
      ...prev,
      brand: '',
      model: '',
      version: '',
      year: '',
      yearModel: '',
      engine: '',
      horsepower: '',
      fuel: '',
      transmission: '',
      bodyType: '',
      plateFinal: '',
    }))
  }

  const continueManualVehicleEntry = () => {
    const validation = validateStep(1)
    if (validation) {
      setError(validation)
      markInvalidFields(1)
      return
    }
    setError(null)
    setFieldErrors({})
    setManualVehicleMode(false)
    setListingSubStep(2)
  }

  const getAccountErrors = (): Array<{ key: AccountField; message: string }> => getAccountErrorsShared(account)

  const handleSubmit = async () => {
    if (saving) return

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
      if (!isAuthenticated) {
        const accountErrors = getAccountErrors()
        if (accountErrors.length > 0) {
          setError(accountErrors[0].message)
          setAccountErrors(Object.fromEntries(accountErrors.map((item) => [item.key, item.message])))
          window.setTimeout(() => document.getElementById(ACCOUNT_INPUT_IDS[accountErrors[0].key])?.focus(), 0)
          return
        }
        setAccountErrors({})
        const signupRes = await fetch('/api/auth/signup-publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: account.email.trim().toLowerCase(),
            password: account.password,
            full_name: account.name.trim(),
            phone: account.phone.replace(/\D/g, ''),
            cpf: account.cpf.replace(/\D/g, ''),
          }),
        })
        if (signupRes.status === 409) {
          setAccountEmailExists(true)
          setError('Este e-mail já está cadastrado. Faça login para publicar seu anúncio.')
          return
        }
        if (!signupRes.ok) {
          const body = await signupRes.json().catch(() => ({}))
          setError(body?.error || 'Não foi possível criar sua conta.')
          return
        }
        const supabaseLocal = getSupabaseBrowserClient()
        const { error: signInError } = await supabaseLocal.auth.signInWithPassword({
          email: account.email.trim().toLowerCase(),
          password: account.password,
        })
        if (signInError) {
          setError('Conta criada, mas não foi possível entrar automaticamente. Faça login para publicar.')
          return
        }
      }

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
      const yearSuffix = form.yearModel && !form.model.includes(form.yearModel) ? ` ${form.yearModel}` : ''
      const versionSuffix = form.version && !form.model.includes(form.version) ? ` ${form.version}` : ''
      const generatedTitle = `${form.brand} ${form.model}${yearSuffix}${versionSuffix}`
        .replace(/\s+/g, ' ')
        .trim()
      const resolvedTitle = form.title.trim().length >= 8 ? form.title.trim() : generatedTitle

      const createResponse = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: authHeader(session.access_token),
        body: JSON.stringify({
          title: resolvedTitle,
          description: form.description,
          vehicle_type: form.vehicle_type,
          brand: form.brand,
          model: form.model,
          version: form.version,
          year: parseBrazilianInt(form.year),
          year_model: parseBrazilianInt(form.yearModel),
          mileage: parseBrazilianInt(form.mileage),
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
          plate_final: normalizePlateFinal(form.plateFinal),
          doors: form.doors ? Number(form.doors) : null,
          vin: form.vin ? form.vin.trim().toUpperCase() : null,
          ...(form.vehicle_type === 'truck' ? {
            truck_type: form.truck_type || null,
            load_capacity: form.load_capacity ? parseBrazilianInt(form.load_capacity) : null,
            axles: form.axles ? parseBrazilianInt(form.axles) : null,
            truck_body_type: form.truck_body_type || null,
            cabin_type: form.cabin_type || null,
            pbt: form.pbt ? parseBrazilianInt(form.pbt) : null,
            cmt: form.cmt ? parseBrazilianInt(form.cmt) : null,
            truck_category: form.truck_category || null,
          } : {}),
          ...fipeSnapshot,

            structured_data: {
             ...form.structured_data,
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

      const created = (await createResponse.json()) as { id: string; slug: string; emailStatus?: unknown }
      const uploaded: Array<{ storage_path: string; public_url: string; sort_order: number; is_primary: boolean }> = []

      try {
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

        const imageResponse = await fetch(`/api/marketplace/listings/${created.id}/images`, {
          method: 'POST',
          headers: authHeader(session.access_token),
          body: JSON.stringify({ images: uploaded }),
        })

        if (!imageResponse.ok) {
          const body = await imageResponse.json().catch(() => ({}))
          throw new Error(body.error || 'Falha ao persistir imagens do anúncio.')
        }
      } catch (imageError) {
        const uploadedPaths = uploaded.map((image) => image.storage_path).filter(Boolean)
        if (uploadedPaths.length > 0) {
          await supabase.storage.from('vehicle-listings').remove(uploadedPaths)
        }
        await fetch(`/api/marketplace/listings/${created.id}`, {
          method: 'DELETE',
          headers: authHeader(session.access_token),
        }).catch(() => null)
        throw imageError
      }

      localStorage.removeItem(LISTING_DRAFT_KEY)
      await clearListingDraftImages()
      setSuccess('Anúncio publicado com sucesso. Redirecionando...')

      trackEvent('create_listing', {
        item_brand: form.brand || '',
        item_model: form.model || '',
        price: form.price ? Number(form.price) : 0,
        currency: 'BRL',
      })
      setTimeout(() => {
        router.push(`/anuncios/${created.slug}`)
      }, 800)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao publicar anúncio.')
    } finally {
      setSaving(false)
    }
  }

  const handleAccountInput = (field: keyof typeof ACCOUNT_INITIAL, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }))
    if (field === 'email') setAccountEmailExists(false)
    if (accountErrors[field]) setAccountErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  if (!sessionReady) {
    return (
      <div className="listing-form-ref fingen-flow-form fingen-flow-form-card p-8 text-center" role="status" aria-live="polite">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#1A1A1A]" />
        <p className="mt-2 text-sm text-[#525252]">Carregando sessão...</p>
      </div>
    )
  }

  return (
    <div
      className={`listing-form-ref space-y-6 sm:space-y-8 w-full max-w-none sm:max-w-3xl mx-auto ${currentStep === 3 ? 'pb-28 sm:pb-4' : 'pb-4'}`}
      aria-busy={saving || fipeLoading}
    >
      <ListingStepper currentStep={currentStep} onStepChange={(step) => {
        if (step < currentStep) {
          setError(null)
          setValidationDetails([])
          setListingSubStep(1)
          setCurrentStep(step)
        }
      }} />

      <div className="space-y-6">
        <FadeContent
          key={`${currentStep}-${listingSubStep}`}
          className="listing-flow-step-transition"
          duration={260}
          threshold={0}
          initialOpacity={0}
        >
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="tfp-section-title outline-none">Selecione seu veículo</h2>
              <p className="tfp-section-sub">
                Comece pela placa. Com ela puxamos todos os dados automaticamente.
              </p>
            </div>

            <input type="hidden" value={form.vehicle_type} />

            {/* Sub-step 1: Plate Lookup */}
            {listingSubStep === 1 && (
              <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-3 sm:space-y-4 animate-fade-in">
                {manualVehicleMode ? (
                  <div className="space-y-4">
                    <div>
                      <p className="fingen-flow-field-label">Preencher manualmente</p>
                      <p className="mt-1 text-[13px] text-[#767676]">Não conseguimos consultar a placa? Informe os dados básicos para continuar.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ['manual-brand', 'brand', 'Marca', 'Ex: Volkswagen'],
                        ['manual-model', 'model', 'Modelo', 'Ex: T-Cross'],
                        ['manual-year', 'year', 'Ano de fabricação', 'Ex: 2020'],
                        ['manual-year-model', 'yearModel', 'Ano/modelo', 'Ex: 2021'],
                      ].map(([id, field, label, placeholder]) => (
                        <div key={id}>
                          <label htmlFor={id} className="listing-flow-field-label">{label}</label>
                          <input
                            id={id}
                            className="fingen-flow-input listing-flow-input-field mt-1"
                            value={form[field as keyof FormState] as string}
                            onChange={(event) => handleInput(field as keyof FormState, event.target.value)}
                            placeholder={placeholder}
                            aria-invalid={fieldErrors[field] || undefined}
                            aria-describedby={fieldErrors[field] ? `${id}-error` : undefined}
                          />
                          {fieldErrors[field] ? <p id={`${id}-error`} className="listing-field-error">Campo obrigatório.</p> : null}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={continueManualVehicleEntry} className="fingen-flow-btn-primary w-full">
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => { setManualVehicleMode(false); setError(null) }} className="w-full text-center text-[13px] text-[#767676] font-medium hover:text-[#1A1A1A]">
                      Voltar para consulta por placa
                    </button>
                  </div>
                ) : (
                  <>
                    <PlateInput onPlateFound={(data: PlateFormData) => {
                      setManualVehicleMode(false)
                      handleInput('brand', data.brand)
                      handleInput('model', data.model)
                      handleInput('year', String(data.year))
                      handleInput('yearModel', String(data.yearModel))
                      handleInput('color', data.color)
                      handleInput('fuel', data.fuel)
                      handleInput('engine', data.engine)
                      handleInput('horsepower', data.horsepower)
                      handleInput('transmission', data.transmission)
                      handleInput('bodyType', data.bodyType)
                      handleInput('plateFinal', normalizePlateFinal(data.plate) || '')
                      const nextFipeResult = buildFipeResultFromPlateLookup({
                        brand: data.brand,
                        model: data.model,
                        yearModel: data.yearModel,
                        fuel: data.fuel,
                        plate: data.plate,
                        fipePrice: data.fipePrice,
                        fipeReference: data.fipeReference,
                      })
                      plateFipeLookupRef.current = Boolean(nextFipeResult)
                      setFipeResult(nextFipeResult)
                      if (form.vehicle_type === 'truck') {
                        handleInput('truck_type', data.truck_type || '')
                        handleInput('truck_body_type', data.truck_body_type || '')
                        handleInput('load_capacity', data.load_capacity == null ? '' : String(data.load_capacity))
                        handleInput('axles', data.axles == null ? '' : String(data.axles))
                        handleInput('cabin_type', data.cabin_type || '')
                        handleInput('pbt', data.pbt == null ? '' : String(data.pbt))
                        handleInput('cmt', data.cmt == null ? '' : String(data.cmt))
                        handleInput('truck_category', data.truck_category || '')
                        setForm((prev) => ({ ...prev, structured_data: { ...prev.structured_data, ...(data.structured_data || {}) } }))
                      }
                      if (data.version) setForm((prev) => ({ ...prev, version: data.version }))
                    }} />
                    <button type="button" onClick={handleSubStepNext} className="fingen-flow-btn-primary w-full mt-2">
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={startManualVehicleEntry} className="w-full text-center text-[13px] text-[#767676] font-medium hover:text-[#1A1A1A]">
                      Preencher dados manualmente
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Sub-step 2: Confirm auto-filled data */}
            {listingSubStep === 2 && (
              <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-3 sm:space-y-4 animate-fade-in">
                <div className="flex items-center justify-between gap-3">
                  <p className="fingen-flow-field-label">Dados do veículo</p>
                  <span className="fingen-flow-badge-accent text-[11px]">Verifique</span>
                </div>
                <p className="text-[13px] text-[#767676]">Revise os dados abaixo. Altere o que precisar.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                   <div>
                     <label htmlFor="vehicle-brand" className="listing-flow-field-label">Marca</label>
                     <input id="vehicle-brand" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.brand} onChange={(e) => handleInput('brand', e.target.value)} />
                   </div>
                   <div>
                     <label htmlFor="vehicle-model" className="listing-flow-field-label">Modelo</label>
                     <input id="vehicle-model" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.model} onChange={(e) => handleInput('model', e.target.value)} />
                   </div>
                   <div>
                     <label htmlFor="vehicle-version" className="listing-flow-field-label">Versão</label>
                     <input id="vehicle-version" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.version} onChange={(e) => handleInput('version', e.target.value)} placeholder="Ex: CROSSFOX" />
                   </div>
                   <div>
                     <label htmlFor="vehicle-year" className="listing-flow-field-label">Ano de fabricação</label>
                     <input id="vehicle-year" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.year} onChange={(e) => handleInput('year', e.target.value)} />
                   </div>
                   <div>
                     <label htmlFor="vehicle-color" className="listing-flow-field-label">Cor</label>
                     <input id="vehicle-color" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.color} onChange={(e) => handleInput('color', e.target.value)} />
                   </div>
                   <div>
                     <label htmlFor="vehicle-fuel" className="listing-flow-field-label">Combustível</label>
                     <select id="vehicle-fuel" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={canonicalOption(FUEL_OPTIONS, form.fuel)} onChange={(e) => handleInput('fuel', e.target.value)}>
                       <option value="">Selecione</option>
                       {withSelectOption(FUEL_OPTIONS, form.fuel).map((option) => <option key={option} value={option}>{option}</option>)}
                     </select>
                   </div>
                   <div>
                     <label htmlFor="vehicle-transmission" className="listing-flow-field-label">Câmbio</label>
                     <select id="vehicle-transmission" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={canonicalOption(TRANSMISSION_OPTIONS, form.transmission)} onChange={(e) => handleInput('transmission', e.target.value)}>
                       <option value="">Selecione</option>
                       {withSelectOption(TRANSMISSION_OPTIONS, form.transmission).map((option) => <option key={option} value={option}>{option}</option>)}
                     </select>
                   </div>
                   <div>
                     <label htmlFor="vehicle-engine" className="listing-flow-field-label">Motor</label>
                     <input id="vehicle-engine" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.engine} onChange={(e) => handleInput('engine', e.target.value)} placeholder="Ex: 2.0 Turbo" />
                   </div>
                   <div>
                     <label htmlFor="vehicle-horsepower" className="listing-flow-field-label">Potência (cv)</label>
                     <input id="vehicle-horsepower" className="fingen-flow-input listing-flow-input-field text-sm mt-1" value={form.horsepower} onChange={(e) => handleInput('horsepower', e.target.value)} placeholder="Ex: 116" />
                   </div>
                   <div>
                     <label htmlFor="vehicle-plate-final" className="listing-flow-field-label">Final da placa (opcional)</label>
                     <input id="vehicle-plate-final" className="fingen-flow-input listing-flow-input-field text-sm mt-1 uppercase" value={normalizePlateFinal(form.plateFinal) || ''} onChange={(e) => handleInput('plateFinal', normalizePlateFinal(e.target.value) || '')} placeholder="Ex: 3" maxLength={1} />
                   </div>
                 </div>
                <button type="button" onClick={nextStep} className="fingen-flow-btn-primary w-full mt-2">
                  <span className="truncate">Continuar para preço e fotos</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
                <button type="button" onClick={() => setListingSubStep(1)} className="w-full text-center text-[13px] text-[#767676] font-medium mt-1 hover:text-[#1A1A1A]">
                  Voltar e consultar outra placa
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="tfp-section-title outline-none">Dados essenciais</h2>
              <p className="tfp-section-sub">
                Só pedimos o necessário para publicar rápido. O restante pode ser completado depois.
              </p>
            </div>
            
             {form.vehicle_type === 'truck' && (
               <div className="grid gap-3 sm:grid-cols-2 max-[330px]:grid-cols-1 rounded-2xl border border-[#D4F576]/40 bg-[#D4F576]/10 p-4">
                 <p className="sm:col-span-2 text-sm font-semibold text-[#1A1A1A]">Dados do caminhão</p>
                 {([['truck_type', 'Tipo de caminhão'], ['load_capacity', 'Capacidade de carga (kg)'], ['axles', 'Eixos'], ['truck_body_type', 'Carroceria'], ['cabin_type', 'Cabine'], ['pbt', 'PBT (kg)'], ['cmt', 'CMT (kg)'], ['truck_category', 'Categoria']] as const).map(([field, label]) => (
                   <input key={field} className="fingen-flow-input" placeholder={label} value={form[field]} onChange={(e) => handleInput(field, e.target.value)} aria-label={label} />
                 ))}
                 <p className="sm:col-span-2 text-xs text-[#767676]">Você pode preencher manualmente os dados que não vierem na consulta da placa.</p>
               </div>
             )}
            <div className="grid gap-3 sm:grid-cols-2 max-[330px]:grid-cols-1">

              <div>
                <label htmlFor="listing-price" className="listing-flow-field-label">Preço pedido (R$)</label>
                <input
                  id="listing-price"
                  className="fingen-flow-input mt-1"
                  placeholder="Preço (R$)"
                  value={formatPriceInput(form.price)}
                  onChange={(e) => {
                    const formatted = formatPriceInput(e.target.value)
                    const raw = parsePriceInput(formatted)
                    handleInput('price', raw)
                  }}
                  inputMode="decimal"
                  aria-label="Preço pedido"
                  aria-invalid={fieldErrors.price || undefined}
                  aria-describedby={fieldErrors.price ? 'listing-price-error' : undefined}
                />
                {fieldErrors.price ? <p id="listing-price-error" className="listing-field-error">Informe o preço pedido.</p> : null}
              </div>
              <div>
                <label htmlFor="listing-mileage" className="listing-flow-field-label">Quilometragem (km)</label>
                <input id="listing-mileage" className="fingen-flow-input mt-1" placeholder="Ex: 45.000" inputMode="numeric" value={formatBrazilianInt(form.mileage)} onChange={(e) => handleInput('mileage', e.target.value.replace(/\D/g, ''))} aria-label="Quilometragem" aria-invalid={fieldErrors.mileage || undefined} aria-describedby={fieldErrors.mileage ? 'listing-mileage-error' : undefined} />
                {fieldErrors.mileage ? <p id="listing-mileage-error" className="listing-field-error">Informe a quilometragem.</p> : null}
              </div>
              <div>
                <label htmlFor="listing-fuel" className="listing-flow-field-label">Combustível</label>
                <select id="listing-fuel" className="fingen-flow-input mt-1" value={canonicalOption(FUEL_OPTIONS, form.fuel || resolvedFuelValue)} onChange={(e) => handleInput('fuel', e.target.value)} aria-label="Combustível" aria-invalid={fieldErrors.fuel || undefined} aria-describedby={fieldErrors.fuel ? 'listing-fuel-error' : undefined}>
                  <option value="">Selecione</option>
                  {withSelectOption(FUEL_OPTIONS, form.fuel || resolvedFuelValue).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {fieldErrors.fuel ? <p id="listing-fuel-error" className="listing-field-error">Selecione o combustível.</p> : null}
              </div>
              <div>
                <label htmlFor="listing-transmission" className="listing-flow-field-label">Câmbio</label>
                <select id="listing-transmission" className="fingen-flow-input mt-1" value={canonicalOption(TRANSMISSION_OPTIONS, form.transmission || resolvedTransmissionValue)} onChange={(e) => handleInput('transmission', e.target.value)} aria-label="Câmbio" aria-invalid={fieldErrors.transmission || undefined} aria-describedby={fieldErrors.transmission ? 'listing-transmission-error' : undefined}>
                  <option value="">Selecione</option>
                  {withSelectOption(TRANSMISSION_OPTIONS, form.transmission || resolvedTransmissionValue).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {fieldErrors.transmission ? <p id="listing-transmission-error" className="listing-field-error">Selecione o câmbio.</p> : null}
              </div>
              <div>
                <label htmlFor="listing-color" className="listing-flow-field-label">Cor</label>
                <input id="listing-color" className="fingen-flow-input mt-1" placeholder="Ex: Branco" value={form.color} onChange={(e) => handleInput('color', e.target.value)} aria-label="Cor" aria-invalid={fieldErrors.color || undefined} aria-describedby={fieldErrors.color ? 'listing-color-error' : undefined} />
                {fieldErrors.color ? <p id="listing-color-error" className="listing-field-error">Informe a cor.</p> : null}
              </div>
              <div>
                <label htmlFor="listing-city" className="listing-flow-field-label">Cidade</label>
                <input id="listing-city" className="fingen-flow-input mt-1" placeholder="Ex: São Paulo" value={form.city} onChange={(e) => handleInput('city', e.target.value)} aria-label="Cidade" aria-invalid={fieldErrors.city || undefined} aria-describedby={fieldErrors.city ? 'listing-city-error' : undefined} />
                {fieldErrors.city ? <p id="listing-city-error" className="listing-field-error">Informe a cidade.</p> : null}
              </div>
              <div>
                <label htmlFor="listing-state" className="listing-flow-field-label">Estado (UF)</label>
                <select id="listing-state" className="fingen-flow-input mt-1" value={form.state} onChange={(e) => handleInput('state', e.target.value)} aria-label="Estado (UF)" aria-invalid={fieldErrors.state || undefined} aria-describedby={fieldErrors.state ? 'listing-state-error' : undefined}>
                  <option value="">Selecione</option>
                  {BRAZIL_UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                {fieldErrors.state ? <p id="listing-state-error" className="listing-field-error">Selecione o estado.</p> : null}
              </div>
            </div>

            {fipeLoading ? (
              <div className="fingen-flow-fipe-comparison-dark rounded-[24px] p-5" style={{ background: '#1A1A1A', color: '#FFFFFF' }} role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#D4F576' }} />
                  <div>
                    <p className="font-semibold">Consultando a FIPE</p>
                    <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Estamos buscando a referência mais recente para este veículo.</p>
                  </div>
                </div>
              </div>
            ) : fipeResult ? (
              <div className="fingen-flow-fipe-comparison-dark listing-fipe-comparison rounded-[24px] p-5 max-[330px]:p-4" style={{ background: '#1A1A1A', color: '#FFFFFF' }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="fingen-flow-fipe-dark-label max-[330px]:text-[11px]" style={{ color: '#D4F576' }}>
                      Comparativo FIPE
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="fingen-flow-fipe-dark-value max-[330px]:text-[30px]" style={{ color: '#FFFFFF' }}>
                        {fipeResult.price}
                      </p>
                      <span className="text-[14px] font-medium max-[330px]:text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Tabela FIPE
                      </span>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide ${fipeComparisonStatusClass}`}>
                    {fipeComparisonStatusLabel}
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="fingen-flow-fipe-dark-stat">
                    <p className="fingen-flow-fipe-dark-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Preço anunciado</p>
                    <p className="fingen-flow-fipe-dark-stat-value max-[330px]:text-[20px]" style={{ color: '#FFFFFF' }}>
                      {hasAskingPrice ? formatBRL(priceNumber) : 'Informe acima'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="fingen-flow-fipe-dark-stat">
                      <p className="fingen-flow-fipe-dark-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Diferença</p>
                      <p className="fingen-flow-fipe-dark-stat-diff max-[330px]:text-[17px]" style={{ color: '#D4F576' }}>
                        {fipeDiffValueLabel ?? 'Preencha o preço'}
                      </p>
                    </div>
                    <div className="fingen-flow-fipe-dark-stat">
                      <p className="fingen-flow-fipe-dark-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Percentual</p>
                      <p className="fingen-flow-fipe-dark-stat-diff max-[330px]:text-[17px]" style={{ color: '#D4F576' }}>
                        {fipeDiffPercentLabel ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div className="fingen-flow-fipe-dark-track">
                    <div className="flex items-center justify-between gap-4 text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <span>Abaixo da FIPE</span>
                      <span>Acima da FIPE</span>
                    </div>
                    <div className="mt-3 fingen-flow-fipe-progress-bar">
                      <div className="fingen-flow-fipe-progress-fill" style={{ width: fipeProgressWidth }} />
                    </div>
                    <p className="mt-3 fingen-flow-fipe-dark-ref" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {fipeResult.referenceMonth
                        ? `Referência ${fipeResult.referenceMonth} • Atualizado pela FIPE.`
                        : 'Atualizado pela FIPE.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-4" role="status">
                <p className="text-sm font-semibold text-[#333]">Não encontramos a referência FIPE</p>
                <p className="mt-1 text-xs text-[#767676]">Confira marca, modelo, ano e versão. Você pode continuar sem a FIPE e publicar com o preço informado.</p>
              </div>
            )}

            <div className="fingen-flow-substep-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="fingen-flow-field-label">Recomendado, não obrigatório</p>
                <span className="fingen-flow-badge-outline text-[11px]">Opcional</span>
              </div>
              <div>
                <label htmlFor="listing-description" className="listing-flow-field-label">Descrição do veículo</label>
                <textarea id="listing-description" className="fingen-flow-input listing-description-field min-h-[180px] sm:min-h-[200px] py-3 resize-none leading-relaxed" placeholder="Descrição do veículo... destaque pontos fortes, revisões e opcionais." value={form.description} onChange={(e) => handleInput('description', e.target.value)} aria-label="Descrição do veículo" />
              </div>
              <div>
                <label htmlFor="listing-optionals" className="listing-flow-field-label">Opcionais extras</label>
                <input id="listing-optionals" className="fingen-flow-input listing-optionals-field" placeholder="Opcionais extras (separados por vírgula)" value={form.optionalItems} onChange={(e) => handleInput('optionalItems', e.target.value)} aria-label="Opcionais extras" />
              </div>
            </div>



            <label
              className={`fingen-flow-upload-area p-8 flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 text-sm font-medium text-[#4F4A3E] transition-all group max-[330px]:p-5 max-[330px]:min-h-[140px] focus-within:ring-2 focus-within:ring-[#16855C] focus-within:ring-offset-2 ${isDraggingImages ? 'border-[#16855C] bg-[#16855C]/5 scale-[1.01]' : ''}${fieldErrors.images ? ' listing-upload-invalid' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDraggingImages(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggingImages(false)
              }}
              onDrop={onDropFiles}
            >
              <div className="fingen-flow-upload-icon group-hover:scale-110 transition-transform max-[330px]:w-12 max-[330px]:h-12">
                <ImagePlus className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <span className="text-sm text-[#1A1A1A] mt-1 max-[330px]:text-[13px]">Arraste fotos ou clique ({images.length}/{LISTING_MAX_IMAGES})</span>
              <span className="fingen-flow-badge-accent text-[11px] mt-1">JPG, PNG, WEBP • Até 10 imagens • 10 MB por imagem</span>
              <input
                id="listing-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  handleImageSelect(e.target.files)
                  e.target.value = ''
                }}
                aria-invalid={fieldErrors.images || undefined}
                aria-describedby={fieldErrors.images ? 'listing-images-help listing-images-error' : 'listing-images-help'}
              />
            </label>
            <p id="listing-images-help" className="text-xs font-medium text-[#6F6F6F] text-center">Inclua pelo menos 1 foto para publicar. Cada arquivo pode ter até {LISTING_MAX_IMAGE_SIZE_MB} MB.</p>
            {fieldErrors.images ? <p id="listing-images-error" className="listing-field-error text-center">Adicione pelo menos uma foto para continuar.</p> : null}
            {imageErrors.length > 0 && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]" role="alert">
                <p className="font-semibold">Não adicionamos algumas imagens:</p>
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {imageErrors.map((imageError) => <li key={imageError}>{imageError}</li>)}
                </ul>
              </div>
            )}

            {images.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8 max-[330px]:grid-cols-1 max-[330px]:gap-4">
                {images.map((image, index) => (
                  <div key={image.previewUrl} className="fingen-flow-substep-card p-3 hover:shadow-md transition-shadow max-[330px]:p-2.5">
                    {/* Object URLs are generated locally for instant previews before upload. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} width={1920} height={1080} className="aspect-video w-full rounded-xl object-cover" />
                    <p className="mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#6F6F6F] max-[330px]:mt-3">{index === 0 ? 'Foto principal' : `Foto ${index + 1}`}</p>
                    <div className="mt-3 flex items-center gap-2 px-2 pb-1 max-[330px]:gap-1.5">
                      <button type="button" className="w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#6F6F6F] hover:text-[#1A1A1A] hover:bg-[#E5E5E5] transition-colors" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Mover imagem para a esquerda">
                        <MoveLeft className="h-4 w-4" />
                      </button>
                      <button type="button" className="w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#6F6F6F] hover:text-[#1A1A1A] hover:bg-[#E5E5E5] transition-colors" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Mover imagem para a direita">
                        <MoveRight className="h-4 w-4" />
                      </button>
                      <button type="button" className="w-11 h-11 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#DC2626] hover:bg-[#FEE2E2] hover:text-[#B91C1C] transition-colors ml-auto" onClick={() => removeImage(index)} aria-label="Remover imagem">
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
          <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-10">
              <p className="tfp-section-label">Confirmação</p>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="tfp-section-title outline-none">
                Confira os dados do seu veículo
              </h2>
              <p className="tfp-section-sub">
                Revise as informações abaixo antes de continuar.
              </p>
            </div>

            {/* Quality Score — clean, no card */}
            <div className="mb-10">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-[40px] sm:text-[48px] font-black text-[#111] leading-none tracking-[-0.03em]">{qualityScore}</span>
                <span className="text-lg font-medium text-[#999]">/100</span>
              </div>
              <div className="h-1.5 bg-[#EAEAEA] rounded-full overflow-hidden mb-3">
                <div className="h-full bg-[#111] rounded-full transition-all duration-700" style={{ width: `${qualityScore}%` }} />
              </div>
              <p className="text-sm text-[#666]">{qualityLabel}</p>
              {missingRequiredLabels.length > 0 && (
                <p className="mt-2 text-sm font-medium text-[#DC2626]">
                  Faltam: {missingRequiredLabels.join(', ')}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#EAEAEA] mb-10" />

            {/* Vehicle Info — no card, clean rows */}
            <div className="mb-10">
              <h3 className="text-sm font-semibold text-[#111] mb-6 uppercase tracking-[0.08em]">Informações</h3>
              <div className="space-y-5">
                {[
                  { label: 'Final da placa', value: normalizePlateFinal(form.plateFinal) || 'Não informado' },
                  { label: 'Veículo', value: `${form.brand} ${form.model} ${form.version}` },
                  { label: 'Ano', value: `${form.year}/${form.yearModel}` },
                  { label: 'Motor', value: form.engine || 'Não informado' },
                  { label: 'Potência', value: form.horsepower ? `${form.horsepower} cv` : 'Não informado' },
                  { label: 'Preço', value: form.price ? formatBRL(parseMoneyInputToNumber(form.price)) : 'Não informado' },
                  { label: 'Quilometragem', value: form.mileage ? `${Number(form.mileage).toLocaleString('pt-BR')} km` : 'Não informado' },
                  { label: 'Cidade/UF', value: `${form.city || '-'}${form.state ? `/${form.state}` : ''}` },
                  { label: 'Fotos', value: `${images.length} de ${LISTING_MAX_IMAGES}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F0F0F0]">
                    <span className="text-sm text-[#999]">{item.label}</span>
                    <span className="text-sm font-semibold text-[#111] text-right">{item.value}</span>
                  </div>
                ))}
              </div>
              {form.description.trim() && (
                <div className="mt-6">
                  <span className="text-sm text-[#999] block mb-2">Descrição</span>
                  <div className="text-sm text-[#333] leading-relaxed">
                    {parseDescription(form.description).map((paragraph, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {paragraph.lines.map((line, lineIndex) => (
                          <span key={lineIndex}>
                            {line}
                            {lineIndex < paragraph.lines.length - 1 ? <br /> : null}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#EAEAEA] mb-10" />

            {/* Technical Specs — minimal grid */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-[#111] text-white px-2 py-0.5 rounded">Sugerido</span>
                <h3 className="text-sm font-semibold text-[#111] uppercase tracking-[0.08em]">Ficha técnica</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
                {[
                  { label: 'Motor', value: form.engine || technical.engine },
                  { label: 'Potência', value: technical.horsepower },
                  { label: 'Torque', value: technical.torque },
                  { label: 'Combustível', value: technical.fuel },
                  { label: 'Câmbio', value: technical.transmission },
                  { label: 'Consumo', value: technical.consumption },
                  { label: 'Categoria', value: technical.category },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-xs text-[#999] block mb-1">{item.label}</span>
                    <span className="text-sm font-semibold text-[#111]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-[#999] mb-8">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Contato protegido via chat seguro da plataforma.</span>
            </div>

            {!isAuthenticated ? (
              <div className="fingen-flow-substep-card p-4 sm:p-6 space-y-4 mt-10">
                <div className="space-y-1">
                  <p className="fingen-flow-field-label text-base">Crie sua conta para publicar</p>
                  <p className="text-[13px] text-[#767676]">Seus dados do anúncio são guardados e a publicação é imediata.</p>
                </div>

                {accountEmailExists ? (
                  <div className="rounded-xl p-4 bg-[#FEF2F2] border border-[#FECACA] space-y-3">
                    <p className="text-sm text-[#B91C1C] font-medium">
                      Este e-mail já está cadastrado. Entre na sua conta para publicar.
                    </p>
                    <Link
                      href="/entrar?redirect=/anunciar-carro/fluxo"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#2D2D2D]"
                    >
                      Entrar na minha conta
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#767676]" htmlFor="account-name">Nome completo</label>
                      <input
                        id="account-name"
                        className="fingen-flow-input mt-1"
                        placeholder="Seu nome completo"
                        autoComplete="name"
                        value={account.name}
                        onChange={(e) => handleAccountInput('name', e.target.value)}
                        aria-invalid={accountErrors.name ? true : undefined}
                        aria-describedby={accountErrors.name ? 'account-name-error' : undefined}
                      />
                      {accountErrors.name ? <p id="account-name-error" className="listing-field-error">{accountErrors.name}</p> : null}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#767676]" htmlFor="account-phone">Telefone</label>
                      <input
                        id="account-phone"
                        className="fingen-flow-input mt-1"
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        autoComplete="tel"
                        value={account.phone}
                        onChange={(e) => handleAccountInput('phone', formatPhone(e.target.value))}
                        aria-invalid={accountErrors.phone ? true : undefined}
                        aria-describedby={accountErrors.phone ? 'account-phone-error' : undefined}
                      />
                      {accountErrors.phone ? <p id="account-phone-error" className="listing-field-error">{accountErrors.phone}</p> : null}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#767676]" htmlFor="account-cpf">CPF</label>
                      <input
                        id="account-cpf"
                        className="fingen-flow-input mt-1"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        autoComplete="off"
                        value={account.cpf}
                        onChange={(e) => handleAccountInput('cpf', formatCPF(e.target.value))}
                        aria-invalid={accountErrors.cpf ? true : undefined}
                        aria-describedby={accountErrors.cpf ? 'account-cpf-error' : undefined}
                      />
                      {accountErrors.cpf ? <p id="account-cpf-error" className="listing-field-error">{accountErrors.cpf}</p> : null}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#767676]" htmlFor="account-email">E-mail</label>
                      <input
                        id="account-email"
                        type="email"
                        className="fingen-flow-input mt-1"
                        placeholder="voce@email.com"
                        autoComplete="email"
                        value={account.email}
                        onChange={(e) => handleAccountInput('email', e.target.value)}
                        aria-invalid={accountErrors.email ? true : undefined}
                        aria-describedby={accountErrors.email ? 'account-email-error' : undefined}
                      />
                      {accountErrors.email ? <p id="account-email-error" className="listing-field-error">{accountErrors.email}</p> : null}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#767676]" htmlFor="account-password">Senha</label>
                      <input
                        id="account-password"
                        type="password"
                        className="fingen-flow-input mt-1"
                        placeholder="Crie uma senha"
                        autoComplete="new-password"
                        value={account.password}
                        onChange={(e) => handleAccountInput('password', e.target.value)}
                        aria-invalid={accountErrors.password ? true : undefined}
                        aria-describedby={accountErrors.password ? 'account-password-error' : undefined}
                      />
                      {accountErrors.password ? <p id="account-password-error" className="listing-field-error">{accountErrors.password}</p> : null}
                      <p className="mt-1 text-[11px] leading-relaxed text-[#767676]">Use 8+ caracteres, com uma letra maiúscula, um número e um símbolo.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#767676]" htmlFor="account-confirm">Confirmar senha</label>
                      <input
                        id="account-confirm"
                        type="password"
                        className="fingen-flow-input mt-1"
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        value={account.confirmPassword}
                        onChange={(e) => handleAccountInput('confirmPassword', e.target.value)}
                        aria-invalid={accountErrors.confirmPassword ? true : undefined}
                        aria-describedby={accountErrors.confirmPassword ? 'account-confirm-error' : undefined}
                      />
                      {accountErrors.confirmPassword ? <p id="account-confirm-error" className="listing-field-error">{accountErrors.confirmPassword}</p> : null}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
        </FadeContent>

        {error ? (
          <div className="listing-form-error rounded-2xl p-5" role="alert">
            <p className="listing-form-error-copy text-sm font-bold">{error}</p>
            {validationDetails.length > 0 ? (
              <ul className="listing-form-error-details mt-3 space-y-1.5 text-xs font-medium bg-white/60 p-4 rounded-xl">
                {validationDetails.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <span className="listing-form-error-bullet mt-0.5">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl p-5 text-center bg-[#F0FDF4] border border-[#BBF7D0]" role="status">
            <p className="text-base font-bold text-[#16A34A]">{success}</p>
          </div>
        ) : null}

        <div className="mt-12 pt-8 border-t border-[#EAEAEA]">
          <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="tfp-btn-secondary"
                disabled={saving || fipeLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            ) : (
              <div />
            )}

            {currentStep === 1 ? (
              <div />
            ) : (
              <button
                type="button"
                onClick={currentStep === 3 ? handleSubmit : nextStep}
                className={`tfp-btn-primary listing-next-step-button${currentStep === 3 ? ' listing-final-submit-button' : ''}`}
                disabled={saving || fipeLoading}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : currentStep === 3 ? (
                  !isAuthenticated ? 'Criar conta e publicar' : 'Publicar anúncio'
                ) : (
                  <>
                    Próxima etapa
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {currentStep === 3 ? (
          <div className="fixed inset-x-0 bottom-0 z-30 p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:hidden bg-gradient-to-t from-white via-white to-transparent">
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="tfp-btn-primary w-full justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                !isAuthenticated ? 'Criar conta e publicar' : 'Publicar anúncio'
              )}
            </button>
          </div>
        ) : null}
      </div>


    </div>
  )
}
