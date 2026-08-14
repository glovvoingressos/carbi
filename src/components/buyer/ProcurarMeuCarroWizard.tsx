'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Search, Pencil, Check, Loader2, Car, MapPin, Gauge, Calendar, Wallet, Fuel, Heart, X, Mail, BellRing } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import type { CarCriteria } from '@/lib/buyer-agent/types'

type Interpreted = {
  query: string
  source: 'rules' | 'llm'
  criteria: CarCriteria
  lines: { key: string; label: string; value: string }[]
  needsFollowUp: boolean
  followUpQuestion?: string
  ambiguous: boolean
}

type ResultItem = {
  slug: string
  brand: string
  model: string
  year_model: number
  price: number
  mileage: number | null
  city: string
  state: string
  transmission: string | null
  image: string | null
  level: 'exato' | 'proximo' | 'possivel'
  explanation: string
}

type View = 'input' | 'loading' | 'confirm' | 'results' | 'saved'

const BODY_TYPES = ['SUV', 'Sedan', 'Hatch', 'Pickup', 'Esportivo', 'Coupe', 'Perua']
const FUELS = ['elétrico', 'híbrido', 'flex', 'gasolina', 'álcool', 'diesel']

const levelLabels: Record<ResultItem['level'], string> = {
  exato: 'MATCH EXATO',
  proximo: 'MATCH PRÓXIMO',
  possivel: 'POSSÍVEL MATCH',
}

