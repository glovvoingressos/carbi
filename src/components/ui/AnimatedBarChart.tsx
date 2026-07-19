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

export default function AnimatedBarChart({ data, maxValue }: AnimatedBarChartProps) {
  return (
    <div className="fingen-stats-chart">
      {data.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="fingen-stats-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="fingen-stats-bar"
            initial={{ height: 0 }}
            whileInView={{ height: `${(stat.value / maxValue) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: i === data.length - 1 ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
            }}
          />
          <div className="fingen-stats-label">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
