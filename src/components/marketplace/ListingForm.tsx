'use client'

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Loader2, ArrowRight, ArrowLeft, ImagePlus, MoveLeft, MoveRight, Trash2, Check } from 'lucide-react'
import Link from 'next/link'
import type { FipeItem, FipeResult, FipeVersionOption } from '@/lib/fipe-api'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { trackEvent } from '@/lib/analytics'
import { lookupPlateClient, readPlateLookup } from '@/lib/integrations/placaapi/client'
import type { PlacaApiResponse } from '@/lib/integrations/placaapi/types'
import PlateInput from '@/components/marketplace/PlateInput'
import {
  LISTING_ALLOWED_TYPES,
  LISTING_MAX_IMAGES,
  LISTING_MAX_IMAGE_SIZE_MB,
  buildFipeSnapshot,
  getFipeComparison,
  normalizeOptionalItems,
  formatBrazilianInt,
  parseBrazilianInt,
  parseMoneyInputToNumber,
} from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import { enrichVehicle } from '@/lib/vehicle-enrichment'
import { brandsAreEquivalent } from '@/lib/brand-normalization'

const DRAFT_KEY = 'carbi_listing_draft_v1'

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
  truck_type: string
  load_capacity: string
  axles: string
  truck_body_type: string
  cabin_type: string
  pbt: string
  cmt: string
  truck_category: string
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

}

