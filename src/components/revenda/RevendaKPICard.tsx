'use client'

import { motion } from 'motion/react'
import { LucideIcon } from 'lucide-react'

interface RevendaKPICardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  delay?: number
}

export default function RevendaKPICard({ label, value, icon: Icon, trend, delay = 0 }: RevendaKPICardProps) {
  return (
    <motion.div
      className="revenda-kpi-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="revenda-kpi-icon">
        <Icon size={20} />
      </div>
      <div className="revenda-kpi-value">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</div>
      <div className="revenda-kpi-label">{label}</div>
      {trend && (
        <div className={`revenda-kpi-trend ${trend.positive ? 'positive' : 'negative'}`}>
          {trend.positive ? '+' : ''}{trend.value}%
        </div>
      )}
    </motion.div>
  )
}
