'use client'

import { ReactNode } from 'react'

type BadgeVariant = 'accent' | 'success' | 'danger' | 'warning' | 'neutral'

interface BadgePillProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export default function BadgePill({ 
  variant = 'neutral', 
  children, 
  className = '' 
}: BadgePillProps) {
  return (
    <span className={`badge-pill ${variant} ${className}`}>
      {children}
    </span>
  )
}
