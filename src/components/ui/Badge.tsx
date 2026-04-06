import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'accent' | 'subtle' | 'danger'
  className?: string
}

export default function Badge({ children, variant = 'subtle', className = '' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-primary-light text-primary',
    success: 'bg-success-light text-success',
    accent: 'bg-accent-light text-amber-700',
    subtle: 'bg-gray-100 text-text-secondary',
    danger: 'bg-danger-light text-danger',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
