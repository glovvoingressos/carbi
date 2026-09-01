'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from 'motion/react'
import { Star } from 'lucide-react'

interface PlatformStats {
  active_listings: number
  total_views: number
  new_listings_this_month: number
  new_listings_last_month: number
}

interface CounterProps {
  value: number
  suffix?: string
  compact?: boolean
}

function AnimatedValue({ value, suffix = '', compact }: CounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || value === 0) return
    const duration = 1600
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(value * eased))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, value])

  const display = compact && count >= 1000
    ? `${(count / 1000).toFixed(1).replace('.0', '')}k`
    : count.toLocaleString('pt-BR')

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

export default function HomeCounters({
  initialStats,
  cityCount = 0,
}: {
  initialStats?: PlatformStats | null
  cityCount?: number
}) {
  const [stats, setStats] = useState<PlatformStats | null>(initialStats || null)

  useEffect(() => {
    if (stats) return
    fetch('/api/analytics/stats')
      .then((r) => r.json())
      .then((data: PlatformStats) => setStats(data))
      .catch(() => {})
  }, [stats])

  return (
    <div className="cb-stats">
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={stats?.active_listings || 0} suffix="+" compact />
        </div>
        <div className="cb-stat-label">Anúncios ativos</div>
      </div>
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={Math.max(stats?.total_views || 0, 30000)} suffix="+" compact />
        </div>
        <div className="cb-stat-label">Visualizações mensais</div>
      </div>
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={cityCount} suffix="+" />
        </div>
        <div className="cb-stat-label">Cidades atendidas</div>
      </div>
      <div className="cb-stat cb-stat-rating">
        <div className="cb-stat-value cb-stat-value-rating">
          <span>4.9</span>
          <Star size={14} fill="currentColor" />
        </div>
        <div className="cb-stat-label">Avaliação média</div>
      </div>
    </div>
  )
}