const ACCOUNT_INITIAL = { name: '', phone: '', cpf: '', email: '', password: '', confirmPassword: '' }

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function isValidCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i)
  let r = (s * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(d[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i)
  r = (s * 10) % 11
  if (r === 10) r = 0
  return r === parseInt(d[10])
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

export default function ListingForm({ vehicleType = 'car' }: { vehicleType?: 'car' | 'truck' }) {
  const supabaseReady = isSupabaseBrowserConfigured()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [listingSubStep, setListingSubStep] = useState(1)
  const [form, setForm] = useState<FormState>({ ...INITIAL_STATE, vehicle_type: vehicleType })
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
  const skipFipeClearOnMount = useRef(true)

  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [fipeLoading, setFipeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [account, setAccount] = useState(ACCOUNT_INITIAL)
  const [accountEmailExists, setAccountEmailExists] = useState(false)
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
    const plate = new URLSearchParams(window.location.search).get('placa')
    if (!plate) return

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
        plateFinal: data.placa || plate,
      }))
      setListingSubStep(2)
    }

    try {
      localStorage.removeItem(DRAFT_KEY)
      const cached = readPlateLookup()
      if (cached) {
        applyData(cached)
        return
      }
      void lookupPlateClient(plate)
        .then((data) => {
          if (data?.marca) applyData(data)
        })
        .catch(() => {
          // ignore lookup failure; user can fill the form manually
        })
    } catch {
      // ignore malformed cache
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
    if (skipFipeClearOnMount.current) return
    if (!selectedBrandCode) {
      clearVehicleDependentFields('brand')
    }
  }, [selectedBrandCode])

  useEffect(() => {
    if (skipFipeClearOnMount.current) return
    if (!selectedModelCode) {
      clearVehicleDependentFields('model')
    }
  }, [selectedModelCode])

  useEffect(() => {
    if (skipFipeClearOnMount.current) return
    if (!selectedYear) {
      clearVehicleDependentFields('year')
    }
  }, [selectedYear])

  useEffect(() => {
    skipFipeClearOnMount.current = false
  }, [])

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
      version: selected?.name || prev.version,
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
    { label: 'FIPE consultada', complete: Boolean(fipeResult?.price) },
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
      // Step 1 is now plate-based: brand must be filled (from plate or manually)
      if (!form.brand) {
        return 'Consulte uma placa ou preencha a marca manualmente.'
      }
    }

    if (step === 2) {
      if (!form.price || !form.mileage || !form.city || !form.state || !form.color || !resolvedFuelValue || !resolvedTransmissionValue) {
        return 'Preencha preço, quilometragem, combustível, câmbio, cor, cidade e estado.'
      }
      if (images.length === 0) {
        return 'Adicione pelo menos 1 foto para publicar.'
      }
    }

    if (step === 3) {
      if (missingRequiredLabels.length > 0) {
        return `Complete os dados obrigatórios: ${missingRequiredLabels.join(', ')}.`
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
    // On sub-step 1 (plate lookup), brand is auto-filled from plate
    // Only require manual brand selection if no brand was auto-filled
    if (listingSubStep === 1 && !form.brand) { setError('Consulte uma placa ou selecione a marca manualmente.'); return }
    setError(null)
    setListingSubStep((prev) => Math.min(4, prev + 1))
  }

  const validateAccount = (): string | null => {
    if (account.name.trim().length < 3) return 'Informe seu nome completo.'
    if (account.phone.replace(/\D/g, '').length < 10) return 'Informe um telefone válido.'
    if (!isValidCPF(account.cpf)) return 'Informe um CPF válido.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) return 'Informe um e-mail válido.'
    if (
      account.password.length < 8 ||
      !/[A-Z]/.test(account.password) ||
      !/\d/.test(account.password) ||
      !/[^A-Za-z0-9]/.test(account.password)
    ) return 'A senha deve ter 8+ caracteres, com letra maiúscula, número e símbolo.'
    if (account.password !== account.confirmPassword) return 'As senhas não coincidem.'
    return null
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
      if (!isAuthenticated) {
        const accountError = validateAccount()
        if (accountError) { setError(accountError); return }
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
          plate_final: form.plateFinal,
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

      const created = (await createResponse.json()) as { id: string; slug: string; emailStatus?: unknown }
      console.log('[DEBUG-EMAIL] POST listing response emailStatus:', created.emailStatus)

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

      localStorage.removeItem(DRAFT_KEY)
      setSuccess('Carro anunciado com sucesso')

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
  }

  if (!sessionReady) {
    return (
      <div className="listing-form-ref fingen-flow-form fingen-flow-form-card p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#1A1A1A]" />
        <p className="mt-2 text-sm text-[#525252]">Carregando sessão...</p>
      </div>
    )
  }

  return (
    <div className="listing-form-ref space-y-6 sm:space-y-8 pb-4 w-full max-w-none sm:max-w-3xl mx-auto">
      <div className="space-y-3">
        <div
          className="tfp-progress-track"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Etapa ${currentStep} de 3`}
        >
          <div
            className="tfp-progress-fill"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        <p className="tfp-step-label">
          {currentStep === 1 && 'Etapa 1 de 3: Selecione seu carro'}
          {currentStep === 2 && 'Etapa 2 de 3: Preço, dados básicos e fotos'}
          {currentStep === 3 && 'Etapa 3 de 3: Revisar e publicar'}
        </p>
      </div>

      <div className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="tfp-section-title">Selecione seu veículo</h3>
              <p className="tfp-section-sub">
                Comece pela placa. Com ela puxamos todos os dados automaticamente.
              </p>
            </div>

            <input type="hidden" value={form.vehicle_type} />

            {/* Sub-step 1: Plate Lookup */}
            {listingSubStep === 1 && (
              <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-3 sm:space-y-4 animate-fade-in">
                <p className="fingen-flow-field-label">Placa do veículo</p>
                <p className="text-[13px] text-[#767676]">Digite a placa para preencher marca, modelo e dados automaticamente.</p>
<PlateInput onPlateFound={(data: { brand: string; model: string; year: number; yearModel: number; color: string; fuel: string; engine: string; horsepower: string; transmission: string; bodyType: string; plate: string; version: string; fipePrice?: number | null;     fipeReference?: string | null; load_capacity?: number | null; axles?: number | null; cabin_type?: string | null; pbt?: number | null; cmt?: number | null; truck_category?: string | null; structured_data?: Record<string, unknown> }) => {
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
                     handleInput('plateFinal', data.plate)
                     if (form.vehicle_type === 'truck') {
                       handleInput('load_capacity', data.load_capacity == null ? '' : String(data.load_capacity))
                       handleInput('axles', data.axles == null ? '' : String(data.axles))
                       handleInput('cabin_type', data.cabin_type || '')
                       handleInput('pbt', data.pbt == null ? '' : String(data.pbt))
                       handleInput('cmt', data.cmt == null ? '' : String(data.cmt))
                       handleInput('truck_category', data.truck_category || '')
                     }
                     if (data.version) {
                      handleInput('version', data.version)
                    }
                  }} />
                <button type="button" onClick={handleSubStepNext} className="fingen-flow-btn-primary w-full mt-2">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sub-step 2: Confirm auto-filled data */}
            {listingSubStep === 2 && (
              <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-3 sm:space-y-4 animate-fade-in">
                <div className="flex items-center justify-between gap-3">
                  <p className="fingen-flow-field-label">Dados do veículo</p>
                  <span className="fingen-flow-badge-accent text-[10px]">Verifique</span>
                </div>
                <p className="text-[12px] text-[#767676]">Revise os dados abaixo. Altere o que precisar.</p>
<div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Marca</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.brand} onChange={(e) => handleInput('brand', e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Modelo</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.model} onChange={(e) => handleInput('model', e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Versão</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.version} onChange={(e) => handleInput('version', e.target.value)} placeholder="Ex: CROSSFOX" />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Ano</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.year} onChange={(e) => handleInput('year', e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Cor</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.color} onChange={(e) => handleInput('color', e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Combustível</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.fuel} onChange={(e) => handleInput('fuel', e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Câmbio</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.transmission} onChange={(e) => handleInput('transmission', e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Motor</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.engine} onChange={(e) => handleInput('engine', e.target.value)} placeholder="Ex: 2.0 Turbo" />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Potência (cv)</label>
                     <input className="fingen-flow-input text-[12px] mt-1" value={form.horsepower} onChange={(e) => handleInput('horsepower', e.target.value)} placeholder="Ex: 116" />
                   </div>
                   <div>
                     <label className="text-[10px] font-medium text-[#767676]">Placa</label>
                     <input className="fingen-flow-input text-[12px] mt-1 uppercase" value={form.plateFinal} onChange={(e) => handleInput('plateFinal', e.target.value)} placeholder="ABC1D23" maxLength={7} />
                   </div>
                 </div>
                <button type="button" onClick={() => { setCurrentStep(2); setListingSubStep(1); }} className="fingen-flow-btn-primary w-full mt-2">
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
              <h3 className="tfp-section-title">Dados essenciais</h3>
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
                 {!fipeResult && <p className="sm:col-span-2 text-xs font-medium text-amber-700">FIPE não disponível</p>}
                 <p className="sm:col-span-2 text-xs text-[#767676]">Você pode preencher manualmente os dados que não vierem na consulta da placa.</p>
               </div>
             )}
+
+             <div className="grid gap-3 sm:grid-cols-2 max-[330px]:grid-cols-1">

              <div>
                <label htmlFor="listing-price" className="sr-only">Preço pedido</label>
                <input
                  id="listing-price"
                  className="fingen-flow-input"
                  placeholder="Preço (R$)"
                  value={formatPriceInput(form.price)}
                  onChange={(e) => {
                    const formatted = formatPriceInput(e.target.value)
                    const raw = parsePriceInput(formatted)
                    handleInput('price', raw)
                  }}
                  inputMode="decimal"
                  aria-label="Preço pedido"
                />
              </div>
              <div>
                <label htmlFor="listing-mileage" className="sr-only">Quilometragem</label>
                <input id="listing-mileage" className="fingen-flow-input" placeholder="Quilometragem" value={formatBrazilianInt(form.mileage)} onChange={(e) => handleInput('mileage', e.target.value.replace(/\D/g, ''))} aria-label="Quilometragem" />
              </div>
              <div>
                <label htmlFor="listing-fuel" className="sr-only">Combustível</label>
                <input id="listing-fuel" className="fingen-flow-input" placeholder="Combustível" value={form.fuel || resolvedFuelValue} onChange={(e) => handleInput('fuel', e.target.value)} aria-label="Combustível" />
              </div>
              <div>
                <label htmlFor="listing-transmission" className="sr-only">Câmbio</label>
                <input id="listing-transmission" className="fingen-flow-input" placeholder="Câmbio" value={form.transmission || resolvedTransmissionValue} onChange={(e) => handleInput('transmission', e.target.value)} aria-label="Câmbio" />
              </div>
              <div>
                <label htmlFor="listing-color" className="sr-only">Cor</label>
                <input id="listing-color" className="fingen-flow-input" placeholder="Cor" value={form.color} onChange={(e) => handleInput('color', e.target.value)} aria-label="Cor" />
              </div>
              <div>
                <label htmlFor="listing-city" className="sr-only">Cidade</label>
                <input id="listing-city" className="fingen-flow-input" placeholder="Cidade" value={form.city} onChange={(e) => handleInput('city', e.target.value)} aria-label="Cidade" />
              </div>
              <div>
                <label htmlFor="listing-state" className="sr-only">Estado</label>
                <input id="listing-state" className="fingen-flow-input" placeholder="Estado (UF)" value={form.state} onChange={(e) => handleInput('state', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))} aria-label="Estado" />
              </div>
            </div>

            {fipeResult ? (
              <div className="fingen-flow-fipe-comparison-dark rounded-[24px] p-5 max-[330px]:p-4" style={{ background: '#1A1A1A', color: '#FFFFFF' }}>
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
                      {hasAskingPrice ? formatBRL(priceNumber) : 'Informe abaixo'}
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
            ) : null}

            <div className="fingen-flow-substep-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="fingen-flow-field-label">Recomendado, não obrigatório</p>
                <span className="fingen-flow-badge-outline text-[10px]">Opcional</span>
              </div>
              <div>
                <label htmlFor="listing-description" className="sr-only">Descrição do veículo</label>
                <textarea id="listing-description" className="fingen-flow-input min-h-[180px] sm:min-h-[200px] py-3 resize-none leading-relaxed" placeholder="Descrição do veículo... destaque pontos fortes, revisões e opcionais." value={form.description} onChange={(e) => handleInput('description', e.target.value)} aria-label="Descrição do veículo" />
              </div>
              <div>
                <label htmlFor="listing-optionals" className="sr-only">Opcionais extras</label>
                <input id="listing-optionals" className="fingen-flow-input" placeholder="Opcionais extras (separados por vírgula)" value={form.optionalItems} onChange={(e) => handleInput('optionalItems', e.target.value)} aria-label="Opcionais extras" />
              </div>
            </div>



            <label
              className="fingen-flow-upload-area p-8 flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 text-sm font-medium text-[#4F4A3E] transition-all group max-[330px]:p-5 max-[330px]:min-h-[140px]"
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDrop={onDropFiles}
            >
              <div className="fingen-flow-upload-icon group-hover:scale-110 transition-transform max-[330px]:w-12 max-[330px]:h-12">
                <ImagePlus className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <span className="text-sm text-[#1A1A1A] mt-1 max-[330px]:text-[13px]">Arraste fotos ou clique ({images.length}/{LISTING_MAX_IMAGES})</span>
              <span className="fingen-flow-badge-accent text-[10px] mt-1">JPG, PNG, WEBP • Até 10 imagens</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>
            <p className="text-xs font-medium text-[#6F6F6F] text-center">Inclua pelo menos 1 foto para publicar.</p>

            {images.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8 max-[330px]:grid-cols-1 max-[330px]:gap-4">
                {images.map((image, index) => (
                  <div key={image.previewUrl} className="fingen-flow-substep-card p-3 hover:shadow-md transition-shadow max-[330px]:p-2.5">
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} width={1920} height={1080} className="aspect-video w-full rounded-xl object-cover" />
                    <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#6F6F6F] max-[330px]:mt-3">{index === 0 ? 'Foto principal' : `Foto ${index + 1}`}</p>
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
              <h2 className="tfp-section-title">
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
                  { label: 'Placa', value: form.plateFinal || 'Não informada' },
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
                  <p className="text-sm text-[#333] leading-relaxed">{form.description}</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#EAEAEA] mb-10" />

            {/* Technical Specs — minimal grid */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#111] text-white px-2 py-0.5 rounded">AI</span>
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
                      <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-name">Nome completo</label>
                      <input
                        id="account-name"
                        className="fingen-flow-input mt-1"
                        placeholder="Seu nome completo"
                        value={account.name}
                        onChange={(e) => handleAccountInput('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-phone">Telefone</label>
                      <input
                        id="account-phone"
                        className="fingen-flow-input mt-1"
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        value={account.phone}
                        onChange={(e) => handleAccountInput('phone', formatPhone(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-cpf">CPF</label>
                      <input
                        id="account-cpf"
                        className="fingen-flow-input mt-1"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={account.cpf}
                        onChange={(e) => handleAccountInput('cpf', formatCPF(e.target.value))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-email">E-mail</label>
                      <input
                        id="account-email"
                        type="email"
                        className="fingen-flow-input mt-1"
                        placeholder="voce@email.com"
                        value={account.email}
                        onChange={(e) => handleAccountInput('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-password">Senha</label>
                      <input
                        id="account-password"
                        type="password"
                        className="fingen-flow-input mt-1"
                        placeholder="Crie uma senha"
                        value={account.password}
                        onChange={(e) => handleAccountInput('password', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-confirm">Confirmar senha</label>
                      <input
                        id="account-confirm"
                        type="password"
                        className="fingen-flow-input mt-1"
                        placeholder="Repita a senha"
                        value={account.confirmPassword}
                        onChange={(e) => handleAccountInput('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl p-5 bg-[#FEF2F2] border border-[#FECACA]" role="alert">
            <p className="text-sm font-bold text-[#DC2626]">{error}</p>
            {validationDetails.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-xs font-medium text-[#B91C1C] bg-white/60 p-4 rounded-xl">
                {validationDetails.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <span className="text-[#DC2626] mt-0.5">•</span>
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

            {currentStep === 1 && listingSubStep === 1 ? (
              <div />
            ) : (
              <button
                type="button"
                onClick={currentStep === 3 ? handleSubmit : nextStep}
                className="tfp-btn-primary"
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
