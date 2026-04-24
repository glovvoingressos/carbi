import { ReactNode } from 'react'

export type PastelTone = 'blue' | 'lime' | 'lilac' | 'gray'

// All tones map to the same clean neutral — intentionally minimal
const TONE_BG: Record<PastelTone, string> = {
  blue:  '#f5f5f3',
  lime:  '#f5f5f3',
  lilac: '#f5f5f3',
  gray:  '#f5f5f3',
}

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
      className={`relative rounded-[20px] px-5 pb-6 pt-8 sm:px-6 sm:pb-7 sm:pt-9 border border-black/6 ${className}`}
      style={{ backgroundColor: TONE_BG[tone] }}
    >
      {titleBadge ? (
        <div
          className={`absolute left-4 z-20 rounded-full bg-dark px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white sm:left-5 ${badgeInside ? 'top-3' : '-top-3.5'}`}
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
    <div className="space-y-3 sm:space-y-3.5">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto] items-center gap-4">
          <p className="text-[13px] font-medium text-dark/50">{row.label}</p>
          <p className="text-right text-[13px] font-semibold text-dark">{row.value}</p>
        </div>
      ))}
    </div>
  )
}
