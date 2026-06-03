import type { ReactNode } from 'react'

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'gold'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: 'badge-neutral',
  accent: 'badge-accent',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  gold: 'badge-gold',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return <span className={`badge ${VARIANT_CLASS[variant]} ${className}`}>{children}</span>
}