const PROMISE_COPY =
  'O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura. Quando aparecer uma oportunidade compatível, avisaremos você.'

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ProcurarMeuCarroWizard({
  initialQuery,
  isLoggedIn,
}: {
  initialQuery?: string
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(isLoggedIn)
  const [query, setQuery] = useState(initialQuery || '')
  const [submitted, setSubmitted] = useState(!!initialQuery)
  const [view, setView] = useState<View>(initialQuery ? 'loading' : 'input')
  const [interpreted, setInterpreted] = useState<Interpreted | null>(null)
  const [criteria, setCriteria] = useState<CarCriteria | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [results, setResults] = useState<ResultItem[] | null>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedInfo, setSavedInfo] = useState<{ summary: string; searchUrl: string } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured() || isLoggedIn) return
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data: { session } }: { data: { session: { user?: { id: string } } | null } }) => {
        setLoggedIn(!!session?.user)
      })
      .catch(() => undefined)
  }, [isLoggedIn])

  const interpretQuery = useCallback(async (phrase: string) => {
    setView('loading')
    setError(null)
    try {
      const res = await fetch('/api/procurar/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: phrase }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não entendemos sua busca. Tente reformular.')
      setInterpreted(data)
      setCriteria(data.criteria)
      setResults(null)
      setIsEditing(false)
      setView('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não entendemos sua busca.')
      setView('input')
    } finally {
      setSubmitted(false)
    }
  }, [])

  useEffect(() => {
    if (submitted && query) {
      const timer = window.setTimeout(() => void interpretQuery(query), 0)
      return () => window.clearTimeout(timer)
    }
  }, [submitted, query, interpretQuery])

  const runSearch = useCallback(async (crit: CarCriteria) => {
    setView('loading')
    setResultsError(null)
    try {
      const res = await fetch('/api/procurar/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: crit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao buscar carros.')
      setResults(data.items || [])
      setView('results')
    } catch (err) {
      setResultsError(err instanceof Error ? err.message : 'Falha ao buscar carros.')
      setView('results')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const phrase = query.trim()
    if (!phrase) return
    router.replace(`/procurar-meu-carro?q=${encodeURIComponent(phrase)}`, { scroll: false })
    setSubmitted(true)
  }

  const handleConfirm = () => {
    if (criteria) void runSearch(criteria)
    else if (interpreted) void runSearch(interpreted.criteria)
  }

  const updateCriteria = (patch: Partial<CarCriteria>) => {
    setCriteria((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const pickFollowUp = (patch: Partial<CarCriteria>) => {
    const next = criteria ? { ...criteria, ...patch } : criteria
    setCriteria(next)
    if (interpreted) setInterpreted({ ...interpreted, needsFollowUp: false })
    if (next) void runSearch(next)
  }

  const saveSearch = async () => {
    if (!criteria) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/procurar/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_query: interpreted?.query || query,
          criteria,
          interpretation_source: interpreted?.source || 'rules',
          contact_email: loggedIn ? undefined : email.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não foi possível salvar sua busca.')
      setSavedInfo(data)
      setView('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar sua busca.')
    } finally {
      setSaving(false)
    }
  }

  const criteriaSummaryLine = useMemo(() => {
    if (!criteria) return ''
    const parts = [
      criteria.brand && criteria.model ? `${criteria.brand} ${criteria.model}` : criteria.brand || criteria.model,
      criteria.year_min !== null && criteria.year_max !== null && criteria.year_min === criteria.year_max
        ? String(criteria.year_min)
        : null,
      criteria.year_min !== null && criteria.year_max !== null && criteria.year_max !== criteria.year_min
        ? `${criteria.year_min}-${criteria.year_max}`
        : null,
      criteria.year_min !== null && criteria.year_max === null ? `${criteria.year_min}+` : null,
      criteria.year_max !== null && criteria.year_min === null ? `até ${criteria.year_max}` : null,
      criteria.price_max !== null ? `até ${formatBRL(criteria.price_max)}` : null,
      criteria.city || criteria.state || null,
    ].filter(Boolean)
    return parts.join(' · ')
  }, [criteria])

  const hasResults = results && results.length > 0

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20">
      {/* Step 1 — input */}
      {view === 'input' && (
        <section className="buyer-hero">
          <span className="buyer-hero-eyebrow">
            <Search size={14} /> Procure Meu Carro
          </span>
          <h1 className="buyer-hero-title">Diga o que você procura. A gente cuida da caça.</h1>
          <p className="buyer-hero-desc">
            Conte para o Carbi qual carro você está procurando — do jeito que você falaria com um especialista.
          </p>
          <form className="buyer-hero-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              rows={2}
              placeholder="Ex: Quero um Audi Q3 2015 até R$ 200 mil"
              aria-label="Descreva o carro que você procura"
              className="buyer-hero-input resize-none"
            />
            <button type="submit" className="buyer-hero-submit" disabled={!query.trim()}>
              Procurar para mim <ArrowRight size={16} />
            </button>
          </form>
          <p className="buyer-hero-example">
            Ex: <strong>“SUV automático até R$ 120 mil”</strong> · <strong>“Corolla 2021 ou mais novo até R$ 130 mil”</strong>
          </p>
        </section>
      )}

      {/* Loading */}
      {view === 'loading' && (
        <div className="buyer-loading" role="status" aria-live="polite">
          <div className="buyer-spinner" />
          <p>Entendendo o que você procura…</p>
        </div>
      )}

      {error && <div className="buyer-error">{error}</div>}

      {/* Step 2 — confirm */}
      {view === 'confirm' && interpreted && criteria && (
        <section>
          <h1 className="buyer-title">Entendemos que você procura:</h1>
          <p className="buyer-lead">{PROMISE_COPY}</p>

          {interpreted.needsFollowUp && interpreted.followUpQuestion && !isEditing && (
            <div className="buyer-followup">
              <p>{interpreted.followUpQuestion}</p>
              <div className="buyer-chip-row">
                <button className="buyer-chip buyer-chip-active" onClick={() => pickFollowUp({ transmission: 'automatico' })}>
                  Automático
                </button>
                <button className="buyer-chip" onClick={() => pickFollowUp({ transmission: 'manual' })}>
                  Manual
                </button>
                <button className="buyer-chip" onClick={() => pickFollowUp({ transmission: null })}>
                  Tanto faz
                </button>
              </div>
            </div>
          )}

          {isEditing && (
            <EditCriteriaForm criteria={criteria} onChange={updateCriteria} onDone={() => { setIsEditing(false); handleConfirm() }} />
          )}

          {!isEditing && (
            <>
              <div className="buyer-card">
                <div className="buyer-criteria-grid">
                  {interpreted.lines.map((line) => (
                    <div className="buyer-criteria-item" key={line.key}>
                      <div className="buyer-criteria-item-label">{line.label}</div>
                      <div className="buyer-criteria-item-value">{line.value}</div>
                    </div>
                  ))}
                  {interpreted.lines.length === 0 && (
                    <div className="buyer-criteria-item">
                      <div className="buyer-criteria-item-label">O que você busca</div>
                      <div className="buyer-criteria-item-value">{interpreted.query}</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="buyer-btn buyer-btn-dark" onClick={handleConfirm}>
                    Está certo <ArrowRight size={16} />
                  </button>
                  <button className="buyer-btn buyer-btn-light" onClick={() => setIsEditing(true)}>
                    <Pencil size={16} /> Editar
                  </button>
                </div>
              </div>
              <button className="mt-4 text-sm font-semibold text-[#5A47D1] hover:underline" onClick={() => { setView('input'); setInterpreted(null); setCriteria(null); setQuery(''); }}>
                Reformular busca
              </button>
            </>
          )}
        </section>
      )}

      {/* Step 3 — results */}
      {view === 'results' && criteria && (
        <section>
          <div className="buyer-procurando">
            <div className="buyer-procurando-label">Você está procurando</div>
            <div className="buyer-procurando-line">{criteriaSummaryLine}</div>
          </div>

          {resultsError && <div className="buyer-error">{resultsError}</div>}

          {hasResults ? (
            <>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#1A1A1A]">Encontramos {results.length} opç{results.length === 1 ? 'ão' : 'ões'} compatíve{results.length === 1 ? 'l' : 'is'}</h2>
                <p className="text-sm text-[#3A3A3A]">{PROMISE_COPY}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((item) => (
                  <ResultCard key={item.slug} item={item} />
                ))}
              </div>
            </>
          ) : (
            <div className="buyer-empty">
              <div className="buyer-empty-icon">
                <Car size={40} strokeWidth={1.5} />
              </div>
              <h3>Ainda não encontramos o carro certo.</h3>
              <p>Não encontramos atualmente uma opção que corresponda aos critérios que você informou.</p>
              <p className="mb-6">Mas podemos continuar procurando. Cadastre sua busca e avisaremos quando aparecer uma oportunidade compatível.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <SaveSearchButtons
                  isLoggedIn={loggedIn}
                  saving={saving}
                  email={email}
                  setEmail={setEmail}
                  onSave={saveSearch}
                  ctaLabel="Continuar procurando para mim"
                />
              </div>
            </div>
          )}

          {/* Always offer to keep watching after results */}
          {hasResults && (
            <div className="buyer-save-panel">
              <div className="mb-3 flex items-center gap-2">
                <BellRing size={16} className="text-[#1A1A1A]" />
                <strong className="text-[15px]">Quer que a gente continue de olho?</strong>
              </div>
              <p className="mb-4 text-sm text-[#3A3A3A]">
                Novos carros aparecem todos os dias. Acompanhamos os anúncios e avisamos quando surgir uma oportunidade compatível.
              </p>
              <SaveSearchButtons
                isLoggedIn={loggedIn}
                saving={saving}
                email={email}
                setEmail={setEmail}
                onSave={saveSearch}
                ctaLabel="Avisar quando aparecer"
              />
            </div>
          )}
        </section>
      )}

      {/* Saved confirmation */}
      {view === 'saved' && savedInfo && (
        <section className="mx-auto max-w-2xl text-center py-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4F576]">
            <Check size={30} strokeWidth={2.5} />
          </div>
          <h1 className="buyer-title">Busca registrada!</h1>
          <p className="buyer-lead">PROCURANDO: <strong>{savedInfo.summary}</strong></p>
          <div className="mb-8 rounded-2xl bg-[#1A1A1A] p-5 text-left text-sm leading-relaxed text-white/85">
            {PROMISE_COPY}
            <div className="mt-3 flex items-center gap-2 text-[#D4F576]">
              <BellRing size={15} /> Você será avisado por e-mail e dentro do Carbi.
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/carros-a-venda" className="buyer-btn buyer-btn-light">
              Explorar carros à venda
            </Link>
            <a className="buyer-btn buyer-btn-dark" href={savedInfo.searchUrl}>
              Ver minha busca <ArrowRight size={16} />
            </a>
          </div>
        </section>
      )}
    </div>
  )
}

function ResultCard({ item }: { item: ResultItem }) {
  return (
    <article className="buyer-result-card">
      <div className="buyer-result-media">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={`${item.brand} ${item.model} ${item.year_model}`} loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EDEBE6] text-[#857C6B]">
            <Car size={40} strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="buyer-result-body">
        <span className={`buyer-badge buyer-badge-${item.level}`}>{levelLabels[item.level]}</span>
        <h3 className="buyer-result-title">
          {item.brand} {item.model} {item.year_model}
        </h3>
        <div className="buyer-result-price">{formatBRL(item.price)}</div>
        <div className="buyer-result-specs">
          {item.transmission && (
            <span className="buyer-result-spec">
              <Gauge size={14} /> {item.transmission}
            </span>
          )}
          {item.mileage != null && (
            <span className="buyer-result-spec">
              <Calendar size={14} /> {item.mileage.toLocaleString('pt-BR')} km
            </span>
          )}
          <span className="buyer-result-spec">
            <MapPin size={14} /> {item.city}{item.state ? `/${item.state}` : ''}
          </span>
        </div>
        {item.explanation && <p className="buyer-result-explain">{item.explanation}</p>}
        <Link href={`/anuncios/${item.slug}`} className="buyer-ver-carro">
          Ver carro <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}

function SaveSearchButtons({
  isLoggedIn,
  saving,
  email,
  setEmail,
  onSave,
  ctaLabel,
}: {
  isLoggedIn: boolean
  saving: boolean
  email: string
  setEmail: (v: string) => void
  onSave: () => void
  ctaLabel: string
}) {
  return (
    <div className="w-full max-w-md">
      {!isLoggedIn && (
        <div className="buyer-save-row mb-3">
          <Mail size={18} className="shrink-0 text-[#857C6B]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu e-mail"
            aria-label="Seu e-mail para receber os avisos"
            required
          />
        </div>
      )}
      <button className="buyer-btn buyer-btn-chartreuse w-full" onClick={onSave} disabled={saving || (!isLoggedIn && !email.trim())}>
        {saving ? (<><Loader2 size={16} className="animate-spin" /> Salvando…</>) : (<>{ctaLabel} <ArrowRight size={16} /></>)}
      </button>
    </div>
  )
}

function EditCriteriaForm({
  criteria,
  onChange,
  onDone,
}: {
  criteria: CarCriteria
  onChange: (patch: Partial<CarCriteria>) => void
  onDone: () => void
}) {
  const [yearMin, setYearMin] = useState(criteria.year_min != null ? String(criteria.year_min) : '')
  const [yearMax, setYearMax] = useState(criteria.year_max != null ? String(criteria.year_max) : '')
  const [priceMin, setPriceMin] = useState(criteria.price_min != null ? String(criteria.price_min) : '')
  const [priceMax, setPriceMax] = useState(criteria.price_max != null ? String(criteria.price_max) : '')

  const applyNumber = (patch: Record<string, string>) => {
    const next: Partial<CarCriteria> = {}
    if (patch.yearMin !== undefined) next.year_min = patch.yearMin ? Number(patch.yearMin) : null
    if (patch.yearMax !== undefined) next.year_max = patch.yearMax ? Number(patch.yearMax) : null
    if (patch.priceMin !== undefined) next.price_min = patch.priceMin ? Number(patch.priceMin) : null
    if (patch.priceMax !== undefined) next.price_max = patch.priceMax ? Number(patch.priceMax) : null
    onChange(next)
  }

  return (
    <div className="buyer-card mb-6">
      <h2 className="mb-4">Editar busca</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="buyer-field">
          <label htmlFor="edit-brand">Marca</label>
          <input id="edit-brand" value={criteria.brand || ''} onChange={(e) => onChange({ brand: e.target.value || null })} placeholder="Ex: Audi, Toyota, SUV…" />
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-model">Modelo</label>
          <input id="edit-model" value={criteria.model || ''} onChange={(e) => onChange({ model: e.target.value || null })} placeholder="Ex: Q3, Corolla, Polo…" />
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-yearmin">Ano mínimo</label>
          <input id="edit-yearmin" type="number" inputMode="numeric" min={1980} max={2027} value={yearMin} onChange={(e) => { setYearMin(e.target.value); applyNumber({ yearMin: e.target.value }) }} placeholder="Ex: 2021" />
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-yearmax">Ano máximo</label>
          <input id="edit-yearmax" type="number" inputMode="numeric" min={1980} max={2027} value={yearMax} onChange={(e) => { setYearMax(e.target.value); applyNumber({ yearMax: e.target.value }) }} placeholder="Ex: 2016" />
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-pricemin">Preço mínimo (R$)</label>
          <input id="edit-pricemin" type="number" inputMode="numeric" min={0} value={priceMin} onChange={(e) => { setPriceMin(e.target.value); applyNumber({ priceMin: e.target.value }) }} placeholder="Ex: 100000" />
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-pricemax">Preço máx (R$)</label>
          <input id="edit-pricemax" type="number" inputMode="numeric" min={0} value={priceMax} onChange={(e) => { setPriceMax(e.target.value); applyNumber({ priceMax: e.target.value }) }} placeholder="Ex: 200000" />
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-transmission">Câmbio</label>
          <select id="edit-transmission" value={criteria.transmission || ''} onChange={(e) => onChange({ transmission: (e.target.value || null) as CarCriteria['transmission'] })}>
            <option value="">Tanto faz</option>
            <option value="automatico">Automático</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-fuel">Combustível</label>
          <select id="edit-fuel" value={criteria.fuel || ''} onChange={(e) => onChange({ fuel: e.target.value || null })}>
            <option value="">Tanto faz</option>
            {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-body">Carroceria</label>
          <select id="edit-body" value={criteria.body_type || ''} onChange={(e) => onChange({ body_type: e.target.value || null })}>
            <option value="">Tanto faz</option>
            {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="buyer-field">
          <label htmlFor="edit-city">Localização</label>
          <input id="edit-city" value={criteria.city || ''} onChange={(e) => onChange({ city: e.target.value || null })} placeholder="Ex: Belo Horizonte" />
        </div>
      </div>
      <button className="buyer-btn buyer-btn-dark" onClick={onDone}>
        Confirmar critérios <ArrowRight size={16} />
      </button>
    </div>
  )
}