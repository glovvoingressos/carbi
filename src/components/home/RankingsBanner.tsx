import Link from 'next/link'
import { getMonthlyRankings } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { ArrowRight, Sparkles } from 'lucide-react'

export default async function RankingsBanner() {
  const [topNewList, topUsedList] = await Promise.all([
    getMonthlyRankings('julho-2026', 'new'),
    getMonthlyRankings('julho-2026', 'used'),
  ])

  const topNew = topNewList[0]
  const topUsed = topUsedList[0]

  return (
    <section className="cb-section-pad pt-0">
      <div className="cb-wrap">
        <div className="bg-[var(--cb-charcoal)] text-white rounded-3xl p-8 md:p-11 relative overflow-hidden shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="cb-eyebrow text-[var(--cb-lime)] inline-flex items-center gap-1.5 mb-3">
                <Sparkles size={14} />
                Ranking de Mercado · Julho / 2026
              </div>

              <h2 className="font-[var(--cb-head)] text-3xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-white">
                Os 100 Carros mais <span className="text-[var(--cb-lime)]">vendidos</span> do Brasil
              </h2>

              <p className="text-base text-gray-300 mb-7 leading-relaxed">
                Confira o relatório oficial de emplacamentos 0km e transferências de seminovos.
                Dados FIPE verificados, participação de mercado e ofertas disponíveis na Carbi.
              </p>

              <Link
                href="/carros-mais-vendidos-brasil"
                className="cb-btn cb-btn-lime cb-btn-arrow inline-flex"
              >
                Ver ranking completo
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="flex flex-col gap-3.5 min-w-[280px] flex-1 max-w-md">
              {topNew && (
                <Link
                  href={`/carros-mais-vendidos-brasil/julho-2026/${topNew.slug}`}
                  className="bg-white/10 border border-white/15 rounded-2xl p-4 flex items-center justify-between no-underline text-white hover:border-white/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--cb-lime)] text-black flex items-center justify-center font-extrabold text-xs">
                      #1
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Líder 0km (Novos)
                      </div>
                      <div className="text-base font-extrabold mt-0.5">
                        {topNew.brand} {topNew.model}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[var(--cb-lime)]">
                      {topNew.unitsSold.toLocaleString('pt-BR')} un
                    </div>
                    <div className="text-[11px] text-gray-300">
                      {formatBRL(topNew.startingPriceBrl)}
                    </div>
                  </div>
                </Link>
              )}

              {topUsed && (
                <Link
                  href={`/carros-mais-vendidos-brasil/julho-2026/${topUsed.slug}`}
                  className="bg-white/10 border border-white/15 rounded-2xl p-4 flex items-center justify-between no-underline text-white hover:border-white/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center font-extrabold text-xs">
                      #1
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Líder Seminovos
                      </div>
                      <div className="text-base font-extrabold mt-0.5">
                        {topUsed.brand} {topUsed.model}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">
                      {topUsed.unitsSold.toLocaleString('pt-BR')} un
                    </div>
                    <div className="text-[11px] text-gray-300">
                      FIPE {formatBRL(topUsed.fipeAvgPriceBrl || topUsed.startingPriceBrl)}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
