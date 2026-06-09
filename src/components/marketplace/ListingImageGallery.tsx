'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { getCarImageUrl } from '@/lib/car-image-fallback'

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
  const failedRef = useRef<Set<string>>(new Set())
  const retriedRef = useRef<Set<string>>(new Set())
  const [, forceRender] = useState(0)
  const visibleGallery = gallery.filter((url) => !failedRef.current.has(url))

  const getDisplaySrc = useCallback((url: string) => {
    if (!retriedRef.current.has(url)) return url
    return getCarImageUrl(url) || url
  }, [])

  const handleImageError = useCallback((url: string) => {
    const retryUrl = getCarImageUrl(url)
    if (retryUrl && retryUrl !== url && !retriedRef.current.has(url)) {
      retriedRef.current.add(url)
      forceRender((n) => n + 1)
      return
    }

    if (!failedRef.current.has(url)) {
      failedRef.current.add(url)
      forceRender((n) => n + 1)
    }
  }, [])

  if (!gallery.length) return null
  if (visibleGallery.length === 0) {
    return (
      <div className="ref-ad-gallery">
        <div className="ref-ad-gallery-main">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 border border-white/70 shadow-sm">
              <ImageIcon className="h-8 w-8 text-[#8A95A8]" />
            </div>
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#525252]">
              Imagem indisponível
            </p>
          </div>
        </div>
      </div>
    )
  }

  const safeIndex = Math.min(activeIndex, visibleGallery.length - 1)

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? visibleGallery.length - 1 : prev - 1))
  const goNext = () => setActiveIndex((prev) => (prev === visibleGallery.length - 1 ? 0 : prev + 1))

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
          {visibleGallery.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-full w-full flex-shrink-0">
              <img
                src={getDisplaySrc(image)}
                alt={`${title} foto ${index + 1}`}
                width={1080}
                height={1080}
                className="block h-full w-full object-cover object-center"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={() => handleImageError(image)}
              />
            </div>
          ))}
        </div>

        {visibleGallery.length > 1 ? (
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

            <div className="ref-ad-gallery-count">{safeIndex + 1}/{visibleGallery.length}</div>
          </>
        ) : null}
      </div>

      {visibleGallery.length > 1 ? (
        <div className="ref-ad-gallery-thumbs">
          {visibleGallery.map((image, index) => {
            const isActive = index === safeIndex
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`ref-ad-thumb ${isActive ? 'active' : ''}`}
                aria-label={`Abrir foto ${index + 1}`}
              >
                <img
                  src={getDisplaySrc(image)}
                  alt={`${title} miniatura ${index + 1}`}
                  width={1080}
                  height={1080}
                  className="block h-full w-full object-cover object-center"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                  loading="lazy"
                  decoding="async"
                  onError={() => handleImageError(image)}
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
