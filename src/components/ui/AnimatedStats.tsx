'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { TrendingUp, Users, Car, Eye } from 'lucide-react'

interface PlatformStats {
  active_listings: number
  total_views: number
  new_listings_this_month: number
  new_listings_last_month: number
}

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  color: string
}

const fallbackStats: StatItem[] = [
  { icon: <Car size={20} />, value: 0, suffix: '+', label: 'Anúncios ativos', color: '#D4F576' },
  { icon: <Eye size={20} />, value: 0, suffix: '+', label: 'Visualizações totais', color: '#93C5FD' },
  { icon: <TrendingUp size={20} />, value: 0, suffix: '+', label: 'Novos este mês', color: '#C9B8FF' },
  { icon: <Users size={20} />, value: 0, suffix: '%', label: 'Crescimento mensal', color: '#39E09B' },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || value === 0) return

    let start = 0
    const duration = 2000
    const increment = value / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isInView, value])

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}k` : count.toString()

  return (
    <span ref={ref} className="animated-stat-value">
      {formatted}{suffix}
    </span>
  )
}

export default function AnimatedStats() {
  const [stats, setStats] = useState<StatItem[]>(fallbackStats)

  useEffect(() => {
    fetch('/api/analytics/stats')
      .then((r) => r.json())
      .then((data: PlatformStats) => {
        const growth = data.new_listings_last_month > 0
          ? Math.round(((data.new_listings_this_month - data.new_listings_last_month) / data.new_listings_last_month) * 100)
          : 0

        setStats([
          { icon: <Car size={20} />, value: data.active_listings, suffix: '+', label: 'Anúncios ativos', color: '#D4F576' },
          { icon: <Eye size={20} />, value: data.total_views, suffix: '+', label: 'Visualizações totais', color: '#93C5FD' },
          { icon: <TrendingUp size={20} />, value: data.new_listings_this_month, suffix: '+', label: 'Novos este mês', color: '#C9B8FF' },
          { icon: <Users size={20} />, value: Math.max(0, growth), suffix: '%', label: 'Crescimento mensal', color: '#39E09B' },
        ])
      })
      .catch(() => {})
  }, [])

  const maxVal = Math.max(...stats.map((s) => s.value), 1)

  return (
    <section className="animated-stats">
      <div className="animated-stats-header">
        <h2 className="animated-stats-title">Números que comprovam</h2>
        <p className="animated-stats-sub">Dados reais da plataforma em tempo real</p>
      </div>

      <div className="animated-stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="animated-stat-card"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { duration: 0.3 },
            }}
          >
            <div className="animated-stat-icon" style={{ color: stat.color, background: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            <div className="animated-stat-label">{stat.label}</div>
            <div className="animated-stat-bar">
              <motion.div
                className="animated-stat-bar-fill"
                style={{ background: stat.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(stat.value / maxVal) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="animated-stats-bg">
        <motion.div
          className="animated-stats-bg-circle"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="animated-stats-bg-circle animated-stats-bg-circle-2"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </section>
  )
}
