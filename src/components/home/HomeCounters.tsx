'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from 'motion/react'

interface PlatformStats {
  active_listings: number
  total_views: number
  new_listings_this_month: number
  new_listings_last_month?: number
}

interface CounterProps {
  value: number | null
}

function normalizeStats(data: unknown): PlatformStats | null {
  if (!data || typeof data !== 'object') return null

  const source = data as Record<string, unknown>
  const values = ['active_listings', 'total_views', 'new_listings_this_month'].map((key) => {
    const rawValue = source[key]
    const value = typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string' && rawValue.trim()
        ? Number(rawValue)
        : Number.NaN
    return Number.isFinite(value) && value >= 0 ? value : null
  })

  if (values.some((value) => value === null)) return null

  return {
    active_listings: values[0] as number,
    total_views: values[1] as number,
    new_listings_this_month: values[2] as number,
  }
}

function AnimatedValue({ value }: CounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || value == null) return
    if (value === 0) return

    const duration = 1600
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [isInView, value])

  return <span ref={ref}>{value == null ? '—' : value === 0 ? '0' : count.toLocaleString('pt-BR')}</span>
}

export default function HomeCounters({
  initialStats,
  cityCount = 0,
}: {
  initialStats?: PlatformStats | null
  cityCount?: number
}) {
  const [stats, setStats] = useState<PlatformStats | null>(initialStats || null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(initialStats ? 'ready' : 'loading')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (initialStats) return

    let cancelled = false

    fetch('/api/analytics/stats')
      .then(async (response) => {
        if (!response.ok) throw new Error('Falha ao carregar estatísticas')
        return normalizeStats(await response.json())
      })
      .then((data) => {
        if (cancelled) return
        if (!data) throw new Error('Resposta de estatísticas inválida')
        setStats(data)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStats(null)
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [initialStats, retryCount])

  const cityMetric = Number.isFinite(cityCount) && cityCount > 0 ? cityCount : null
  const currentStatus = initialStats ? 'ready' : status
  const statsAvailable = currentStatus === 'ready'

  return (
    <div className="cb-stats" aria-busy={currentStatus === 'loading'}>
      {currentStatus === 'loading' && <span className="sr-only" role="status">Carregando métricas da plataforma.</span>}
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={statsAvailable ? stats?.active_listings ?? null : null} />
        </div>
        <div className="cb-stat-label">Anúncios ativos</div>
      </div>
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={statsAvailable ? stats?.total_views ?? null : null} />
        </div>
        <div className="cb-stat-label">Visualizações acumuladas</div>
      </div>
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={cityMetric} />
        </div>
        <div className="cb-stat-label">Cidades com anúncios recentes</div>
      </div>
      <div className="cb-stat">
        <div className="cb-stat-value">
          <AnimatedValue value={statsAvailable ? stats?.new_listings_this_month ?? null : null} />
        </div>
        <div className="cb-stat-label">Novos anúncios este mês</div>
      </div>
      {currentStatus === 'error' && (
        <div className="cb-stats-status col-span-full flex flex-wrap items-center gap-3 text-sm text-[#6F6F6F]" role="alert">
          <span>Não foi possível carregar as métricas agora.</span>
          <button
            type="button"
            onClick={() => { setStatus('loading'); setRetryCount((count) => count + 1) }}
            className="font-semibold text-[#1A1A1A] underline underline-offset-4 hover:text-[#16855C]"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
