import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { getMonthlyRankings } from '@/lib/rankings-data'
import { heroFont } from './home-font'
import { getSeptemberFirstHalfShare } from '@/data/rankings-september-2026'
import './rankings-banner.css'

const RANKING_PERIOD = 'setembro-2026'
const MONTH_LABEL = 'Setembro / 2026 · 1ª quinzena'

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
            <p className="rk-eyebrow">Top 10 mais emplacados · {MONTH_LABEL}</p>
            <h2 id="rk-title" className="rk-title">Os carros mais emplacados do Brasil</h2>
            <p className="rk-lead">
              Emplacamentos de carros 0 km. Dados parciais da primeira quinzena de setembro de 2026.
            </p>
            <dl className="rk-stats">
              <div className="rk-stat">
                <dt>Soma dos 10 modelos</dt>
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
              <Link href="/carros-mais-vendidos-brasil/setembro-2026" className="rk-tab">
              Top 10
            </Link>
            <Link href="/rankings" className="rk-tab">
              Comparativos
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
                      <span aria-label={`${getSeptemberFirstHalfShare(car.unitsSold).toFixed(1).replace('.', ',')}% de participação estimada pela Carbi`}>{getSeptemberFirstHalfShare(car.unitsSold).toFixed(1).replace('.', ',')}% est.</span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>

          <footer className="rk-foot">
            <Link href="/carros-mais-vendidos-brasil/setembro-2026" className="rk-cta">
              Ver ranking completo
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className="rk-source">Contagens: <a href="https://motor1.uol.com.br/news/808566/carros-mais-vendidos-quinzena-setembro/" target="_blank" rel="noreferrer">Motor1 / Fenabrave</a> · 109.536 emplacamentos de veículos leves: <a href="https://pt.linkedin.com/posts/bright-consulting-isd_an%C3%A1lise-de-vendas-quinzenal-setembro-2026-activity-7506035976927117314-YTPr" target="_blank" rel="noreferrer">Bright Consulting</a> · {MONTH_LABEL}. Participação estimada pela Carbi.</p>
          </footer>
        </article>
      </div>
    </section>
  )
}
