'use client'

import { ReactNode } from 'react'

interface CardDarkProps {
  title?: string
  value?: string | number
  subtitle?: string
  children?: ReactNode
  className?: string
}

export default function CardDark({ 
  title, 
  value, 
  subtitle, 
  children, 
  className = '' 
}: CardDarkProps) {
  return (
    <div className={`card-dark ${className}`}>
      {title && <div className="card-dark-title">{title}</div>}
      {value && <div className="card-dark-value">{value}</div>}
      {subtitle && <div className="card-dark-subtitle">{subtitle}</div>}
      {children}
    </div>
  )
}
