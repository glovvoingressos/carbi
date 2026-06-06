'use client'

import { useEffect, useMemo, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { getCarImageUrl, resolveMarketplaceCarImage } from '@/lib/car-image-fallback'

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
}

export default function MarketplaceListingImage({
  brand,
  model,
  year,
  imageUrls = [],
  alt,
  className = 'h-full w-full object-cover',
  priority = false,
}: MarketplaceListingImageProps) {
  const uploadedSources = useMemo(
    () => imageUrls.map((url) => getCarImageUrl(url) || null).filter((url): url is string => Boolean(url)),
    [imageUrls],
  )
  const assetFallback = useMemo(
    () => getCarImageUrl(resolveMarketplaceCarImage({ brand, model, year, preferredUrl: null })) || null,
    [brand, model, year],
  )
  const sources = useMemo(() => {
    if (uploadedSources.length > 0) return uploadedSources
    return assetFallback ? [assetFallback] : []
  }, [uploadedSources, assetFallback])
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
      width={1080}
      height={1080}
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
