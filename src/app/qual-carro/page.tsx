'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from 'lucide-react'
import ListingCard from '@/components/marketplace/ListingCard'
import type { ListingPublic } from '@/lib/marketplace'

const steps = ['Orçamento', 'Uso', 'Passageiros', 'Prioridade', 'Tipo']

const orcamentos = [
  { label: 'Até R$ 70k', max: 70000 },
  { label: 'R$ 70k – R$ 100k', max: 100000, min: 70000 },
  { label: 'R$ 100k – R$ 150k', max: 150000, min: 100000 },
  { label: 'R$ 150k – R$ 200k', max: 200000, min: 150000 },
  { label: 'Acima de R$ 200k', min: 200000 },
]

const usos = ['Urbano (dia a dia)', 'Viagens frequentes', 'Trabalho (app/entrega)', 'Off-road/Aventura']

const passageiros = ['Só eu', '2 pessoas', '3-4 pessoas', '5+ pessoas']

const prioridades = [
  { id: 'economico', label: 'Economia de combustível' },
  { id: 'custo-beneficio', label: 'Custo-benefício' },
  { id: 'familia', label: 'Espaço e porta-malas' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'desempenho', label: 'Desempenho' },
  { id: 'tecnologia', label: 'Tecnologia' },
]

const tipos = ['Qualquer', 'Hatch', 'Sedan', 'SUV']

type RankedListing = { listing: ListingPublic; score: number }

function scoreListing(listing: ListingPublic, profileId: string) {
  const engine = `${listing.engine || ''} ${listing.fuel}`.toLowerCase()
  const options = (listing.optional_items || []).join(' ').toLowerCase()
  const fipeScore = listing.fipe_difference_percent != null
    ? Math.max(0, 30 - Math.max(-20, Math.min(40, Math.round(listing.fipe_difference_percent))))
    : 10
  const mileageScore = Math.max(0, 24 - Math.min(24, Math.round(listing.mileage / 5000)))
  const yearScore = Math.max(0, Math.min(18, listing.year_model - 2012))
  const newerScore = Math.max(0, Math.min(24, listing.year_model - (new Date().getFullYear() - 6)))

  switch (profileId) {
    case 'economico':
      return mileageScore + fipeScore + (/flex|gasoline/.test(engine) ? 6 : 0)
    case 'custo-beneficio':
      return fipeScore + mileageScore + yearScore + (listing.accepts_offers ? 4 : 0)
    case 'familia':
      return (
        yearScore +
        (listing.body_type?.toLowerCase().includes('suv') || listing.body_type?.toLowerCase().includes('sedan') ? 10 : 0) +
        (listing.doors && listing.doors >= 4 ? 8 : 0) +
        (listing.mileage < 80000 ? 6 : 0)
      )
    case 'seguranca':
      return newerScore + yearScore + (listing.doors && listing.doors >= 4 ? 5 : 0)
    case 'desempenho':
      return (
        ((listing.horsepower || 0) / 8) +
        (/turbo|tsi|tfs/i.test(engine) ? 12 : 0) +
        (listing.transmission?.toString().toLowerCase().includes('autom') ? 4 : 0) +
        Math.max(0, 18 - Math.floor(listing.mileage / 12000))
      )
    case 'tecnologia':
      return (
        (/android auto|carplay|multimedia|multimidia|bluetooth|wifi/.test(options) ? 15 : 0) +
        newerScore +
        (listing.transmission?.toString().toLowerCase().includes('autom') ? 4 : 0)
      )
    default:
      return newerScore + mileageScore + fipeScore
  }
}

