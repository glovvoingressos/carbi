'use client'

import React, { useState, useEffect } from 'react'
import { TrendingDown, ChevronRight, Gauge, Zap } from 'lucide-react'
import { FipeItem, FipeResult } from '@/lib/fipe-api'
import { formatBRL } from '@/data/cars'

interface FipeCalculatorProps {
  initialBrandName: string
  initialModelName: string
  initialYear: number | string
}

export default function FipeCalculator({
  initialBrandName,
  initialModelName,
  initialYear,
}: FipeCalculatorProps) {
  const [brands, setBrands] = useState<FipeItem[]>([])
  const [models, setModels] = useState<FipeItem[]>([])
  const [years, setYears] = useState<FipeItem[]>([])
  
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  
  const [result, setResult] = useState<FipeResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch Brands on mount
  useEffect(() => {
    async function init() {
      const response = await fetch('/api/fipe/brands')
      const data = await response.json()
      setBrands(data)

      // Find initial brand
      const b = data.find((b: FipeItem) => 
        b.name.toLowerCase() === initialBrandName.toLowerCase() ||
        b.name.toLowerCase().includes(initialBrandName.toLowerCase())
      )
      if (b) setSelectedBrand(b.code)
    }
    init()
  }, [initialBrandName])

  // Fetch Models when Brand changes
  useEffect(() => {
    if (!selectedBrand) return
    async function fetchModels() {
      setLoading(true)
      const response = await fetch(`/api/fipe/models?brandCode=${selectedBrand}`)
      const data = await response.json()
      setModels(data)
      
      // Auto-select initial model if it matches
      const m = data.find((m: FipeItem) => {
        const name = m.name.toLowerCase()
        const search = initialModelName.toLowerCase()
        return name === search || name.startsWith(search + ' ')
      })
      if (m && !selectedModel) setSelectedModel(m.code)
      
      setLoading(false)
    }
    fetchModels()
  }, [selectedBrand, initialModelName])

  // Fetch Years when Model changes
  useEffect(() => {
    if (!selectedBrand || !selectedModel) return
    async function fetchYears() {
      setLoading(true)
      const response = await fetch(`/api/fipe/years?brandCode=${selectedBrand}&modelCode=${selectedModel}`)
      const data: FipeItem[] = await response.json()
      
      // Sort descending (latest years first)
      const sorted = [...data].sort((a, b) => {
        const ya = parseInt(a.name) || 0
        const yb = parseInt(b.name) || 0
        return yb - ya
      })
      
      setYears(sorted)
      
      // Auto-select initial year if matches
      const y = sorted.find((y: FipeItem) => y.name.includes(initialYear.toString())) 
             || sorted.find((y: FipeItem) => y.name.toLowerCase().includes('zero km'))
             || sorted[0]

      if (y && !selectedYear) setSelectedYear(y.code)
      
      setLoading(false)
    }
    fetchYears()
  }, [selectedBrand, selectedModel, initialYear])

  // Fetch Detail when Year changes
  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedYear) return
    async function fetchDetail() {
      setLoading(true)
      const response = await fetch(`/api/fipe/detail?brandCode=${selectedBrand}&modelCode=${selectedModel}&yearCode=${selectedYear}`)
      const data = await response.json()
      setResult(data)
      setLoading(false)
    }
    fetchDetail()
  }, [selectedBrand, selectedModel, selectedYear])

  const parseFipeValue = (val: string) => parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
  const fipePrice = result ? parseFipeValue(result.price) : 0;

  return (
    <div className="bg-white border-2 border-dark rounded-[32px] overflow-hidden shadow-[8px_8px_0_#000] p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--color-bento-red)] rounded-xl flex items-center justify-center text-white shadow-[2px_2px_0_#000] border border-dark">
          <TrendingDown className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight italic">Calculadora FIPE Real</h3>
      </div>

      <div className="grid gap-4 mb-8">
        {/* Brand Select (Read only or disabled since we are on a specific car page, but let's keep it for context) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Marca</label>
          <select 
            value={selectedBrand} 
            onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(''); setSelectedYear(''); }}
            className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="">Selecione a Marca</option>
            {brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        </div>

        {/* Model/Version Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Versão / Modelo</label>
          <select 
            value={selectedModel} 
            onChange={(e) => { setSelectedModel(e.target.value); setSelectedYear(''); }}
            disabled={!selectedBrand || loading}
            className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">Selecione a Versão</option>
            {models.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
          </select>
        </div>

        {/* Year Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Ano Modelo</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!selectedModel || loading}
            className="w-full bg-surface border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark focus:ring-0 appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">Selecione o Ano</option>
            {years.map(y => <option key={y.code} value={y.code}>{y.name}</option>)}
          </select>
        </div>
      </div>

      {result ? (
        <div className="space-y-6 pt-6 border-t-2 border-dark border-dashed">
          <div>
            <p className="text-[11px] text-text-tertiary uppercase font-black tracking-widest mb-1.5">FIPE Atualizada</p>
            <p className="text-4xl font-black text-dark tracking-[-0.05em]">{result.price}</p>
          </div>

          {/* Projeção */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-surface border-2 border-dark rounded-2xl p-4 shadow-[4px_4px_0_#000]">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary mb-1">Previsão 2026</p>
                <p className="text-lg font-black text-dark">{formatBRL(fipePrice * 0.88)}</p>
             </div>
             <div className="bg-surface border-2 border-dark rounded-2xl p-4 shadow-[4px_4px_0_#000]">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary mb-1">Previsão 2027</p>
                <p className="text-lg font-black text-dark">{formatBRL(fipePrice * 0.81)}</p>
             </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary bg-surface/50 p-3 rounded-xl border border-dashed border-dark/20">
             <Zap className="w-3 h-3 text-[var(--color-bento-yellow)] fill-current" />
             Dados extraídos em tempo real • Ref: {result.referenceMonth}
          </div>
        </div>
      ) : (
        <div className="pt-6 text-center text-text-tertiary font-bold italic">
          {loading ? 'Consultando base FIPE...' : 'Selecione os filtros acima'}
        </div>
      )}
    </div>
  )
}
