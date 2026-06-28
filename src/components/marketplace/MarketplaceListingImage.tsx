'use client'

import { useMemo } from 'react'
import { CAR_IMAGE_HEIGHT, CAR_IMAGE_WIDTH, resolveMarketplaceCarImageCandidates } from '@/lib/car-image-fallback'
import SafeMarketplaceImage from './SafeMarketplaceImage'

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

  return (
    <SafeMarketplaceImage
      sources={sources}
      alt={alt}
      className={className}
      containerClassName="h-full w-full"
      priority={priority}
      loadingLabel={`Carregando imagem de ${alt}`}
    />
  )
}
