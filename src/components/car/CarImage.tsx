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

      {!error ? (
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
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f6f8] border-2 border-dark/5 rounded-[24px]">
           <div className="w-16 h-16 bg-white border-2 border-dark shadow-[4px_4px_0_#0A0A0A] rounded-2xl flex items-center justify-center mb-3 text-dark rotate-[2deg]">
              <span className="font-black text-2xl uppercase tracking-tight">{brand?.charAt(0)}</span>
           </div>
           <span className="text-[12px] font-bold text-dark/40 uppercase tracking-widest text-center px-4 leading-tight">
             FOTO<br/>INDISPONÍVEL
           </span>
        </div>
      )}
    </div>
  )
}
