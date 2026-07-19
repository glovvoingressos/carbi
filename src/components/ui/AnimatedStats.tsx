'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { TrendingUp, Users, Car, MessageCircle } from 'lucide-react'

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  color: string
}

const stats: StatItem[] = [
  { icon: <Car size={20} />, value: 5247, suffix: '+', label: 'Anúncios ativos', color: '#D4F576' },
  { icon: <Users size={20} />, value: 12400, suffix: '+', label: 'Usuários ativos', color: '#93C5FD' },
  { icon: <MessageCircle size={20} />, value: 8920, suffix: '+', label: 'Conversas no chat', color: '#C9B8FF' },
  { icon: <TrendingUp size={20} />, value: 340, suffix: '%', label: 'Crescimento mensal', color: '#39E09B' },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

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
                whileInView={{ width: `${(stat.value / 12400) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated background elements */}
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
