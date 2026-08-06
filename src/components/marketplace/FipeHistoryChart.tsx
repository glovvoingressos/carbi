'use client'

import { useEffect, useState } from 'react'
import { getFipeMonthlyHistory } from '@/lib/fipe-api'
import { Loader2 } from 'lucide-react'

interface Props {
  brand: string
  model: string
  version?: string | null
  year: number
}

interface DataPoint {
  month: string
  price: string
  priceNum: number
}

export default function FipeHistoryChart({ brand, model, version, year }: Props) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await getFipeMonthlyHistory(brand, model, year, version || undefined)
        if (!cancelled) setData(result)
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [brand, model, version, year])

  if (loading) {
    return (
      <section className="fingen-detail-card-dark">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
        </div>
      </section>
    )
  }

  if (data.length < 2) return null

  const maxPrice = Math.max(...data.map(d => d.priceNum))
  const minPrice = Math.min(...data.map(d => d.priceNum))
  const range = maxPrice - minPrice || 1

  const barMaxWidth = 80

  return (
    <section className="fingen-detail-card-dark">
      <div className="fingen-detail-dark-header">
        <h3>Histórico FIPE</h3>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>últimos {data.length} meses</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {data.map((d, i) => {
          const pct = ((d.priceNum - minPrice) / range) * 100
          const barPct = 30 + (pct / 100) * 50 // between 30% and 80% of barMaxWidth
          const isLatest = i === data.length - 1
          const barColor = barPct >= 70 ? '#D4F576' : barPct >= 50 ? '#16855C' : '#146B4A'

          return (
            <div key={d.month} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 80,
                flexShrink: 0,
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'right',
              }}>
                {d.month}
              </span>
              <div style={{
                flex: 1,
                height: 28,
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
                    background: `linear-gradient(90deg, ${barColor}, ${isLatest ? '#D4F576' : barColor})`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 10,
                    opacity: isLatest ? 1 : 0.8,
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
      </div>

      <style>{`
        .fipe-chart-bar {
          animation: fipeBarGrow 0.8s ease-out both;
        }
        @keyframes fipeBarGrow {
          from { width: 0 !important; }
        }
      `}</style>
    </section>
  )
}