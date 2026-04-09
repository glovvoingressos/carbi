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

export default function CarImage({ id, brand, model, year, src, priority = false, className, style }: CarImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const imageSrc = src || `/assets/cars/${id}.png`

  // Durante SSR e primeira hidratação, renderizamos apenas o container e o skeleton básico
  // que deve ser IDÊNTICO ao que o servidor enviou para evitar o erro de hidratação.
  if (!mounted) {
    return (
      <div 
        className={`relative overflow-hidden bg-[#eef2f5] dark:bg-neutral-900 ${className}`}
        style={{
          ...style,
          aspectRatio: '16/10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="absolute inset-0 bg-[#eef2f5] flex items-center justify-center">
            <div className="w-12 h-1.5 bg-dark/10 rounded-full animate-bounce" />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative overflow-hidden bg-[#eef2f5] dark:bg-neutral-900 ${className}`}
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
        <div className="absolute inset-0 bg-neutral-200 animate-pulse z-10" />
      )}

      {/* Main Image - Only render if no error */}
      {!error && (
        <img
          src={imageSrc}
          alt={`${brand} ${model} ${year}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true)
            setLoading(false)
          }}
          className={`w-full h-full object-contain transition-all duration-700 ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
          style={{
            transform: 'scale(1.05)',
            pointerEvents: 'none'
          }}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Premium CSS-Only Fallback */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#eef2f5] to-[#dde4e9]">
           {/* Decorative Stencil Icon */}
           <div className="relative mb-3 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/50 backdrop-blur-md border border-dark/5 rounded-full absolute animate-pulse" />
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white border-2 border-dark shadow-[4px_4px_0_#0A0A0A] rounded-xl flex items-center justify-center text-dark rotate-[2deg] z-10">
                 <span className="font-black text-xl sm:text-2xl uppercase tracking-tight">{brand?.charAt(0)}</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-1.5 z-10">
              <p className="text-[10px] sm:text-[11px] font-black text-dark uppercase tracking-[0.15em] text-center leading-tight bg-[var(--color-bento-yellow)] px-3 py-1.5 rounded rotate-[-1deg] border border-dark shadow-[2px_2px_0_#0A0A0A]">
                Preview 2026
              </p>
              <p className="text-[9px] font-bold text-dark/30 uppercase tracking-widest text-center mt-1">
                 Asset em processamento
              </p>
           </div>
           
           <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-24 bg-dark/5 blur-3xl rounded-full skew-x-12 pointer-events-none" />
        </div>
      )}

      {/* Skeleton state if loading */}
      {loading && !error && (
         <div className="absolute inset-0 bg-[#eef2f5] flex items-center justify-center">
            <div className="w-12 h-1.5 bg-dark/10 rounded-full animate-bounce" />
         </div>
      )}
    </div>
  )
}
