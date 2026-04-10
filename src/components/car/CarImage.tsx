'use client'

import { useState, useEffect } from 'react'
import { availableCarAssetPaths } from '@/data/carAssetManifest'

interface CarImageProps {
  id: string
  brand: string
  model: string
  year: number
  src?: string
  priority?: boolean
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
  className,
  style,
  fit = 'contain',
  aspectRatio = '16/10',
}: CarImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)
  const [hasFinalError, setHasFinalError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setResolvedSrc(null)
    setHasFinalError(false)
    setIsLoading(true)
  }, [id, src, brand, model, year])

  const slug = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const tokenize = (value: string) => slug(value).split('-').filter(Boolean)

  const brandSlug = slug(brand)
  const modelSlug = slug(model)
  const modelBaseSlug = modelSlug
    .split('-')
    .filter(Boolean)
    .reduce<string[]>((acc, token) => {
      // Remove tokens que começam com número ou são categorias técnicas
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

  // Lista de candidatos em ordem de prioridade
  // Se o ano for 2026, tentamos logo 2025 e 2024 como alternativas principais
  const fallbackYears = year >= 2025 ? [2025, 2024] : [2024]
  
  const imageCandidates = [
    src, // 1. O src exato vindo dos dados
    `/assets/cars/${id}.png`, // 2. O ID exato
    ...brandVariants.flatMap((b) => [
      `/assets/cars/${b}-${modelSlug}.png`,
      `/assets/cars/${b}-${modelBaseSlug}.png`,
    ]),
    
    // 3. Variações por Ano (Primeiro o solicitado, depois os fallbacks imediatos)
    ...brandVariants.flatMap((b) => [
      `/assets/cars/${b}-${modelSlug}-${year}.png`,
      `/assets/cars/${b}-${modelBaseSlug}-${year}.png`,
      ...fallbackYears.flatMap(fy => [
        `/assets/cars/${b}-${modelSlug}-${fy}.png`,
        `/assets/cars/${b}-${modelBaseSlug}-${fy}.png`,
      ])
    ]),

  ].filter(Boolean) as string[]

  const manifestPaths = Array.from(availableCarAssetPaths)
  const modelTokens = tokenize(modelBaseSlug)

  const bestManifestMatch = manifestPaths
    .map((assetPath) => {
      const file = assetPath.replace('/assets/cars/', '').replace('.png', '')
      const fileTokens = file.split('-').filter(Boolean)
      let score = 0

      if (file.includes(`${brandSlug}-`) || file.includes(`vw-`)) score += 30
      for (const token of modelTokens) {
        if (fileTokens.includes(token)) score += 8
      }
      if (file.includes(`${modelBaseSlug}-`)) score += 20
      if (file.endsWith('-2025')) score += 3
      if (file.endsWith('-2024')) score += 2

      return { assetPath, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.assetPath

  const uniqueImageCandidates = Array.from(new Set([
    ...imageCandidates,
    ...(bestManifestMatch ? [bestManifestMatch] : []),
  ]))
  const localCandidates = uniqueImageCandidates.filter((path) => {
    if (!path.startsWith('/assets/cars/')) return true
    return availableCarAssetPaths.has(path)
  })
  const resolvedCandidates = localCandidates

  useEffect(() => {
    if (resolvedCandidates.length === 0) {
      setHasFinalError(true)
      setIsLoading(false)
    }
  }, [resolvedCandidates.length])

  useEffect(() => {
    let cancelled = false

    if (resolvedCandidates.length === 0) {
      setHasFinalError(true)
      setIsLoading(false)
      return
    }

    const tryResolve = async () => {
      setIsLoading(true)
      setHasFinalError(false)

      for (const candidate of resolvedCandidates) {
        const loaded = await new Promise<boolean>((resolve) => {
          const image = new window.Image()
          image.onload = () => resolve(true)
          image.onerror = () => resolve(false)
          image.src = candidate
          if (image.complete && image.naturalWidth > 0) resolve(true)
        })

        if (cancelled) return
        if (loaded) {
          setResolvedSrc(candidate)
          setIsLoading(false)
          return
        }
      }

      if (!cancelled) {
        setResolvedSrc(null)
        setHasFinalError(true)
        setIsLoading(false)
      }
    }

    void tryResolve()

    return () => {
      cancelled = true
    }
  }, [resolvedCandidates])

  return (
    <div 
      className={`relative overflow-hidden bg-[#eef2f5] dark:bg-neutral-900 ${className}`}
      style={{
        ...style,
        aspectRatio,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!hasFinalError && resolvedSrc && (
        <img
          src={resolvedSrc}
          alt={`${brand} ${model} ${year}`}
          className={`w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'} transition-all duration-700 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          style={{
            transform: isLoading ? 'scale(0.98)' : 'scale(1)',
            objectPosition: 'center center',
            pointerEvents: 'none'
          }}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Loading Shimmer / Pulse */}
      {isLoading && resolvedCandidates.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark/5 animate-pulse z-10">
          <div className="w-12 h-1.5 bg-dark/10 rounded-full animate-bounce" />
        </div>
      )}

      {/* Premium Fallback UI (Se tudo falhar) */}
      {hasFinalError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#eef2f5] to-[#dde4e9]">
           <div className="relative mb-3 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/50 backdrop-blur-md border border-dark/5 rounded-full absolute animate-pulse" />
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white border-2 border-dark shadow-[4px_4px_0_#0A0A0A] rounded-xl flex items-center justify-center text-dark rotate-[2deg] z-10">
                 <span className="font-black text-xl sm:text-2xl uppercase tracking-tight">{brand?.charAt(0)}</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-1.5 z-10">
              <p className="text-[10px] sm:text-[11px] font-black text-dark uppercase tracking-[0.15em] text-center leading-tight bg-[var(--color-bento-yellow)] px-3 py-1.5 rounded rotate-[-1deg] border border-dark shadow-[2px_2px_0_#0A0A0A]">
                Imagem indisponível
              </p>
              <p className="text-[9px] font-bold text-dark/30 uppercase tracking-widest text-center mt-1">
                 Fonte real não encontrada
              </p>
           </div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-24 bg-dark/5 blur-3xl rounded-full skew-x-12 pointer-events-none" />
        </div>
      )}
    </div>
  )
}
