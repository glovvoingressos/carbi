'use client'

import { useEffect, useMemo, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { CAR_IMAGE_HEIGHT, CAR_IMAGE_WIDTH, resolveMarketplaceCarImageCandidates } from '@/lib/car-image-fallback'

function isValidUrl(url: string | null | undefined) {
  return Boolean(url && url.trim())
}

type MarketplaceListingImageProps = {
  brand: string
  model: string
  year?: number
  imageUrls?: Array<string | null | undefined>
  alt: string
  className?: string
  priority?: boolean
  width?: number
  height?: number
  preferTransformed?: boolean
}

export default function MarketplaceListingImage({
  brand,
  model,
  year,
  imageUrls = [],
  alt,
  className = 'h-full w-full object-cover',
  priority = false,
  width = CAR_IMAGE_WIDTH,
  height = CAR_IMAGE_HEIGHT,
  preferTransformed = true,
}: MarketplaceListingImageProps) {
  const sources = useMemo(
    () => resolveMarketplaceCarImageCandidates({ brand, model, year, preferredUrls: imageUrls, width, height, preferTransformed }),
    [brand, model, year, imageUrls, width, height, preferTransformed],
  )
  const [sourceIndex, setSourceIndex] = useState(0)
  const [failedFallback, setFailedFallback] = useState(false)

  useEffect(() => {
    setSourceIndex(0)
    setFailedFallback(false)
  }, [sources])

  const src = sources[sourceIndex] || null

  if (!isValidUrl(src) || failedFallback) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#FFF8DF] text-[#8A95A8]">
        <ImageIcon className="h-8 w-8" />
        <span className="text-xs font-semibold uppercase tracking-widest">Sem imagem</span>
      </div>
    )
  }

  return (
    <img
      src={src!}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((current) => Math.min(current + 1, sources.length - 1))
          return
        }
        setFailedFallback(true)
      }}
    />
  )
}
