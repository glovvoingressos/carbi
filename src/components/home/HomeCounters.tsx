'use client'

import { useEffect, useState } from 'react'

interface PlatformStats {
  active_listings: number
  total_views: number
  new_listings_this_month: number
  new_listings_last_month: number
}

function formatCompact(value: number) {
  return value >= 1000
    ? `${(value / 1000).toFixed(1).replace('.0', '')}k`
    : value.toLocaleString('pt-BR')
}

export default function HomeCounters({
  initialStats,
}: {
  initialStats?: PlatformStats | null
}) {
  const [stats, setStats] = useState<PlatformStats | null>(initialStats || null)

  useEffect(() => {
    if (stats) return
    fetch('/api/analytics/stats')
      .then((r) => r.json())
      .then((data: PlatformStats) => setStats(data))
      .catch(() => {})
  }, [stats])

  const metrics = [
    { label: 'Visualizações totais', value: stats?.total_views },
  ].filter((metric): metric is { label: string; value: number } =>
    typeof metric.value === 'number' && Number.isFinite(metric.value) && metric.value > 0,
  )

  if (metrics.length === 0) return null

  return (
    <div className="cb-stats">
      {metrics.map(({ label, value }) => (
        <div className="cb-stat" key={label}>
          <div className="cb-stat-value">{formatCompact(value)}</div>
          <div className="cb-stat-label">{label}</div>
        </div>
      ))}
    </div>
  )
}
