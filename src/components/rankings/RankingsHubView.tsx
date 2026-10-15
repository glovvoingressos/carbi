'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import type { RankingModelItem } from '@/lib/rankings-data'
import { ArrowRight, Search, Sparkles, ChevronRight } from 'lucide-react'
import { getSeptemberFirstHalfShare } from '@/data/rankings-september-2026'

interface Props {
  initialNewRankings: RankingModelItem[]
  periodLabel?: string
  periodSlug?: string
}

const FENABRAVE_SOURCE = 'https://www.fenabrave.org.br/relatorios/rel_MaisVendidos.asp'
const BRIGHT_SOURCE = 'https://pt.linkedin.com/posts/bright-consulting-isd_an%C3%A1lise-de-vendas-quinzenal-setembro-2026-activity-7506035976927117314-YTPr'
const MODEL_COUNTS_SOURCE = 'https://motor1.uol.com.br/news/808566/carros-mais-vendidos-quinzena-setembro/'

export default function RankingsHubView({
  initialNewRankings,
  periodLabel = 'Setembro / 2026 · 1ª quinzena',
  periodSlug = 'setembro-2026',
}: Props) {
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)
  const rankings = initialNewRankings

  const filteredRankings = useMemo(() => rankings.filter((item) => {
    const matchSegment = selectedSegment === 'all' || item.segment === selectedSegment
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    const matchQuery = !query || `${item.brand} ${item.model}`.toLocaleLowerCase('pt-BR').includes(query)
    return matchSegment && matchQuery
  }), [rankings, selectedSegment, searchQuery])

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `10 carros novos mais emplacados no Brasil · ${periodLabel}`,
    description: 'Recorte parcial da primeira quinzena de setembro de 2026, compilado a partir das fontes indicadas na página.',
    itemListElement: filteredRankings.slice(0, 10).map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: `${item.brand} ${item.model}`,
      url: `https://www.carbi.com.br/carros-mais-vendidos-brasil/${periodSlug}/${item.slug}`,
    })),
  }

  const segments = [
    { id: 'all', label: 'Todos' },
    { id: 'hatch', label: 'Hatches' },
    { id: 'sedan', label: 'Sedans' },
    { id: 'suv', label: 'SUVs' },
    { id: 'pickup', label: 'Picapes' },
    { id: 'electric', label: 'Elétricos / híbridos' },
  ]

  return (
    <main className="cb-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <section className="cb-hero">
        <div className="cb-wrap">
          <div className="cb-hero-copy" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div className="cb-eyebrow"><Sparkles size={14} className="inline mr-1" />Emplacamentos · {periodLabel}</div>
            <h1 className="cb-hero-title">10 carros novos mais <u>emplacados</u> no Brasil</h1>
            <p className="cb-hero-lead" style={{ margin: '0 auto 24px' }}>
              Recorte parcial da primeira quinzena de setembro de 2026. Os números abaixo são emplacamentos do período, não vendas de seminovos.
            </p>
            <p className="text-sm text-gray-600">
              Fontes: contagens por modelo reportadas por <a className="underline" href={MODEL_COUNTS_SOURCE} target="_blank" rel="noreferrer">Motor1 com dados da Fenabrave</a>; total do mercado divulgado pela{' '}
              <a className="underline" href={BRIGHT_SOURCE} target="_blank" rel="noreferrer">Bright Consulting</a> (<a className="underline" href={FENABRAVE_SOURCE} target="_blank" rel="noreferrer">relatórios Fenabrave</a>).
              Método: classificação pela quantidade reportada para a primeira quinzena. A participação é calculada pela Carbi dividindo os emplacamentos do modelo por 109.536 emplacamentos de veículos leves no período e arredondando para uma casa decimal.
            </p>
            <p className="mt-2 text-xs text-gray-500">Responsabilidade editorial: Carbi · consulte as fontes vinculadas para verificar o recorte e eventuais revisões.</p>
          </div>
        </div>
      </section>

      <section className="cb-section-pad" style={{ paddingTop: 0 }}>
        <div className="cb-wrap">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8 bg-white p-4 md:p-6 rounded-2xl border border-gray-200">
            <div className="flex gap-2 flex-wrap">
              {segments.map((segment) => (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() => { setSelectedSegment(segment.id); setVisibleCount(10) }}
                  className={selectedSegment === segment.id ? 'cb-pill cb-pill-active text-xs py-2 px-4' : 'cb-pill text-xs py-2 px-4'}
                >{segment.label}</button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setVisibleCount(10) }}
                placeholder="Buscar marca ou modelo..."
                className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm outline-none"
              />
            </div>
          </div>

          <div className="cb-rankings-table-wrap">
            <div className="cb-table cb-rankings-table">
              <div className="cb-table-head cb-rankings-table-head">
                <span>Pos.</span><span>Modelo</span><span>Emplacamentos no período</span><span>Participação estimada pela Carbi</span><span />
              </div>
              <AnimatePresence mode="popLayout">
                {filteredRankings.slice(0, visibleCount).map((item, index) => (
                  <motion.div key={item.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}>
                    <Link href={`/carros-mais-vendidos-brasil/${periodSlug}/${item.slug}`} className="cb-table-row cb-rankings-table-row hover:bg-gray-50 transition-colors">
                      <div className="font-extrabold text-base text-gray-400">#{item.position}</div>
                      <div className="cb-cell-model"><div><div className="cb-model-name">{item.brand} {item.model}</div><div className="cb-model-sub">{item.category}</div></div></div>
                      <div className="text-sm font-bold">{item.unitsSold.toLocaleString('pt-BR')}</div>
                      <div className="text-sm">{getSeptemberFirstHalfShare(item.unitsSold).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</div>
                      <div className="cb-arrow"><ChevronRight size={16} /></div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          {visibleCount < filteredRankings.length && (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setVisibleCount(filteredRankings.length)} className="cb-btn cb-btn-ghost">Ver resultados</button>
            </div>
          )}
          {filteredRankings.length === 0 && <p className="py-8 text-center text-gray-600">Nenhum modelo encontrado para esse filtro.</p>}
          <div className="mt-6 text-center"><Link href="/rankings" className="cb-btn cb-btn-ghost inline-flex items-center gap-2">Ver comparativos de carros <ArrowRight size={16} /></Link></div>
        </div>
      </section>
    </main>
  )
}
