'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SafeMarketplaceImage from './SafeMarketplaceImage'

type ListingImageGalleryProps = {
  images: string[]
  title: string
  badgeLabel?: string
  fipeBadgeLabel?: string
}

export default function ListingImageGallery({ images, title, badgeLabel, fipeBadgeLabel }: ListingImageGalleryProps) {
  const gallery = useMemo(
    () => Array.from(new Set(images.map((url) => url?.trim()).filter((url): url is string => Boolean(url)))),
    [images],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  if (!gallery.length) return null

  const safeIndex = Math.min(activeIndex, gallery.length - 1)

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  const goNext = () => setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))

  return (
    <div className="ref-ad-gallery">
      <div
        className="ref-ad-gallery-main"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStartX == null) return
          const endX = event.changedTouches[0]?.clientX ?? touchStartX
          const delta = endX - touchStartX
          if (Math.abs(delta) > 32) {
            if (delta > 0) goPrev()
            if (delta < 0) goNext()
          }
          setTouchStartX(null)
        }}
      >
        {badgeLabel ? <div className="ref-ad-gallery-tag">{badgeLabel}</div> : null}
        {fipeBadgeLabel ? <div className="ref-ad-gallery-fipe-tag">{fipeBadgeLabel}</div> : null}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {gallery.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-full w-full flex-shrink-0">
              <SafeMarketplaceImage
                sources={[image]}
                alt={`${title} foto ${index + 1}`}
                containerClassName="h-full w-full"
                className="block h-full w-full object-cover object-center"
                priority={index === 0}
                loadingLabel={`Carregando foto ${index + 1}`}
              />
            </div>
          ))}
        </div>

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="ref-ad-gallery-arrow ref-ad-gallery-arrow-left"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="ref-ad-gallery-arrow ref-ad-gallery-arrow-right"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="ref-ad-gallery-count">{safeIndex + 1}/{gallery.length}</div>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className="ref-ad-gallery-thumbs">
          {gallery.map((image, index) => {
            const isActive = index === safeIndex
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`ref-ad-thumb ${isActive ? 'active' : ''}`}
                aria-label={`Abrir foto ${index + 1}`}
              >
                <SafeMarketplaceImage
                  sources={[image]}
                  alt={`${title} miniatura ${index + 1}`}
                  containerClassName="h-full w-full"
                  className="block h-full w-full object-cover object-center"
                  loadingLabel={`Carregando miniatura ${index + 1}`}
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
