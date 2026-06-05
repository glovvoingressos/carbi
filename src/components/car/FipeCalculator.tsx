'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, TrendingDown, AlertCircle, Info, Car, Bike, Truck, Check } from 'lucide-react'
import type { FipeItem, FipeResult, FipeVersionOption } from '@/lib/fipe-api'

interface FipeCalculatorProps {
  initialBrandName: string
  initialModelName: string
  initialYear: number | string
  initialVersionName?: string
}

type LoadingState = {
  brands: boolean
  models: boolean
  years: boolean
  versions: boolean
  detail: boolean
}

const initialLoading: LoadingState = {
  brands: false,
  models: false,
  years: false,
  versions: false,
  detail: false,
}

const skeletonClass = 'h-12 w-full rounded-xl bg-[#FAFAF9] animate-pulse border border-[#EAEAE8]'

const VEHICLE_TYPES = [
  { id: 'cars', label: 'Carros', icon: Car },
  { id: 'motorcycles', label: 'Motos', icon: Bike },
  { id: 'trucks', label: 'Caminhões', icon: Truck },
] as const

function normalize(value: string): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bvolkswagen\b/g, 'vw')
}

function tokenize(value: string): string[] {
  return normalize(value).split(' ').filter((token) => token.length >= 2)
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao consultar ${url}: ${response.status}`)
  }
  return response.json()
}

interface FieldShellProps {
  label: string
  hint?: string
  loading?: boolean
  children: React.ReactNode
  valid?: boolean
}

function FieldShell({ label, hint, loading, children, valid }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <label className="eyebrow">{label}</label>
        {valid && !loading && (
          <Check className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={2.5} />
        )}
      </div>
      {loading ? <div className={skeletonClass} /> : children}
      {hint && <p className="text-[11px] text-[#A3A3A3] tracking-tight px-1">{hint}</p>}
    </div>
  )
}

export default function FipeCalculator({
  initialBrandName,
  initialModelName,
  initialYear,
  initialVersionName,
}: FipeCalculatorProps) {
  const [brands, setBrands] = useState<FipeItem[]>([])
  const [models, setModels] = useState<FipeItem[]>([])
  const [years, setYears] = useState<number[]>([])
  const [versions, setVersions] = useState<FipeVersionOption[]>([])

  const [selectedType, setSelectedType] = useState('cars')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedVersion, setSelectedVersion] = useState('')

  const [result, setResult] = useState<FipeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<LoadingState>(initialLoading)

  const modelsCache = useRef(new Map<string, FipeItem[]>())
  const yearsCache = useRef(new Map<string, number[]>())
  const versionsCache = useRef(new Map<string, FipeVersionOption[]>())
  const detailCache = useRef(new Map<string, FipeResult | null>())

  const hasAllFilters = useMemo(
    () => Boolean(selectedBrand && selectedModel && selectedYear && selectedVersion),
    [selectedBrand, selectedModel, selectedYear, selectedVersion]
  )

  useEffect(() => {
    let cancelled = false

    async function fetchBrands() {
      setLoading((prev) => ({ ...prev, brands: true }))
      setError(null)

      try {
        const data = await getJson<FipeItem[]>(`/api/fipe/brands?type=${selectedType}`)
        if (cancelled) return
        setBrands(data)

        if (selectedType === 'cars') {
          const brandMatch = data.find((b) => {
            const name = normalize(b.name)
            const initial = normalize(initialBrandName)
            return name === initial || name.includes(initial)
          })

          if (brandMatch) {
            setSelectedBrand(brandMatch.code)
          }
        }
      } catch {
        if (!cancelled) setError('Não foi possível carregar as marcas de referência.')
      } finally {
        if (!cancelled) setLoading((prev) => ({ ...prev, brands: false }))
      }
    }

    setSelectedBrand('')
    setModels([])
    setSelectedModel('')
    setYears([])
    setSelectedYear(null)
    setVersions([])
    setSelectedVersion('')
    setResult(null)
    modelsCache.current.clear()
    yearsCache.current.clear()
    versionsCache.current.clear()
    detailCache.current.clear()

    fetchBrands()
    return () => {
      cancelled = true
    }
  }, [initialBrandName, selectedType])

  useEffect(() => {
    if (!selectedBrand) {
      setModels([])
      setSelectedModel('')
      return
    }

    let cancelled = false

    async function fetchModels() {
      setLoading((prev) => ({ ...prev, models: true }))
      setError(null)

      try {
        if (modelsCache.current.has(selectedBrand)) {
          const cached = modelsCache.current.get(selectedBrand) || []
          setModels(cached)
        } else {
          const data = await getJson<FipeItem[]>(`/api/fipe/models?brandCode=${selectedBrand}&type=${selectedType}`)
          if (cancelled) return
          modelsCache.current.set(selectedBrand, data)
          setModels(data)
        }

        const modelSource = modelsCache.current.get(selectedBrand) || []
        const modelCandidates = modelSource.filter((m) => {
          const modelNormalized = normalize(m.name)
          const initialNormalized = normalize(initialModelName)
          const modelTokens = tokenize(m.name)
          const initialTokens = tokenize(initialModelName)
          return (
            modelNormalized === initialNormalized ||
            modelNormalized.startsWith(initialNormalized + ' ') ||
            initialTokens.every((token) => modelTokens.includes(token))
          )
        })

        if (modelCandidates.length > 0) {
          const scored = await Promise.all(
            modelCandidates.slice(0, 12).map(async (candidate) => ({
              candidate,
              latestYear: await getJson<number[]>(`/api/fipe/years?brandCode=${selectedBrand}&modelCode=${candidate.code}&type=${selectedType}`).then(d => d[0] || 0).catch(() => 0),
            }))
          )

          scored.sort((a, b) => b.latestYear - a.latestYear)
          const bestMatch = scored[0]?.candidate || modelCandidates[0]
          setSelectedModel((prev) => prev || bestMatch.code)
        }
      } catch {
        if (!cancelled) setError('Não foi possível carregar os modelos da marca.')
      } finally {
        if (!cancelled) setLoading((prev) => ({ ...prev, models: false }))
      }
    }

    setSelectedModel('')
    setYears([])
    setSelectedYear(null)
    setVersions([])
    setSelectedVersion('')
    setResult(null)

    fetchModels()
    return () => {
      cancelled = true
    }
  }, [selectedBrand, initialModelName])

  useEffect(() => {
    if (!selectedBrand || !selectedModel) {
      setYears([])
      setSelectedYear(null)
      return
    }

    let cancelled = false
    const cacheKey = `${selectedBrand}:${selectedModel}`

    async function fetchYears() {
      setLoading((prev) => ({ ...prev, years: true }))
      setError(null)

      try {
        if (yearsCache.current.has(cacheKey)) {
          const cached = yearsCache.current.get(cacheKey) || []
          setYears(cached)
        } else {
          const data = await getJson<number[]>(`/api/fipe/years?brandCode=${selectedBrand}&modelCode=${selectedModel}&type=${selectedType}`)
          if (cancelled) return
          yearsCache.current.set(cacheKey, data)
          setYears(data)
        }

        const yearSource = yearsCache.current.get(cacheKey) || []
        const initialYearNum = typeof initialYear === 'number' ? initialYear : parseInt(initialYear, 10)
        const yearMatch = yearSource.find((year) => year === initialYearNum)

        setSelectedYear((prev) => prev || yearMatch || yearSource[0] || null)
      } catch {
        if (!cancelled) setError('Não foi possível carregar os anos disponíveis.')
      } finally {
        if (!cancelled) setLoading((prev) => ({ ...prev, years: false }))
      }
    }

    setSelectedYear(null)
    setVersions([])
    setSelectedVersion('')
    setResult(null)

    fetchYears()
    return () => {
      cancelled = true
    }
  }, [selectedBrand, selectedModel, initialYear])

  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      setVersions([])
      setSelectedVersion('')
      return
    }

    let cancelled = false
    const cacheKey = `${selectedBrand}:${selectedModel}:${selectedYear}`

    async function fetchVersions() {
      setLoading((prev) => ({ ...prev, versions: true }))
      setError(null)

      try {
        if (versionsCache.current.has(cacheKey)) {
          const cached = versionsCache.current.get(cacheKey) || []
          setVersions(cached)
        } else {
          const data = await getJson<FipeVersionOption[]>(
            `/api/fipe/versions?brandCode=${selectedBrand}&modelCode=${selectedModel}&year=${selectedYear}&type=${selectedType}`
          )
          if (cancelled) return
          versionsCache.current.set(cacheKey, data)
          setVersions(data)
        }

        const versionSource = versionsCache.current.get(cacheKey) || []
        if (versionSource.length === 0) {
          setSelectedVersion('')
          return
        }

        if (initialVersionName) {
          const tokens = normalize(initialVersionName).split(' ').filter((t) => t.length >= 2)
          const scored = versionSource
            .map((item) => {
              const name = normalize(item.name)
              const fuel = normalize(item.fuelType)
              let score = 0
              for (const token of tokens) {
                if (name.includes(token)) score += 5
                if (fuel.includes(token)) score += 10
              }
              return { item, score }
            })
            .sort((a, b) => b.score - a.score)

          setSelectedVersion((prev) => prev || scored[0]?.item.code || versionSource[0].code)
          return
        }

        setSelectedVersion((prev) => prev || versionSource[0].code)
      } catch {
        if (!cancelled) setError('Não foi possível carregar as versões/combustível.')
      } finally {
        if (!cancelled) setLoading((prev) => ({ ...prev, versions: false }))
      }
    }

    setSelectedVersion('')
    setResult(null)

    fetchVersions()
    return () => {
      cancelled = true
    }
  }, [selectedBrand, selectedModel, selectedYear, initialVersionName])

  useEffect(() => {
    if (!hasAllFilters || !selectedYear) {
      setResult(null)
      return
    }

    let cancelled = false
    const cacheKey = `${selectedBrand}:${selectedModel}:${selectedYear}:${selectedVersion}`

    async function fetchDetail() {
      setLoading((prev) => ({ ...prev, detail: true }))
      setError(null)

      try {
        if (detailCache.current.has(cacheKey)) {
          setResult(detailCache.current.get(cacheKey) || null)
          return
        }

        const data = await getJson<FipeResult | null>(
          `/api/fipe/detail?brandCode=${selectedBrand}&modelCode=${selectedModel}&yearCode=${selectedVersion}&type=${selectedType}`
        )

        if (cancelled) return
        detailCache.current.set(cacheKey, data)
        setResult(data)
      } catch {
        if (!cancelled) setError('Não foi possível carregar o valor atualizado.')
      } finally {
        if (!cancelled) setLoading((prev) => ({ ...prev, detail: false }))
      }
    }

    fetchDetail()
    return () => {
      cancelled = true
    }
  }, [hasAllFilters, selectedBrand, selectedModel, selectedYear, selectedVersion])

  const selectedVersionObj = versions.find((v) => v.code === selectedVersion) || null
  const hasValidResult = Boolean(
    result &&
    result.codeFipe &&
    result.price &&
    selectedVersionObj &&
    result.model.toLowerCase().includes(initialModelName.toLowerCase().split(' ')[0])
  )
  const safeResult = hasValidResult ? result : null

  return (
    <div className="bg-white border border-[#EAEAE8] rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#0A0A0A] rounded-xl flex items-center justify-center text-white">
          <TrendingDown className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-[18px] font-semibold text-[#0A0A0A] tracking-tight">Consulta de valor atualizado</h3>
          <p className="text-[12px] text-[#A3A3A3] tracking-tight">Tabela FIPE — referência mensal oficial</p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#FAFAF9] border border-[#EAEAE8] rounded-full mb-6">
        {VEHICLE_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = selectedType === type.id
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-[12px] font-medium transition-colors tracking-tight ${
                isActive ? 'bg-white text-[#0A0A0A] shadow-xs' : 'text-[#525252] hover:text-[#0A0A0A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {type.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 mb-2">
        <FieldShell label="Marca" loading={loading.brands} valid={Boolean(selectedBrand)}>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="input cursor-pointer"
          >
            <option value="">Selecione a marca</option>
            {brands.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Modelo" loading={loading.models} valid={Boolean(selectedModel)}>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedBrand}
            className="input cursor-pointer disabled:opacity-50"
          >
            <option value="">Selecione o modelo</option>
            {models.map((m) => (
              <option key={m.code} value={m.code}>{m.name}</option>
            ))}
          </select>
        </FieldShell>

        <FieldShell
          label="Ano modelo"
          loading={loading.years}
          valid={Boolean(selectedYear)}
          hint={years.length > 0 ? 'Exibindo somente os 6 anos mais recentes.' : undefined}
        >
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : null)}
            disabled={!selectedModel}
            className="input cursor-pointer disabled:opacity-50"
          >
            <option value="">Selecione o ano</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Versão / combustível" loading={loading.versions} valid={Boolean(selectedVersion)}>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            disabled={!selectedYear}
            className="input cursor-pointer disabled:opacity-50"
          >
            <option value="">Selecione a versão</option>
            {versions.map((version) => (
              <option key={version.code} value={version.code}>
                {version.name}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 tracking-tight">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
          {error}
        </div>
      )}

      {loading.detail && (
        <div className="pt-6 mt-6 border-t border-dashed border-[#EAEAE8]">
          <div className="h-9 w-56 rounded-xl bg-[#FAFAF9] animate-pulse" />
          <div className="h-3 w-32 rounded-lg bg-[#FAFAF9] animate-pulse mt-3" />
        </div>
      )}

      {!loading.detail && safeResult && hasAllFilters && (
        <div className="space-y-5 pt-6 mt-6 border-t border-dashed border-[#EAEAE8]">
          <div>
            <p className="eyebrow mb-1.5">Preço FIPE</p>
            <p className="text-[40px] font-semibold leading-none tracking-normal text-[#0A0A0A] max-[380px]:text-[34px] max-[330px]:text-[28px]">{safeResult.price}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FAFAF9] rounded-xl px-4 py-3 border border-[#EAEAE8]">
              <p className="eyebrow mb-1">Ano selecionado</p>
              <p className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight">{selectedYear}</p>
            </div>
            <div className="bg-[#FAFAF9] rounded-xl px-4 py-3 border border-[#EAEAE8]">
              <p className="eyebrow mb-1">Combustível</p>
              <p className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight">{selectedVersionObj?.fuelType || safeResult.fuel}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-[11px] text-[#525252] bg-[#FAFAF9] p-3 rounded-xl border border-dashed border-[#EAEAE8] tracking-tight">
            <Info className="w-3.5 h-3.5 text-[#A3A3A3] mt-0.5 flex-shrink-0" strokeWidth={1.75} />
            <span>
              Referência mensal: <span className="font-medium text-[#0A0A0A]">{safeResult.referenceMonth}</span>
              {' '}• Código FIPE: <span className="font-medium text-[#0A0A0A]">{safeResult.codeFipe}</span>
            </span>
          </div>
        </div>
      )}

      {!loading.detail && !hasValidResult && (
        <div className="pt-6 mt-6 border-t border-dashed border-[#EAEAE8] text-center text-[13px] text-[#525252] tracking-tight">
          Selecione marca, modelo, ano e versão para consultar o valor atualizado.
        </div>
      )}
    </div>
  )
}
