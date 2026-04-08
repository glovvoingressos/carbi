'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cars, matchCarToProfile, formatBRL } from '@/data/cars'
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react'

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

export default function QualCarroPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    orcamento: null as typeof orcamentos[0] | null,
    usos: [] as string[],
    passageiros: null as string | null,
    prioridade: null as string | null,
    tipo: null as string | null,
  })
  const [results, setResults] = useState<ReturnType<typeof calculateResults> | null>(null)

  function calculateResults() {
    let filtered = [...cars]

    if (answers.orcamento) {
      filtered = filtered.filter((c) => {
        if (answers.orcamento!.min && c.priceBrl < answers.orcamento!.min) return false
        if (answers.orcamento!.max && c.priceBrl > answers.orcamento!.max) return false
        return true
      })
    }
    if (answers.tipo && answers.tipo !== 'Qualquer') {
      const mapTipo: Record<string, string> = { 'Hatch': 'hatch', 'Sedan': 'sedan', 'SUV': 'suv' }
      if (mapTipo[answers.tipo]) {
        filtered = filtered.filter((c) => c.segment === mapTipo[answers.tipo!])
      }
    }

    if (filtered.length === 0) filtered = [...cars]

    const profileId = answers.prioridade || 'custo-beneficio'
    const scored = filtered
      .map((car) => ({
        car,
        score: matchCarToProfile(car, profileId),
      }))
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, 5)
  }

  function handleFinish() {
    setResults(calculateResults())
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

  /* Results view */
  if (results) {
    const topResult = results[0]
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm font-medium text-primary mb-1">Resultado</p>
        <h1 className="text-2xl font-bold text-text mb-6">Sua recomenda&ccedil;&atilde;o</h1>

        {/* Top pick */}
        <div className="bg-white border border-primary/20 rounded-xl p-5 mb-4">
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Mais recomendado</p>
          <div className="flex items-center gap-4">
            <img src={topResult.car.image} alt={topResult.car.model} className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-text">{topResult.car.brand} {topResult.car.model}</h2>
              <p className="text-xs text-text-secondary">{topResult.car.version} &middot; {topResult.car.year}</p>
              <p className="text-lg font-bold text-primary mt-1">{formatBRL(topResult.car.priceBrl)}</p>
            </div>
            <Link
              href={`/${topResult.car.brand.toLowerCase().replace(/\s+/g, '-')}/${topResult.car.slug}`}
              className="text-sm font-medium text-primary hover:underline flex-shrink-0"
            >
              Ver detalhes &rarr;
            </Link>
          </div>
        </div>

        {/* Other picks */}
        <div className="space-y-2 mb-8">
          {results.slice(1).map((result, i) => (
            <div key={result.car.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <span className="text-xs font-bold text-text-tertiary w-6 text-center">{i + 2}</span>
              <img src={result.car.image} alt={result.car.model} className="w-14 h-10 object-cover rounded hidden sm:block" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{result.car.brand} {result.car.model}</p>
                <p className="text-xs text-text-secondary">{result.car.version}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{formatBRL(result.car.priceBrl)}</p>
                <p className="text-xs text-text-secondary">Match {Math.round(result.score)}%</p>
              </div>
              <Link
                href={`/${result.car.brand.toLowerCase().replace(/\s+/g, '-')}/${result.car.slug}`}
                className="text-xs font-medium text-primary hover:underline flex-shrink-0"
              >
                Ver &rarr;
              </Link>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-text mb-2">Seu perfil</h3>
          <ul className="text-xs text-text-secondary space-y-1">
            {answers.orcamento && <li>Orçamento: {answers.orcamento.label}</li>}
            {answers.usos.length > 0 && <li>Uso: {answers.usos.join(', ')}</li>}
            {answers.passageiros && <li>Passageiros: {answers.passageiros}</li>}
            {answers.prioridade && <li>Prioridade: {prioridades.find((p) => p.id === answers.prioridade)?.label}</li>}
            {answers.tipo && answers.tipo !== 'Qualquer' && <li>Tipo: {answers.tipo}</li>}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={reset} className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-text px-4 py-2.5 border border-border rounded-lg hover:bg-white transition-colors">
            <RotateCcw className="w-4 h-4" /> Refazer teste
          </button>
          <Link href="/comparar" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            Comparar carros &rarr;
          </Link>
        </div>
      </div>
    )
  }

  /* Quiz steps */
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-text-tertiary">Passo {step + 1} de {steps.length}</p>
        <p className="text-sm font-medium text-primary">{steps[step]}</p>
      </div>
      <div className="w-full bg-border rounded-full h-1.5 mb-8">
        <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="bg-white border border-border rounded-xl p-5 sm:p-6">
        {/* Step 0: Budget */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-text mb-4">Qual &eacute; seu orçamento?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {orcamentos.map((o) => (
                <button key={o.label}
                  onClick={() => setAnswers((prev) => ({ ...prev, orcamento: o }))}
                  className={`p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.orcamento?.label === o.label
                      ? 'bg-primary-light border-2 border-primary text-primary'
                      : 'border border-border hover:border-primary/30 text-text-secondary bg-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Usage */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-text mb-1">Para que voc&ecirc; vai usar o carro?</h2>
            <p className="text-xs text-text-secondary mb-4">Pode marcar mais de um.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usos.map((u) => (
                <button key={u}
                  onClick={() => setAnswers((prev) => ({
                    ...prev,
                    usos: prev.usos.includes(u) ? prev.usos.filter((x) => x !== u) : [...prev.usos, u],
                  }))}
                  className={`p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.usos.includes(u)
                      ? 'bg-primary-light border-2 border-primary text-primary'
                      : 'border border-border hover:border-primary/30 text-text-secondary bg-white'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Passengers */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-text mb-4">Quantas pessoas vão no carro?</h2>
            <div className="grid grid-cols-2 gap-2">
              {passageiros.map((p) => (
                <button key={p}
                  onClick={() => setAnswers((prev) => ({ ...prev, passageiros: p }))}
                  className={`p-3.5 rounded-lg text-center text-sm font-medium transition-all ${
                    answers.passageiros === p
                      ? 'bg-primary-light border-2 border-primary text-primary'
                      : 'border border-border hover:border-primary/30 text-text-secondary bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3: Priority */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-text mb-1">O que é mais importante?</h2>
            <p className="text-xs text-text-secondary mb-4">Selecione sua prioridade principal.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prioridades.map((p) => (
                <button key={p.id}
                  onClick={() => setAnswers((prev) => ({ ...prev, prioridade: p.id }))}
                  className={`p-3.5 rounded-lg text-left text-sm font-medium transition-all ${
                    answers.prioridade === p.id
                      ? 'bg-primary-light border-2 border-primary text-primary'
                      : 'border border-border hover:border-primary/30 text-text-secondary bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4: Type */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-text mb-4">Pref&ecirc;rencia por tipo?</h2>
            <div className="flex flex-wrap gap-2">
              {tipos.map((t) => (
                <button key={t}
                  onClick={() => setAnswers((prev) => ({ ...prev, tipo: t }))}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    answers.tipo === t
                      ? 'bg-primary-light border-primary text-primary'
                      : 'border-border hover:border-primary/30 text-text-secondary bg-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <button onClick={prev} disabled={step === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
              step === 0 ? 'text-text-tertiary' : 'text-text-secondary hover:bg-surface'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {step === steps.length - 1 ? 'Ver resultado' : 'Avançar'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
