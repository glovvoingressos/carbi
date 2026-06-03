import { ReactNode } from 'react'

export type PastelTone = 'blue' | 'lime' | 'lilac' | 'gray'

type PastelSpecCardProps = {
  tone?: PastelTone
  titleBadge?: string | null
  badgeInside?: boolean
  className?: string
  children: ReactNode
}

export function PastelSpecCard({
  tone = 'gray',
  titleBadge,
  badgeInside = false,
  className = '',
  children,
}: PastelSpecCardProps) {
  return (
    <div
      className={`relative card transition-all duration-300 hover:shadow-md ${className}`}
    >
      {titleBadge ? (
        <div
          className={`absolute left-4 z-20 badge badge-accent ${badgeInside ? 'top-4' : '-top-3'}`}
        >
          {titleBadge}
        </div>
      ) : null}
      {children}
    </div>
  )
}

type PastelRow = {
  label: string
  value: string
}

export function PastelKeyValueRows({ rows }: { rows: PastelRow[] }) {
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">{row.label}</p>
          <p className="text-xs font-semibold text-text-primary text-right">{row.value}</p>
        </div>
      ))}
    </div>
  )
}
