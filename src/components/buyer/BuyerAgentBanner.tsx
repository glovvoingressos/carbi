'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search, BellRing } from 'lucide-react'

const EXAMPLES = ['SUV automático até R$ 120 mil', 'Audi Q3 2015 até R$ 200 mil', 'Corolla 2021 ou mais novo até R$ 130 mil']

export default function BuyerAgentBanner() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const submit = (q: string) => {
    const phrase = q.trim()
    router.push(`/procurar-meu-carro${phrase ? `?q=${encodeURIComponent(phrase)}` : ''}`)
  }

  return (
    <section className="buyer-hero" style={{ textAlign: 'center' }}>
      <div className="buyer-hero-eyebrow" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        <BellRing size={14} /> Procure Meu Carro
      </div>
      <h2 className="buyer-hero-title">Não encontrou o que procura?</h2>
      <p className="buyer-hero-desc" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        Diga qual carro você quer. O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura.
      </p>
      <form
        className="buyer-hero-form"
        style={{ margin: '0 auto' }}
        onSubmit={(e) => {
          e.preventDefault()
          submit(query)
        }}
      >
        <input
          className="buyer-hero-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: SUV automático até R$ 120 mil"
          aria-label="Descreva o carro que você procura"
        />
        <button type="submit" className="buyer-hero-submit" disabled={!query.trim()}>
          Procurar para mim <ArrowRight size={16} />
        </button>
      </form>
      <div className="buyer-hero-example" style={{ marginTop: '16px' }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => submit(ex)}
            className="buyer-chip"
            style={{ fontSize: '12px', padding: '6px 14px', borderColor: 'rgba(255,255,255,0.25)', background: 'transparent', color: 'rgba(255,255,255,0.8)' }}
          >
            <Search size={12} style={{ marginRight: 6, verticalAlign: '-2px' }} /> {ex}
          </button>
        ))}
      </div>
    </section>
  )
}
