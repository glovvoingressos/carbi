import Link from 'next/link'
import Image from 'next/image'
import { getMonthlyRankings } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { ArrowRight, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react'

type Tab = 'novos' | 'seminovos'

function avatarColor(position: number): string {
  const palette = [
    'rgba(76, 139, 245, 0.18)',
    'rgba(125, 111, 245, 0.18)',
    'rgba(69, 168, 232, 0.18)',
    'rgba(83, 181, 163, 0.18)',
    'rgba(217, 112, 171, 0.18)',
    'rgba(103, 145, 228, 0.18)',
    'rgba(221, 151, 83, 0.18)',
    'rgba(148, 163, 184, 0.22)',
    'rgba(146, 126, 232, 0.18)',
    'rgba(218, 119, 135, 0.18)',
  ]
  return palette[(position - 1) % palette.length]
}

function avatarInkColor(position: number): string {
  const palette = ['#225CB7', '#4C3DB7', '#1F6B98', '#176B5A', '#963F78', '#315EAA', '#915A22', '#465466', '#5B4BA9', '#963D4B']
  return palette[(position - 1) % palette.length]
}

export default async function RankingsBanner() {
  const topNew = await getMonthlyRankings('setembro-2026', 'new')

  const top10 = topNew.slice(0, 10)
  const totalUnits = top10.reduce((sum, c) => sum + c.unitsSold, 0)
  const monthLabel = 'Setembro / 2026 · 1ª quinzena'

  return (
    <section className="cb-section-pad pt-0">
      <div className="cb-wrap">
        <div className="cb-top10-card">
          <div className="cb-top10-head">
            <div>
              <div className="cb-top10-feature-media">
                <Image
                  src="/assets/cars/fiat-strada-ultra-10-turbo-cvt-2026.png"
                  alt="Fiat Strada 2027"
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  priority
                />
              </div>
              <p className="cb-top10-eyebrow">Top 10 mais vendidos · {monthLabel}</p>
              <h2 className="cb-top10-title">
                Os carros mais vendidos do Brasil
              </h2>
              <p className="cb-top10-lead">
                Ranking oficial de emplacamentos 0km. Dados parciais de setembro, com base na Fenabrave.
              </p>
            </div>

            <div className="cb-top10-meta">
              <div className="cb-top10-meta-stat">
                <strong>{totalUnits.toLocaleString('pt-BR')}</strong>
                <span>unidades vendidas</span>
              </div>
              <div className="cb-top10-meta-stat">
                <strong>{top10.length}</strong>
                <span>modelos no ranking</span>
              </div>
            </div>
          </div>

          <div className="cb-top10-tabs" role="tablist" aria-label="Tipo de mercado">
            <button className="cb-top10-tab is-active" type="button" role="tab" aria-selected="true">
              Mais vendidos
              <span className="cb-top10-tab-bar" aria-hidden="true" />
            </button>
            <Link href="/carros-mais-vendidos-brasil" className="cb-top10-tab" role="tab">
              Ver top 100
            </Link>
            <Link href="/rankings" className="cb-top10-tab" role="tab">
              Por estado
            </Link>
          </div>

          <ol className="cb-top10-list">
            {top10.map((car) => {
              const moved = car.previousPosition != null ? car.previousPosition - car.position : 0
              return (
                <li key={car.slug} className="cb-top10-row">
                  <span
                    className="cb-top10-avatar"
                    aria-hidden="true"
                    style={{
                      background: avatarColor(car.position),
                      color: avatarInkColor(car.position),
                    }}
                  >
                    #{car.position}
                  </span>
                  <div className="cb-top10-row-body">
                    <div className="cb-top10-row-top">
                      <strong className="cb-top10-row-name">
                        {car.brand} {car.model}
                      </strong>
                      <span className="cb-top10-row-cat">{car.category}</span>
                    </div>
                    <div className="cb-top10-row-meta">
                      <span className="cb-top10-row-units">
                        <strong>{car.unitsSold.toLocaleString('pt-BR')}</strong> un
                      </span>
                      <span className="cb-top10-row-dot" aria-hidden="true" />
                      <span className="cb-top10-row-share">{car.marketSharePercentage.toFixed(1)}% share</span>
                      <span className="cb-top10-row-dot" aria-hidden="true" />
                      <span className="cb-top10-row-price">a partir de {formatBRL(car.startingPriceBrl)}</span>
                    </div>
                  </div>
                  <div className={`cb-top10-trend ${moved > 0 ? 'is-up' : moved < 0 ? 'is-down' : 'is-flat'}`} aria-label={
                    moved > 0 ? `Subiu ${moved} posições` : moved < 0 ? `Caiu ${Math.abs(moved)} posições` : 'Manteve posição'
                  }>
                    {moved > 0 ? <ChevronUp size={14} /> : moved < 0 ? <ChevronDown size={14} /> : <span aria-hidden="true">—</span>}
                    <span>{moved > 0 ? `+${moved}` : moved < 0 ? moved : '0'}</span>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="cb-top10-foot">
            <Link href="/carros-mais-vendidos-brasil" className="cb-btn cb-btn-lime cb-btn-arrow">
              Ver ranking completo
              <ArrowRight size={18} />
            </Link>
            <span className="cb-top10-foot-note">
              <TrendingUp size={14} /> 1ª quinzena de setembro · Fenabrave / Bright Consulting.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
