'use client'
/* eslint-disable @next/next/no-img-element */

import Image from 'next/image'
import { useState } from 'react'
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

function isOptimizableSource(source: string) {
  if (source.startsWith('/') && !source.startsWith('//')) return true

  try {
    const imageUrl = new URL(source)
    if (imageUrl.protocol === 'https:' && imageUrl.hostname === 'images.unsplash.com') return true

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return false
    const storageUrl = new URL(supabaseUrl)

    return (imageUrl.origin === storageUrl.origin
      && imageUrl.pathname.startsWith('/storage/v1/object/public/'))
  } catch {
    return false
  }
}

type SafeMarketplaceImageProps = {
  sources: Array<string | null | undefined>
  alt: string
  className?: string
  containerClassName?: string
  priority?: boolean
  sizes?: string
  loadingLabel?: string
}

export default function SafeMarketplaceImage(props: SafeMarketplaceImageProps) {
  const sources = normalizeSources(props.sources)
  const sourceKey = JSON.stringify(sources)

  return <SafeMarketplaceImageView key={sourceKey} {...props} sources={sources} />
}

function SafeMarketplaceImageView({
  sources,
  alt,
  className,
  containerClassName = 'h-full w-full',
  priority = false,
  sizes = '100vw',
  loadingLabel = 'Carregando foto',
}: SafeMarketplaceImageProps & { sources: string[] }) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    sources.length > 0 ? 'loading' : 'error',
  )
  const source = sources[sourceIndex]

  function handleError() {
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex((index) => index + 1)
      setStatus('loading')
      return
    }

    setStatus('error')
  }

  if (status === 'error' || !source) {
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

  const imageClassName = `absolute inset-0 h-full w-full ${className ?? 'object-cover'}`
  const imageStyle = { transform: 'scale(1.02)' }

  return (
    <div className={`relative overflow-hidden bg-[#F4F4F1] ${containerClassName}`} aria-busy={status === 'loading'}>
      {status !== 'ready' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F4F4F1]">
          <div className="h-1.5 w-12 animate-pulse rounded-full bg-black/10" />
          <span className="sr-only">{loadingLabel}</span>
        </div>
      ) : null}

      {isOptimizableSource(source) ? (
        <Image
          src={source}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setStatus('ready')}
          onError={handleError}
          className={imageClassName}
          style={imageStyle}
        />
      ) : (
        <img
          src={source}
          alt={alt}
          className={imageClassName}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setStatus('ready')}
          onError={handleError}
          style={imageStyle}
        />
      )}
    </div>
  )
}
