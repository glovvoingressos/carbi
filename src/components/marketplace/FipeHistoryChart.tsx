'use client'

import { useEffect, useState } from 'react'
import { getFipeMonthlyHistory } from '@/lib/fipe-api'
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { formatBRL } from '@/data/cars'

interface Props {
  brand: string
  model: string
  version?: string | null
  year: number
  currentFipePrice: number
}

interface DataPoint {
  month: string
  price: string
  priceNum: number
}

export default function FipeHistoryChart({ brand, model, version, year, currentFipePrice }: Props) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await getFipeMonthlyHistory(brand, model, year, version || undefined)
        if (!cancelled) {
          setData(result)
          if (result.length === 0) setError(true)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [brand, model, version, year])

  if (loading) {
    return (
      <section className="fingen-detail-card-dark">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
        </div>
      </section>
    )
  }

  const maxPrice = Math.max(...data.map(d => d.priceNum), currentFipePrice)
  const minPrice = Math.min(...data.map(d => d.priceNum), currentFipePrice)
  const range = maxPrice - minPrice || 1

  return (
    <section className="fingen-detail-card-dark">
      <div className="fingen-detail-dark-header">
        <h3 style={{ color: '#FFFFFF' }}>Histórico FIPE</h3>
        {data.length > 0 ? (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>últimos {data.length} meses</span>
        ) : null}
      </div>

      {data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {data.map((d, i) => {
            const isLatest = i === data.length - 1
            const pct = ((d.priceNum - minPrice) / range) * 100
            const barPct = 20 + (pct / 100) * 60
            const barColor = barPct >= 70 ? '#D4F576' : barPct >= 50 ? '#16855C' : '#146B4A'

            return (
              <div key={d.month} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 82,
                  flexShrink: 0,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'right',
                }}>
                  {d.month}
                </span>
                <div style={{
                  flex: 1,
                  height: 30,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div
                    className="fipe-chart-bar"
                    style={{
                      height: '100%',
                      width: `${barPct + 20}%`,
                      background: `linear-gradient(90deg, ${isLatest ? '#D4F576' : barColor}, ${isLatest ? '#E8FF7A' : barColor})`,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 10,
                      opacity: isLatest ? 1 : 0.85,
                    }}
                  >
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isLatest ? '#1A1A1A' : '#fff',
                    }}>
                      {d.price}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
          }}>
            <TrendingDown size={14} />
            Variação de {formatBRL(minPrice)} a {formatBRL(maxPrice)} nos últimos {data.length} meses
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '20px 0',
          fontSize: 13,
          color: 'rgba(255,255,255,0.4)',
        }}>
          Histórico FIPE indisponível para este veículo
        </div>
      )}

      <style>{`
        .fipe-chart-bar {
          animation: fipeBarGrow 0.7s ease-out both;
        }
        @keyframes fipeBarGrow {
          from { width: 0 !important; }
        }
      `}</style>
    </section>
  )
}