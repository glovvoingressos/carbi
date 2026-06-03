import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
  sub?: string
  isWinner?: boolean
}

export default function StatCard({ icon, label, value, sub, isWinner }: StatCardProps) {
  return (
    <div
      className={`card p-4 text-center ${
        isWinner ? 'border-success/30 bg-success/5 shadow-sm' : 'border-border'
      }`}
    >
      <div className="flex justify-center text-accent mb-2">{icon}</div>
      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
      {isWinner && (
        <span className="inline-block text-success font-semibold text-xs mt-1">Melhor</span>
      )}
    </div>
  )
}
