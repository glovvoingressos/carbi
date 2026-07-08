'use client'

import { ReactNode } from 'react'

interface ScrollRowProps {
  children: ReactNode
  className?: string
  gap?: number
}

export default function ScrollRow({ 
  children, 
  className = '',
  gap = 12 
}: ScrollRowProps) {
  return (
    <div 
      className={`scroll-row-mobile ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  )
}