export default function QualCarroPage() {
  const [listings, setListings] = useState<ListingPublic[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    orcamento: null as typeof orcamentos[0] | null,
    usos: [] as string[],
    passageiros: null as string | null,
    prioridade: null as string | null,
    tipo: null as string | null,
  })
  const [results, setResults] = useState<RankedListing[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadListings() {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const response = await fetch('/api/marketplace/listings?limit=48')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Falha ao carregar anúncios.')
        }
        if (!cancelled) {
          setListings(Array.isArray(data) ? data as ListingPublic[] : [])
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : 'Falha ao carregar anúncios.')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }

    void loadListings()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredResults = useMemo(() => {
    let filtered = [...listings]

    if (answers.orcamento) {
      filtered = filtered.filter((listing) => {
        if (answers.orcamento?.min && listing.price < answers.orcamento.min) return false
        if (answers.orcamento?.max && listing.price > answers.orcamento.max) return false
        return true
      })
    }

    if (answers.tipo && answers.tipo !== 'Qualquer') {
      const mapTipo: Record<string, string> = { Hatch: 'hatch', Sedan: 'sedan', SUV: 'suv' }
      const target = mapTipo[answers.tipo]
      if (target) filtered = filtered.filter((listing) => listing.body_type?.toLowerCase().includes(target))
    }

    if (filtered.length === 0) filtered = [...listings]

    const profileId = answers.prioridade || 'custo-beneficio'
    return filtered
      .map((listing) => ({ listing, score: scoreListing(listing, profileId) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [answers.orcamento, answers.prioridade, answers.tipo, listings])

  function handleFinish() {
    if (listings.length === 0) {
      setCatalogError('Catálogo indisponível no momento.')
      return
    }
    setResults(filteredResults)
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1)
    else handleFinish()
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  function reset() {
    setStep(0)
    setAnswers({ orcamento: null, usos: [], passageiros: null, prioridade: null, tipo: null })
    setResults(null)
  }

  if (results) {
    const topResult = results[0]
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm font-medium text-[#17170F] mb-1">Resultado</p>
        <h1 className="text-2xl font-bold text-[#0A0A0A] mb-6">Sua recomendação</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] gap-6 mb-6">
          <div className="bg-[#FAFAF9] rounded-[32px] p-5 border border-[#EAEAE8]">
            <p className="text-xs font-medium text-[#17170F] uppercase tracking-wider mb-3">Mais recomendado</p>
            {topResult && <ListingCard listing={topResult.listing} priority />}
          </div>

          <div className="bg-[#FAFAF9] rounded-[32px] p-5 border border-[#EAEAE8]">
            <h2 className="text-sm font-bold text-[#0A0A0A] mb-3">Seu perfil</h2>
            <ul className="text-xs text-[#525252] space-y-2">
              {answers.orcamento && <li>Orçamento: {answers.orcamento.label}</li>}
              {answers.usos.length > 0 && <li>Uso: {answers.usos.join(', ')}</li>}
              {answers.passageiros && <li>Passageiros: {answers.passageiros}</li>}
              {answers.prioridade && <li>Prioridade: {prioridades.find((p) => p.id === answers.prioridade)?.label}</li>}
              {answers.tipo && answers.tipo !== 'Qualquer' && <li>Tipo: {answers.tipo}</li>}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {results.slice(1).map((result) => (
            <ListingCard key={result.listing.id} listing={result.listing} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={reset} className="flex items-center justify-center gap-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] px-4 py-2.5 rounded-lg bg-[#FAFAF9] hover:bg-[#F4F4F2] transition-colors">
            <RotateCcw className="w-4 h-4" /> Refazer teste
          </button>
          <Link href="/carros-a-venda" className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-[#17170F] px-4 py-2.5 rounded-lg hover:opacity-90 transition-colors">
            Ver mais anúncios <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {catalogLoading && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#FAFAF9] px-4 py-3 text-sm font-semibold text-[#525252]">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando anúncios...
        </div>
      )}
      {catalogError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {catalogError}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[#A3A3A3]">Passo {step + 1} de {steps.length}</p>
        <p className="text-sm font-medium text-[#17170F]">{steps[step]}</p>
      </div>
      <div className="w-full bg-[#EAEAE8] rounded-full h-1.5 mb-8">
        <div className="bg-[#17170F] h-1.5 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="bg-[#FAFAF9] rounded-[32px] p-5 sm:p-6 border border-[#EAEAE8]">
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-[#0A0A0A] mb-4">Qual é seu orçamento?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {orcamentos.map((o) => (
                <button
                  key={o.label}
                  onClick={() => setAnswers((prev) => ({ ...prev, orcamento: o }))}
                  className={`p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.orcamento?.label === o.label
                      ? 'bg-[#ECFDF5] border-2 border-[#17170F] text-[#17170F]'
                      : 'border border-[#EAEAE8] hover:border-[#17170F]/30 text-[#525252] bg-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-[#0A0A0A] mb-4">Como você vai usar o carro?</h2>
            <div className="space-y-2">
              {usos.map((uso) => (
                <button
                  key={uso}
                  onClick={() => setAnswers((prev) => ({ ...prev, usos: prev.usos.includes(uso) ? prev.usos.filter((u) => u !== uso) : [...prev.usos, uso] }))}
                  className={`w-full p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.usos.includes(uso)
                      ? 'bg-[#ECFDF5] border-2 border-[#17170F] text-[#17170F]'
                      : 'border border-[#EAEAE8] hover:border-[#17170F]/30 text-[#525252] bg-white'
                  }`}
                >
                  {uso}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-[#0A0A0A] mb-4">Quantas pessoas você costuma levar?</h2>
            <div className="space-y-2">
              {passageiros.map((p) => (
                <button
                  key={p}
                  onClick={() => setAnswers((prev) => ({ ...prev, passageiros: p }))}
                  className={`w-full p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.passageiros === p
                      ? 'bg-[#ECFDF5] border-2 border-[#17170F] text-[#17170F]'
                      : 'border border-[#EAEAE8] hover:border-[#17170F]/30 text-[#525252] bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-[#0A0A0A] mb-4">O que mais pesa na decisão?</h2>
            <div className="space-y-2">
              {prioridades.map((prioridade) => (
                <button
                  key={prioridade.id}
                  onClick={() => setAnswers((prev) => ({ ...prev, prioridade: prioridade.id }))}
                  className={`w-full p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.prioridade === prioridade.id
                      ? 'bg-[#ECFDF5] border-2 border-[#17170F] text-[#17170F]'
                      : 'border border-[#EAEAE8] hover:border-[#17170F]/30 text-[#525252] bg-white'
                  }`}
                >
                  {prioridade.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-[#0A0A0A] mb-4">Qual tipo de carro você quer?</h2>
            <div className="space-y-2">
              {tipos.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setAnswers((prev) => ({ ...prev, tipo }))}
                  className={`w-full p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.tipo === tipo
                      ? 'bg-[#ECFDF5] border-2 border-[#17170F] text-[#17170F]'
                      : 'border border-[#EAEAE8] hover:border-[#17170F]/30 text-[#525252] bg-white'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#EAEAE8] bg-white px-4 py-2.5 text-sm font-medium text-[#525252] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-lg bg-[#17170F] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {step === steps.length - 1 ? 'Ver recomendações' : 'Continuar'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
