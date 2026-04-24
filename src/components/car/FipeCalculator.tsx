'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, TrendingDown } from 'lucide-react'
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

const skeletonClass = 'h-12 w-full rounded-xl bg-slate-200/70 animate-pulse'

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

        // Only auto-select if we are in 'cars' mode (default)
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

    // Reset when type changes
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
    <div className="bg-white border-2 border-dark rounded-[32px] overflow-hidden shadow-[8px_8px_0_#000] p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-white">
          <TrendingDown className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight italic">Consulta de Valor Atualizado</h3>
      </div>

      <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-50 border-2 border-dark rounded-2xl">
        {[
          { id: 'cars', label: 'Carros' },
          { id: 'motorcycles', label: 'Motos' },
          { id: 'trucks', label: 'Caminhões' },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedType === type.id
                ? 'bg-dark text-white shadow-[4px_4px_0_#000]'
                : 'text-text-tertiary hover:bg-dark/5'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 mb-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Marca</label>
          {loading.brands ? (
            <div className={skeletonClass} />
          ) : (
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="">Selecione a Marca</option>
              {brands.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Modelo</label>
          {loading.models ? (
            <div className={skeletonClass} />
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedBrand}
              className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Selecione o Modelo</option>
              {models.map((m) => (
                <option key={m.code} value={m.code}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Ano Modelo</label>
          {loading.years ? (
            <div className={skeletonClass} />
          ) : (
            <select
              value={selectedYear ?? ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={!selectedModel}
              className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Selecione o Ano</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
          {years.length > 0 && (
            <p className="text-[10px] text-text-tertiary font-semibold ml-1">Exibindo somente os 6 anos mais recentes.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Versão / Combustível</label>
          {loading.versions ? (
            <div className={skeletonClass} />
          ) : (
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              disabled={!selectedYear}
              className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Selecione a Versão</option>
              {versions.map((version) => (
                <option key={version.code} value={version.code}>
                  {version.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading.detail && (
        <div className="pt-6 border-t-2 border-dark border-dashed">
          <div className="h-9 w-56 rounded bg-slate-200/80 animate-pulse" />
        </div>
      )}

      {!loading.detail && safeResult && hasAllFilters ? (
        <div className="space-y-4 pt-6 border-t-2 border-dark border-dashed">
          <div>
            <p className="text-[11px] text-text-tertiary uppercase font-black tracking-widest mb-1.5">Preço FIPE</p>
            <p className="text-4xl font-black text-dark tracking-[-0.05em]">{safeResult.price}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs font-bold">
            <div className="bg-surface border border-dark/20 rounded-xl px-3 py-2">
              <span className="text-text-tertiary uppercase tracking-wider">Ano Selecionado</span>
              <p className="text-dark mt-1">{selectedYear}</p>
            </div>
            <div className="bg-surface border border-dark/20 rounded-xl px-3 py-2">
              <span className="text-text-tertiary uppercase tracking-wider">Combustível</span>
              <p className="text-dark mt-1">{selectedVersionObj?.fuelType || safeResult.fuel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary bg-surface/50 p-3 rounded-xl border border-dashed border-dark/20">
            <Loader2 className="w-3 h-3 text-dark/40" />
            Referência mensal: {safeResult.referenceMonth} • Código oficial: {safeResult.codeFipe}
          </div>
        </div>
      ) : null}

      {!loading.detail && !hasValidResult && (
        <div className="pt-6 text-center text-text-tertiary font-bold italic border-t-2 border-dark border-dashed">
          Selecione marca, modelo, ano e versão para consultar o valor atualizado.
        </div>
      )}
    </div>
  )
}
