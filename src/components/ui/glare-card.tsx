'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface GlareCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function GlareCard({ children, className, style }: GlareCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.15), transparent 50%)`,
        }}
      />
    </div>
  )
}

export { GlareCard }
