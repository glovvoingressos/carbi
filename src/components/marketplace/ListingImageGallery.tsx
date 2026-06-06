'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!gallery.length) return
    const nextIndex = Math.min(activeIndex, gallery.length - 1)
    const slide = trackRef.current?.children[nextIndex] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [activeIndex, gallery.length])

  const handleImageError = useCallback((url: string) => {
    if (!failedRef.current.has(url)) {
      failedRef.current.add(url)
      setActiveIndex((currentIndex) => {
        const currentUrl = gallery[currentIndex]
        if (currentUrl === url && currentIndex < gallery.length - 1) {
          return currentIndex + 1
        }
        return currentIndex
      })
      forceRender((n) => n + 1)
    }
  }, [gallery])

  const hasFailed = useCallback((url: string) => failedRef.current.has(url), [])

  if (!gallery.length) return null

  const safeIndex = Math.min(activeIndex, gallery.length - 1)

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  const goNext = () => setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))

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
          ref={trackRef}
          className="no-scrollbar flex h-full w-full overflow-x-auto scroll-smooth snap-x snap-mandatory"
          onScroll={(event) => {
            const track = event.currentTarget
            const childWidth = track.clientWidth
            if (!childWidth) return
            const index = Math.round(track.scrollLeft / childWidth)
            setActiveIndex((current) => (current === index ? current : index))
          }}
        >
          {gallery.map((image, index) => {
            const isFailed = hasFailed(image)
            return (
              <div key={`${image}-${index}`} className="relative h-full w-full flex-shrink-0 snap-start">
                {isFailed ? (
                  <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 bg-[#FFF8DF] p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 border border-white/70">
                      <ImageIcon className="h-7 w-7 text-[#8A95A8]" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A95A8]">
                      Imagem indisponível
                    </p>
                  </div>
                ) : (
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
                )}
              </div>
            )
          })}
        </div>

        {gallery.length > 1 ? (
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
              {gallery.map((_, index) => (
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

      {gallery.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 max-[330px]:gap-1.5">
          {gallery.map((image, index) => {
            const isActive = index === safeIndex
            const thumbFailed = hasFailed(image)
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
                {thumbFailed ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#FFF8DF]">
                    <ImageIcon className="h-5 w-5 text-[#8A95A8]" />
                  </div>
                ) : (
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
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
