'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { availableCarAssetPaths } from '@/data/carAssetManifest'
import { getCatalogCarImage, isUnsafeCarAsset } from '@/data/unsafeCarAssets'

interface CarImageProps {
  id: string
  brand: string
  model: string
  year: number
  src?: string
  priority?: boolean
  strict?: boolean
  className?: string
  style?: React.CSSProperties
  fit?: 'contain' | 'cover'
  aspectRatio?: string
}

export default function CarImage({
  id,
  brand,
  model,
  year,
  src,
  priority = false,
  strict = false,
  className,
  style,
  fit = 'contain',
  aspectRatio = '16/10',
}: CarImageProps) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [hasFinalError, setHasFinalError] = useState(false)

  useEffect(() => {
    setCandidateIndex(0)
    setHasFinalError(false)
  }, [id, src, brand, model, year])

  const slug = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const resolvedCandidates = useMemo(() => {
    const brandSlug = slug(brand)
    const modelSlug = slug(model)
    const modelBaseSlug = modelSlug
      .split('-')
      .filter(Boolean)
      .reduce<string[]>((acc, token) => {
        if (/^\d/.test(token)) return acc
        if (acc.length > 0 && ['turbo', 'cvt', 'at', 'mt', 'premium', 'plus', 'drive', 'xls', 'xlsa', 'highline', 'platinum', 'premier', 'griffe', 'diamond', 'iconic', 'like', 'touring'].includes(token)) {
          return acc
        }
        acc.push(token)
        return acc
      }, [])
      .join('-') || modelSlug

    const brandVariants = [
      brandSlug,
      brandSlug.replace('volkswagen', 'vw'),
      brandSlug.replace('caoa-chery', 'cao-chery'),
    ]

    const fallbackYears = year >= 2025 ? [2025, 2024] : [2024]

    const preferredImage = getCatalogCarImage(brand, model, src)
    const imageCandidates: Array<string | null> = strict ? [preferredImage] : [
      preferredImage,
      `/assets/cars/${id}.png`,
      ...brandVariants.flatMap((b) => [
        `/assets/cars/${b}-${modelSlug}.png`,
        `/assets/cars/${b}-${modelBaseSlug}.png`,
      ]),
      ...brandVariants.flatMap((b) => [
        `/assets/cars/${b}-${modelSlug}-${year}.png`,
        `/assets/cars/${b}-${modelBaseSlug}-${year}.png`,
        ...fallbackYears.flatMap(fy => [
          `/assets/cars/${b}-${modelSlug}-${fy}.png`,
          `/assets/cars/${b}-${modelBaseSlug}-${fy}.png`,
        ])
      ]),
    ]

    const uniqueImageCandidates = Array.from(new Set(imageCandidates.filter((path): path is string => Boolean(path))))

    return uniqueImageCandidates.filter((path) => {
      if (!path.startsWith('/assets/cars/')) return true
      return availableCarAssetPaths.has(path) && !isUnsafeCarAsset(path)
    })
  }, [brand, model, year, src, id, strict])

  const activeSrc = resolvedCandidates[candidateIndex]
  useEffect(() => {
    if (!activeSrc) setHasFinalError(true)
  }, [activeSrc])

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        aspectRatio,
      }}
    >
      {!hasFinalError && activeSrc && (
        <Image
          src={activeSrc}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 720px"
          alt={`${brand} ${model} ${year}`}
          className={`absolute inset-0 w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          style={{
            objectPosition: 'center center',
            pointerEvents: 'none'
          }}
          preload={priority}
          loading={priority ? undefined : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => {
            if (candidateIndex + 1 < resolvedCandidates.length) setCandidateIndex((index) => index + 1)
            else setHasFinalError(true)
          }}
        />
      )}

      {/* Premium Fallback UI (Se tudo falhar) */}
      {(hasFinalError || !activeSrc) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200">
           <div className="relative mb-3 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/60 backdrop-blur-md border border-white/70 rounded-full absolute animate-pulse" />
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white border border-white/70 shadow-sm rounded-xl flex items-center justify-center text-[#0A0A0A] rotate-[2deg] z-10">
                 <span className="font-black text-xl sm:text-2xl uppercase tracking-tight">{brand?.charAt(0)}</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-1.5 z-10">
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-[0.15em] text-center leading-tight bg-white/80 px-3 py-1.5 rounded-full border border-white/80">
                Imagem indisponível
              </p>
              <p className="text-[9px] font-bold text-[#8A95A8] uppercase tracking-widest text-center mt-1">
                 Fonte real não encontrada
              </p>
           </div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-24 bg-white blur-3xl rounded-full skew-x-12 pointer-events-none" />
        </div>
      )}
    </div>
  )
}
