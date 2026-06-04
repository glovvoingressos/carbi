'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { getCarImageUrl } from '@/lib/car-image-fallback'

type ListingImageGalleryProps = {
  images: string[]
  title: string
}

export default function ListingImageGallery({ images, title }: ListingImageGalleryProps) {
  const gallery = useMemo(
    () => images.filter(Boolean).map((url) => getCarImageUrl(url) || url),
    [images],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const failedRef = useRef<Set<string>>(new Set())
  const [, forceRender] = useState(0)

  const handleImageError = useCallback((url: string) => {
    if (!failedRef.current.has(url)) {
      failedRef.current.add(url)
      forceRender((n) => n + 1)
    }
  }, [])

  const hasFailed = useCallback((url: string) => failedRef.current.has(url), [])

  if (!gallery.length) return null

  const safeIndex = Math.min(activeIndex, gallery.length - 1)
  const activeImage = gallery[safeIndex]

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  const goNext = () => setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[26px] bg-white/70"
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
        {hasFailed(activeImage) ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#FAFAF9] p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60">
              <ImageIcon className="h-7 w-7 text-[#A3A3A3]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A3A3A3]">
              Imagem indisponível
            </p>
          </div>
        ) : (
          <img
            src={activeImage}
            alt={`${title} foto ${safeIndex + 1}`}
            width={1080}
            height={1080}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            onError={() => handleImageError(activeImage)}
          />
        )}
      </div>

      {gallery.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, index) => {
            const isActive = index === safeIndex
            const thumbFailed = hasFailed(image)
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl transition ${
                  isActive ? 'ring-2 ring-[#0A0A0A]' : 'opacity-80 hover:opacity-100'
                }`}
                aria-label={`Abrir foto ${index + 1}`}
              >
                {thumbFailed ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#FAFAF9]">
                    <ImageIcon className="h-5 w-5 text-[#A3A3A3]" />
                  </div>
                ) : (
                  <img
                    src={image}
                    alt={`${title} miniatura ${index + 1}`}
                    width={1080}
                    height={1080}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(image)}
                  />
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
