'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
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
  const visibleGallery = gallery.filter((url) => !failedRef.current.has(url))

  const handleImageError = useCallback((url: string) => {
    if (!failedRef.current.has(url)) {
      failedRef.current.add(url)
      forceRender((n) => n + 1)
    }
  }, [])

  if (!gallery.length) return null
  if (visibleGallery.length === 0) {
    return (
      <div className="space-y-3 max-[330px]:space-y-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[32px] bg-[#FFF8DF] shadow-xl border border-white/70 max-[330px]:rounded-[24px]">
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
    <div className="space-y-3 max-[330px]:space-y-2">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[32px] bg-white shadow-xl border border-white/70 max-[330px]:rounded-[24px]"
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
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {visibleGallery.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-full w-full flex-shrink-0">
              <img
                src={image}
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
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[#1A2F1E] shadow-lg backdrop-blur-sm transition hover:bg-white"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[#1A2F1E] shadow-lg backdrop-blur-sm transition hover:bg-white"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm">
              {visibleGallery.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === safeIndex ? 'w-6 bg-[#1A2F1E]' : 'w-2.5 bg-[#8A95A8]/40 hover:bg-[#8A95A8]/70'}`}
                  aria-label={`Ir para foto ${index + 1}`}
                  aria-pressed={index === safeIndex}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {visibleGallery.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 max-[330px]:gap-1.5">
          {visibleGallery.map((image, index) => {
            const isActive = index === safeIndex
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl transition max-[330px]:h-14 max-[330px]:w-14 max-[330px]:rounded-xl ${
                  isActive ? 'ring-2 ring-[#17170F]' : 'opacity-80 hover:opacity-100'
                }`}
                aria-label={`Abrir foto ${index + 1}`}
              >
                <img
                  src={image}
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
