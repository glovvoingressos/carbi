'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { ImageIcon } from 'lucide-react'

function normalizeSources(sources: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      sources
        .map((source) => source?.trim())
        .filter((source): source is string => Boolean(source)),
    ),
  )
}

function loadImage(source: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)

  return new Promise((resolve) => {
    const image = new window.Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = source

    if (image.complete && image.naturalWidth > 0) {
      resolve(true)
    }
  })
}

type SafeMarketplaceImageProps = {
  sources: Array<string | null | undefined>
  alt: string
  className?: string
  containerClassName?: string
  priority?: boolean
  loadingLabel?: string
}

export default function SafeMarketplaceImage({
  sources,
  alt,
  className = 'h-full w-full object-cover',
  containerClassName = 'h-full w-full',
  priority = false,
  loadingLabel = 'Carregando foto',
}: SafeMarketplaceImageProps) {
  const sourceKey = JSON.stringify(normalizeSources(sources))
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      const normalizedSources = JSON.parse(sourceKey) as string[]
      setResolvedSrc(null)
      setStatus(normalizedSources.length > 0 ? 'loading' : 'error')

      for (const source of normalizedSources) {
        const loaded = await loadImage(source)
        if (cancelled) return
        if (loaded) {
          setResolvedSrc(source)
          setStatus('ready')
          return
        }
      }

      if (!cancelled) {
        setResolvedSrc(null)
        setStatus('error')
      }
    }

    void resolve()

    return () => {
      cancelled = true
    }
  }, [sourceKey])

  if (status === 'error') {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[#F4F4F1] ${containerClassName}`}
        aria-label="Imagem indisponível"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(255,248,223,0.95))]" />
        <div className="relative z-10 flex flex-col items-center gap-2 text-[#8A95A8]">
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs font-semibold uppercase tracking-widest">Sem imagem</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`} aria-busy={status === 'loading'}>
      {status !== 'ready' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F4F4F1]">
          <div className="h-1.5 w-12 animate-pulse rounded-full bg-black/10" />
          <span className="sr-only">{loadingLabel}</span>
        </div>
      ) : null}

      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : null}
    </div>
  )
}
