import type { ReactNode } from 'react'

type BadgeVariant = 'dark' | 'green' | 'highlight' | 'subtle'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'subtle', className = '' }: BadgeProps) {
  const cls: Record<BadgeVariant, string> = {
    dark: 'badge-dark',
    green: 'badge-green',
    highlight: 'tag-highlight',
    subtle: 'badge-subtle',
  }

  return <span className={`${cls[variant]} ${className}`}>{children}</span>
}
