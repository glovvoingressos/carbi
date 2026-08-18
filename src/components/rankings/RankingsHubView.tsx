'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RankingModelItem } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { ArrowRight, Search, Award, MapPin, Sparkles, Layers, ChevronRight } from 'lucide-react'

interface Props {
  initialNewRankings: RankingModelItem[]
  initialUsedRankings: RankingModelItem[]
  periodLabel?: string
  periodSlug?: string
  stateName?: string
}

export default function RankingsHubView({
  initialNewRankings,
  initialUsedRankings,
  periodLabel = 'Julho / 2026',
  periodSlug = 'julho-2026',
  stateName,
}: Props) {
  const [marketType, setMarketType] = useState<'new' | 'used'>('new')
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const activeRankings = marketType === 'new' ? initialNewRankings : initialUsedRankings

  const filteredRankings = useMemo(() => {
    return activeRankings.filter((item) => {
      const matchSegment = selectedSegment === 'all' || item.segment === selectedSegment
      const matchQuery =
        !searchQuery ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.versionName && item.versionName.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchSegment && matchQuery
    })
  }, [activeRankings, selectedSegment, searchQuery])

  const top3 = activeRankings.slice(0, 3)

  const stateList = [
    { name: 'São Paulo', slug: 'sao-paulo' },
    { name: 'Rio de Janeiro', slug: 'rio-de-janeiro' },
    { name: 'Minas Gerais', slug: 'minas-gerais' },
    { name: 'Paraná', slug: 'parana' },
    { name: 'Rio Grande do Sul', slug: 'rio-grande-do-sul' },
    { name: 'Bahia', slug: 'bahia' },
    { name: 'Santa Catarina', slug: 'santa-catarina' },
    { name: 'Goiás', slug: 'goias' },
  ]

  const segmentsList = [
    { id: 'all', label: 'Todos os segmentos' },
    { id: 'hatch', label: 'Hatches' },
    { id: 'sedan', label: 'Sedans' },
    { id: 'suv', label: 'SUVs' },
    { id: 'pickup', label: 'Picapes' },
    { id: 'electric', label: 'Elétricos / Híbridos' },
  ]

  const subtitleText = stateName ? `Ranking ${periodLabel} · ${stateName}` : `Ranking ${periodLabel}`

  return (
    <div className="cb-page">
      <section className="cb-hero">
        <div className="cb-wrap">
          <div className="cb-hero-copy max-w-3xl mx-auto text-center">
            <div className="cb-eyebrow">
              <Sparkles size={14} className="inline mr-1" />
              {subtitleText}
            </div>
            <h1 className="cb-hero-title">
              Os 100 Carros mais vendidos no Brasil
            </h1>
            <p className="cb-hero-lead mb-8 mx-auto">
              Dados completos de emplacamentos 0km e seminovos mais comercializados.
              Preço médio FIPE, participação de mercado e ofertas disponíveis.
            </p>

            <div className="inline-flex bg-white border border-gray-200 p-1.5 rounded-full gap-2 mb-10 shadow-sm">
              <button
                type="button"
                onClick={() => setMarketType('new')}
                className={marketType === 'new' ? 'cb-btn cb-btn-lime text-sm py-3 px-6' : 'cb-btn cb-btn-ghost text-sm py-3 px-6'}
              >
                <Award size={16} />
                0km / Novos ({initialNewRankings.length})
              </button>
              <button
                type="button"
                onClick={() => setMarketType('used')}
                className={marketType === 'used' ? 'cb-btn cb-btn-lime text-sm py-3 px-6' : 'cb-btn cb-btn-ghost text-sm py-3 px-6'}
              >
                <Layers size={16} />
                Seminovos e Usados ({initialUsedRankings.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="cb-section-pad pt-0">
        <div className="cb-wrap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {top3.map((item, idx) => {
              const isFirst = idx === 0
              return (
                <div
                  key={item.slug}
                  className={`bg-white p-6 rounded-3xl relative overflow-hidden ${isFirst ? 'border-2 border-[var(--cb-lime)] shadow-lg' : 'border border-gray-200'}`}
                >
                  <div className={`absolute top-4 right-4 font-bold text-sm px-3.5 py-1.5 rounded-full ${isFirst ? 'bg-[var(--cb-lime)] text-black' : 'bg-gray-100 text-gray-700'}`}>
                    #{item.position}
                  </div>
                  <div className="cb-eyebrow mb-2">
                    {item.brand}
                  </div>
                  <h3 className="text-2xl font-bold font-[var(--cb-head)] mb-3">
                    {item.model}
                  </h3>
                  <div className="text-sm text-gray-500 mb-4">
                    <strong>{item.unitsSold.toLocaleString('pt-BR')}</strong> unidades no mês - {item.marketSharePercentage}% market share
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 block">
                        Preço médio FIPE
                      </span>
                      <strong className="text-lg font-bold">
                        {formatBRL(item.fipeAvgPriceBrl || item.startingPriceBrl)}
                      </strong>
                    </div>
                    <Link
                      href={`/carros-mais-vendidos-brasil/${periodSlug}/${item.slug}`}
                      className="cb-arrow"
                      aria-label={`Ver detalhes do ${item.model}`}
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4 justify-between items-center mb-8 bg-white p-4 md:p-6 rounded-2xl border border-gray-200">
            <div className="flex gap-2 flex-wrap">
              {segmentsList.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setSelectedSegment(seg.id)}
                  className={selectedSegment === seg.id ? 'cb-pill cb-pill-active text-xs py-2 px-4' : 'cb-pill text-xs py-2 px-4'}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar marca ou modelo..."
                className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm outline-none"
              />
            </div>
          </div>

          <div className="cb-table">
            <div className="cb-table-head">
              <span>Pos.</span>
              <span>Modelo</span>
              <span>Vendas no Mês</span>
              <span>Preço Médio FIPE</span>
              <span>Market Share</span>
              <span />
            </div>

            {filteredRankings.map((item) => (
              <Link
                key={item.slug}
                href={`/carros-mais-vendidos-brasil/${periodSlug}/${item.slug}`}
                className="cb-table-row"
              >
                <div className="font-extrabold text-base text-gray-400">
                  #{item.position}
                </div>
                <div className="cb-cell-model">
                  <div>
                    <div className="cb-model-name">
                      {item.brand} {item.model}
                    </div>
                    <div className="cb-model-sub">{item.category}</div>
                  </div>
                </div>
                <div className="text-sm font-bold">
                  {item.unitsSold.toLocaleString('pt-BR')} un
                </div>
                <div className="text-base font-extrabold">
                  {formatBRL(item.fipeAvgPriceBrl || item.startingPriceBrl)}
                </div>
                <div>
                  <span className="cb-tag cb-tag-lime">{item.marketSharePercentage}%</span>
                </div>
                <div className="cb-arrow">
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="font-[var(--cb-head)] text-xl font-bold mb-4">
              Rankings por Estado
            </h3>
            <div className="flex gap-3 flex-wrap justify-center">
              {stateList.map((st) => (
                <Link
                  key={st.slug}
                  href={`/carros-mais-vendidos/${st.slug}`}
                  className="cb-pill text-xs"
                >
                  <MapPin size={14} />
                  {st.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
