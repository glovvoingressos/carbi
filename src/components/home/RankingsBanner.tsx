import Link from 'next/link'
import { getMonthlyRankings } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { ArrowRight, Sparkles, Trophy, TrendingUp, ShieldCheck } from 'lucide-react'

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
        <div className="cb-rankings-card-clean">
          <div className="cb-rankings-card-clean-grid">
            <div className="cb-rankings-card-clean-copy">
              <div className="cb-rankings-badge-clean">
                <Sparkles size={14} />
                <span>Ranking de Mercado · Julho / 2026</span>
              </div>

              <h2 className="cb-rankings-title-clean">
                Os 100 Carros mais <span className="cb-rankings-highlight-clean">vendidos</span> do Brasil
              </h2>

              <p className="cb-rankings-lead-clean">
                Relatório oficial de emplacamentos 0km e transferências de seminovos.
                Dados FIPE verificados, participação de mercado e ofertas disponíveis.
              </p>

              <div className="cb-rankings-meta-pills-clean">
                <span className="cb-rankings-meta-pill-clean"><Trophy size={13} /> Dados Oficiais</span>
                <span className="cb-rankings-meta-pill-clean"><TrendingUp size={13} /> Atualizado este mês</span>
                <span className="cb-rankings-meta-pill-clean"><ShieldCheck size={13} /> FIPE Auditada</span>
              </div>

              <div className="cb-rankings-action-clean">
                <Link
                  href="/carros-mais-vendidos-brasil"
                  className="cb-btn cb-btn-lime cb-btn-arrow"
                >
                  Ver ranking completo
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="cb-rankings-card-clean-preview">
              {topNew && (
                <Link
                  href={`/carros-mais-vendidos-brasil/julho-2026/${topNew.slug}`}
                  className="cb-rankings-leader-clean-card is-new"
                >
                  <div className="cb-rankings-leader-left">
                    <div className="cb-rankings-rank-badge-clean">#1</div>
                    <div>
                      <span className="cb-rankings-leader-kicker-clean">Líder 0km (Novos)</span>
                      <strong className="cb-rankings-leader-name-clean">{topNew.brand} {topNew.model}</strong>
                    </div>
                  </div>
                  <div className="cb-rankings-leader-right">
                    <strong className="cb-rankings-leader-units-clean">{topNew.unitsSold.toLocaleString('pt-BR')} un</strong>
                    <span className="cb-rankings-leader-price-clean">{formatBRL(topNew.startingPriceBrl)}</span>
                  </div>
                </Link>
              )}

              {topUsed && (
                <Link
                  href={`/carros-mais-vendidos-brasil/julho-2026/${topUsed.slug}`}
                  className="cb-rankings-leader-clean-card is-used"
                >
                  <div className="cb-rankings-leader-left">
                    <div className="cb-rankings-rank-badge-clean">#1</div>
                    <div>
                      <span className="cb-rankings-leader-kicker-clean">Líder Seminovos</span>
                      <strong className="cb-rankings-leader-name-clean">{topUsed.brand} {topUsed.model}</strong>
                    </div>
                  </div>
                  <div className="cb-rankings-leader-right">
                    <strong className="cb-rankings-leader-units-clean">{topUsed.unitsSold.toLocaleString('pt-BR')} un</strong>
                    <span className="cb-rankings-leader-price-clean">FIPE {formatBRL(topUsed.fipeAvgPriceBrl || topUsed.startingPriceBrl)}</span>
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
