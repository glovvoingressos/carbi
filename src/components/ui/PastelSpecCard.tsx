import { ReactNode } from 'react'

export type PastelTone = 'blue' | 'lime' | 'lilac' | 'gray'

const TONE_BG: Record<PastelTone, string> = {
  blue: '#bfd5ff',
  lime: '#d7ef79',
  lilac: '#ead9ff',
  gray: '#dfe7f6',
}

type PastelSpecCardProps = {
  tone?: PastelTone
  titleBadge?: string | null
  badgeInside?: boolean
  className?: string
  children: ReactNode
}

export function PastelSpecCard({
  tone = 'blue',
  titleBadge,
  badgeInside = false,
  className = '',
  children,
}: PastelSpecCardProps) {
  return (
    <div
      className={`pastel-card relative rounded-[34px] px-5 pb-6 pt-8 sm:px-6 sm:pb-7 sm:pt-9 ${className}`}
      style={{ backgroundColor: TONE_BG[tone] }}
    >
      {titleBadge ? (
        <div
          className={`absolute left-4 z-20 rounded-[18px] bg-[#e6509f] px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white sm:left-5 ${badgeInside ? 'top-3' : '-top-4'}`}
          style={{ transform: badgeInside ? 'rotate(0deg)' : 'rotate(-1.4deg)' }}
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
    <div className="space-y-3.5 sm:space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto] items-center gap-4">
          <p className="text-[14px] font-bold text-dark/95">{row.label}</p>
          <p className="text-right text-[14px] font-bold text-dark">{row.value}</p>
        </div>
      ))}
    </div>
  )
}
