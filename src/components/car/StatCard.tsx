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
      className={`bg-white rounded-xl border p-4 text-center ${
        isWinner ? 'border-green-400 bg-green-50 shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-center text-blue-600 mb-2">{icon}</div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {isWinner && (
        <span className="inline-block text-green-600 font-semibold text-xs mt-1">Melhor</span>
      )}
    </div>
  )
}
