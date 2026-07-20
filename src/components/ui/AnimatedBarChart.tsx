'use client'

import { motion } from 'motion/react'

interface BarData {
  label: string
  value: number
}

interface AnimatedBarChartProps {
  data: BarData[]
  maxValue: number
}

const barColors = [
  'rgba(212, 245, 118, 0.3)',
  'rgba(212, 245, 118, 0.45)',
  'rgba(212, 245, 118, 0.6)',
  'rgba(212, 245, 118, 0.75)',
  'rgba(212, 245, 118, 0.9)',
  '#D4F576',
]

export default function AnimatedBarChart({ data, maxValue }: AnimatedBarChartProps) {
  return (
    <div className="stats-chart">
      {data.map((stat, i) => {
        const heightPct = maxValue > 0 ? (stat.value / maxValue) * 100 : 0
        return (
          <motion.div
            key={stat.label}
            className="stats-col"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="stats-value">{stat.value.toLocaleString('pt-BR')}</div>
            <div className="stats-bar-track">
              <motion.div
                className="stats-bar"
                initial={{ height: 0 }}
                whileInView={{ height: `${heightPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: barColors[i] || barColors[barColors.length - 1] }}
              />
            </div>
            <div className="stats-label">{stat.label}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
