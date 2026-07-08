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
      <div className="fingen-shell">
        <div className="fingen-shell-content">
          <div className="fingen-shell-hero">
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Resultado</p>
            <h1 className="text-balance">Sua recomendação</h1>
          </div>

          <div className="fingen-grid-2" style={{ marginBottom: '24px' }}>
            <div className="fingen-card-white">
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Mais recomendado</p>
              {topResult && <ListingCard listing={topResult.listing} priority />}
            </div>

            <div className="fingen-card-white">
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>Seu perfil</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {answers.orcamento && <li>Orçamento: {answers.orcamento.label}</li>}
                {answers.usos.length > 0 && <li>Uso: {answers.usos.join(', ')}</li>}
                {answers.passageiros && <li>Passageiros: {answers.passageiros}</li>}
                {answers.prioridade && <li>Prioridade: {prioridades.find((p) => p.id === answers.prioridade)?.label}</li>}
                {answers.tipo && answers.tipo !== 'Qualquer' && <li>Tipo: {answers.tipo}</li>}
              </ul>
            </div>
          </div>

          <div className="fingen-grid-4" style={{ marginBottom: '32px' }}>
            {results.slice(1).map((result) => (
              <ListingCard key={result.listing.id} listing={result.listing} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <RotateCcw style={{ width: '16px', height: '16px' }} /> Refazer teste
            </button>
            <Link href="/carros-a-venda" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-inverse)', textDecoration: 'none', transition: 'all 0.15s ease' }}>
              Ver mais anúncios <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fingen-shell">
      <div className="fingen-shell-content" style={{ maxWidth: '560px' }}>
        <div className="fingen-shell-hero" style={{ paddingBottom: '16px' }}>
          <div className="fingen-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Qual carro</span>
          </div>
          <h1 className="text-balance">Qual carro combina com você?</h1>
          <p>Responda 5 perguntas rápidas e receba uma recomendação personalizada.</p>
        </div>
        {catalogLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Carregando anúncios...
          </div>
        )}
        {catalogError && (
          <div style={{ padding: '12px 16px', background: 'var(--color-danger-bg)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-lg)', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>
            {catalogError}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Passo {step + 1} de {steps.length}</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{steps[step]}</p>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-full)', marginBottom: '32px' }}>
          <div style={{ height: '6px', background: 'var(--color-text-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease', width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="fingen-card-white" style={{ padding: '24px' }}>
          {step === 0 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Qual é seu orçamento?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                {orcamentos.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => setAnswers((prev) => ({ ...prev, orcamento: o }))}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: answers.orcamento?.label === o.label ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                      background: answers.orcamento?.label === o.label ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                      color: answers.orcamento?.label === o.label ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Como você vai usar o carro?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {usos.map((uso) => (
                  <button
                    key={uso}
                    onClick={() => setAnswers((prev) => ({ ...prev, usos: prev.usos.includes(uso) ? prev.usos.filter((u) => u !== uso) : [...prev.usos, uso] }))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: answers.usos.includes(uso) ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                      background: answers.usos.includes(uso) ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                      color: answers.usos.includes(uso) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {uso}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Quantas pessoas você costuma levar?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {passageiros.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAnswers((prev) => ({ ...prev, passageiros: p }))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: answers.passageiros === p ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                      background: answers.passageiros === p ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                      color: answers.passageiros === p ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>O que mais pesa na decisão?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prioridades.map((prioridade) => (
                  <button
                    key={prioridade.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, prioridade: prioridade.id }))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: answers.prioridade === prioridade.id ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                      background: answers.prioridade === prioridade.id ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                      color: answers.prioridade === prioridade.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {prioridade.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Qual tipo de carro você quer?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tipos.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setAnswers((prev) => ({ ...prev, tipo }))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: answers.tipo === tipo ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                      background: answers.tipo === tipo ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                      color: answers.tipo === tipo ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '32px' }}>
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                opacity: step === 0 ? 0.4 : 1,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Voltar
            </button>
            <button
              type="button"
              onClick={next}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg-inverse)',
                color: 'var(--color-text-inverse)',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {step === steps.length - 1 ? 'Ver recomendações' : 'Continuar'}
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
