'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { RankingModelItem } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { ArrowRight, Search, Award, MapPin, Sparkles, Layers, ChevronRight, ChevronDown } from 'lucide-react'

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
  const [visibleCount, setVisibleCount] = useState<number>(15)

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

  const paginatedRankings = useMemo(() => {
    return filteredRankings.slice(0, visibleCount)
  }, [filteredRankings, visibleCount])

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

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Carros mais vendidos no Brasil - ${periodLabel}`,
    description: `Ranking oficial dos carros 0km e seminovos mais vendidos no Brasil em ${periodLabel}.`,
    itemListElement: filteredRankings.slice(0, 20).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${item.brand} ${item.model}`,
      url: `https://www.carbi.com.br/carros-mais-vendidos-brasil/${periodSlug}/${item.slug}`,
    })),
  }

  return (
    <div className="cb-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero Clean */}
      <section className="cb-hero">
        <div className="cb-wrap">
          <div className="cb-hero-copy" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div className="cb-eyebrow">
              <Sparkles size={14} className="inline mr-1" />
              Ranking de Mercado · {periodLabel} {stateName ? `· ${stateName}` : ''}
            </div>
            <h1 className="cb-hero-title">
              Os 100 Carros mais <u>vendidos</u> no Brasil
            </h1>
            <p className="cb-hero-lead" style={{ margin: '0 auto 32px' }}>
              Dados oficiais de emplacamentos 0km e transferências de seminovos.
              Acompanhe volume de vendas, participação e preço médio FIPE.
            </p>

            {/* Market Type Toggle */}
            <div className="inline-flex bg-white border border-gray-200 p-1.5 rounded-full gap-2 mb-10 shadow-sm">
              <button
                type="button"
                onClick={() => { setMarketType('new'); setVisibleCount(15) }}
                className={marketType === 'new' ? 'cb-btn cb-btn-lime text-sm py-3 px-6' : 'cb-btn cb-btn-ghost text-sm py-3 px-6'}
              >
                <Award size={16} />
                0km / Novos ({initialNewRankings.length})
              </button>
              <button
                type="button"
                onClick={() => { setMarketType('used'); setVisibleCount(15) }}
                className={marketType === 'used' ? 'cb-btn cb-btn-lime text-sm py-3 px-6' : 'cb-btn cb-btn-ghost text-sm py-3 px-6'}
              >
                <Layers size={16} />
                Seminovos e Usados ({initialUsedRankings.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Podium TOP 3 */}
      <section className="cb-section-pad" style={{ paddingTop: 0 }}>
        <div className="cb-wrap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {top3.map((item, idx) => {
              const isFirst = idx === 0
              return (
                <motion.div
                  key={item.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`bg-white p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    isFirst ? 'border-2 border-[var(--cb-lime)] shadow-lg' : 'border border-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-4 right-4 font-bold text-sm px-3.5 py-1.5 rounded-full ${
                      isFirst ? 'bg-[var(--cb-lime)] text-black' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    #{item.position}
                  </div>
                  <div className="cb-eyebrow mb-2">{item.brand}</div>
                  <h3 className="text-2xl font-bold font-[var(--cb-head)] mb-3">{item.model}</h3>
                  <div className="text-sm text-gray-500 mb-4">
                    <strong>{item.unitsSold.toLocaleString('pt-BR')}</strong> unidades no mês · {item.marketSharePercentage}% market share
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 block">Preço médio FIPE</span>
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
                </motion.div>
              )
            })}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8 bg-white p-4 md:p-6 rounded-2xl border border-gray-200">
            <div className="flex gap-2 flex-wrap">
              {segmentsList.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => { setSelectedSegment(seg.id); setVisibleCount(15) }}
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
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(15) }}
                placeholder="Buscar marca ou modelo..."
                className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm outline-none"
              />
            </div>
          </div>

          {/* Table Container with Controlled Width */}
          <div className="cb-rankings-table-wrap">
            <div className="cb-table cb-rankings-table">
              <div className="cb-table-head cb-rankings-table-head">
                <span>Pos.</span>
                <span>Modelo</span>
                <span>Vendas no Mês</span>
                <span>Preço Médio FIPE</span>
                <span>Market Share</span>
                <span />
              </div>

              <AnimatePresence mode="popLayout">
                {paginatedRankings.map((item, index) => (
                  <motion.div
                    key={item.slug}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <Link
                      href={`/carros-mais-vendidos-brasil/${periodSlug}/${item.slug}`}
                      className="cb-table-row cb-rankings-table-row hover:bg-gray-50 transition-colors"
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Load More Button for Better UX */}
          {visibleCount < filteredRankings.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 20, filteredRankings.length))}
                className="cb-btn cb-btn-ghost inline-flex items-center gap-2"
                style={{ padding: '14px 32px', fontSize: '15px' }}
              >
                Carregar mais veículos ({filteredRankings.length - visibleCount} restantes)
                <ChevronDown size={18} />
              </button>
            </div>
          )}

          {/* State Links */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <div className="cb-eyebrow mb-2">Filtro por Região</div>
            <h3 className="font-[var(--cb-head)] text-xl font-bold mb-5">
              Rankings por Estado
            </h3>
            <div className="flex gap-2.5 flex-wrap justify-center">
              {stateList.map((st) => {
                const isActiveState = stateName && stateName.toLowerCase() === st.name.toLowerCase()
                return (
                  <Link
                    key={st.slug}
                    href={`/carros-mais-vendidos/${st.slug}`}
                    className={`cb-pill text-xs px-4 py-2.5 transition-all ${isActiveState ? 'cb-pill-active font-bold' : ''}`}
                  >
                    <MapPin size={13} className={isActiveState ? 'text-[var(--cb-lime)]' : 'text-gray-400'} />
                    {st.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
