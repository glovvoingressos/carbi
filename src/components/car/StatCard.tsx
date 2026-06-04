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
    <div className={`bg-white border rounded-2xl p-5 text-center ${
      isWinner ? 'border-[#10B981] bg-[#ECFDF5]' : 'border-[#EAEAE8]'
    }`}>
      <div className={`flex justify-center mb-3 ${isWinner ? 'text-[#10B981]' : 'text-[#0A0A0A]'}`}>{icon}</div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[18px] font-semibold text-[#0A0A0A] tracking-tight">{value}</p>
      {sub && <p className="text-[12px] text-[#A3A3A3] mt-1">{sub}</p>}
      {isWinner && (
        <span className="inline-block text-[#10B981] font-medium text-[11px] mt-1.5 tracking-tight">Melhor</span>
      )}
    </div>
  )
}
