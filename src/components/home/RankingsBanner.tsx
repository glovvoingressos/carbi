import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { getMonthlyRankings } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { heroFont } from './home-font'
import './rankings-banner.css'

const RANKING_PERIOD = 'setembro-2026'
const MONTH_LABEL = 'Setembro / 2026 · 1ª quinzena'
const SOURCE_LABEL = 'Fenabrave / Bright Consulting'

function trendInfo(moved: number) {
  if (moved > 0) {
    return { tone: 'up', label: `Subiu ${moved} ${moved === 1 ? 'posição' : 'posições'}`, text: `+${moved}`, Icon: ChevronUp }
  }
  if (moved < 0) {
    const abs = Math.abs(moved)
    return { tone: 'down', label: `Caiu ${abs} ${abs === 1 ? 'posição' : 'posições'}`, text: `${moved}`, Icon: ChevronDown }
  }
  return { tone: 'flat', label: 'Manteve a posição', text: '0', Icon: Minus }
}

export default async function RankingsBanner() {
  const topNew = await getMonthlyRankings(RANKING_PERIOD, 'new')
  const top10 = topNew.slice(0, 10)
  const totalUnits = top10.reduce((sum, car) => sum + car.unitsSold, 0)

  return (
    <section className={`rk ${heroFont.variable}`} aria-labelledby="rk-title">
      <div className="rk-wrap">
        <article className="rk-card">
          <div className="rk-media">
            <Image
              src="/assets/cars/fiat-strada-ultra-10-turbo-cvt-2026.png"
              alt="Fiat Strada, destaque do ranking de setembro de 2026"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 90vw, 960px"
            />
          </div>

          <header className="rk-head">
            <p className="rk-eyebrow">Top 10 mais vendidos · {MONTH_LABEL}</p>
            <h2 id="rk-title" className="rk-title">Os carros mais vendidos do Brasil</h2>
            <p className="rk-lead">
              Emplacamentos de carros 0 km. Dados parciais da primeira quinzena de setembro de 2026.
            </p>
            <dl className="rk-stats">
              <div className="rk-stat">
                <dt>Unidades vendidas</dt>
                <dd>{totalUnits.toLocaleString('pt-BR')}</dd>
              </div>
              <div className="rk-stat">
                <dt>Modelos no ranking</dt>
                <dd>{top10.length}</dd>
              </div>
            </dl>
          </header>

          <nav className="rk-tabs" aria-label="Outros rankings">
            <a href="#ranking-mais-vendidos" className="rk-tab" aria-current="page">
              Mais vendidos
            </a>
            <Link href="/carros-mais-vendidos-brasil" className="rk-tab">
              Top 100
            </Link>
            <Link href="/rankings" className="rk-tab">
              Por estado
            </Link>
          </nav>

          <ol id="ranking-mais-vendidos" className="rk-list">
            {top10.map((car) => {
              const moved = car.previousPosition != null ? car.previousPosition - car.position : 0
              const trend = trendInfo(moved)
              const TrendIcon = trend.Icon
              return (
                <li key={car.slug} className="rk-row">
                  <span className="rk-pos">
                    <span className="sr-only">Posição </span>
                    {car.position}
                  </span>

                  <div className="rk-main">
                    <div className="rk-line">
                      <p className="rk-name">
                        <span className="rk-brand">{car.brand}</span> {car.model}
                      </p>
                      {moved !== 0 ? (
                        <p className={`rk-trend rk-trend-${trend.tone}`}>
                          <span className="sr-only">{trend.label}</span>
                          <TrendIcon size={13} aria-hidden="true" />
                          <span aria-hidden="true">{trend.text}</span>
                        </p>
                      ) : null}
                    </div>
                    <p className="rk-cat">{car.category}</p>
                    <p className="rk-meta">
                      <span><strong>{car.unitsSold.toLocaleString('pt-BR')}</strong> un.</span>
                      <span>{car.marketSharePercentage.toFixed(1).replace('.', ',')}%</span>
                      <span>desde {formatBRL(car.startingPriceBrl)}</span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>

          <footer className="rk-foot">
            <Link href="/carros-mais-vendidos-brasil" className="rk-cta">
              Ver ranking completo
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className="rk-source">Fonte: {SOURCE_LABEL} · {MONTH_LABEL}.</p>
          </footer>
        </article>
      </div>
    </section>
  )
}
