'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface CarImageProps {
  id: string
  brand: string
  model: string
  year: number
  src?: string
  priority?: boolean
  className?: string
  style?: React.CSSProperties
}

const FALLBACK_STUDIO = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop'

export default function CarImage({ id, brand, model, year, src, priority = false, className, style }: CarImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const imageSrc = error ? FALLBACK_STUDIO : (src || `/assets/cars/${id}.png`)

  return (
    <div 
      className={`relative overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${className}`}
      style={{
        ...style,
        aspectRatio: '16/10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Loading Shimmer */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
             style={{ backgroundSize: '200% 100%', zIndex: 1 }} />
      )}

      <img
        src={imageSrc}
        alt={`${brand} ${model} ${year}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(1.6) translateY(2%)`,
          transition: 'transform 0.3s ease',
          pointerEvents: 'none'
        }}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Subtle Studio Label for Placeholders */}
      {error && (
        <div className="absolute bottom-2 right-3 opacity-30 select-none">
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text)' }}>
            Studio Preview
          </span>
        </div>
      )}
    </div>
  )
}
