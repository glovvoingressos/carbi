'use client'

import { useMemo, useState } from 'react'

type ListingImageGalleryProps = {
  images: string[]
  title: string
}

export default function ListingImageGallery({ images, title }: ListingImageGalleryProps) {
  const gallery = useMemo(() => images.filter(Boolean), [images])
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  if (!gallery.length) return null

  const safeIndex = Math.min(activeIndex, gallery.length - 1)
  const activeImage = gallery[safeIndex]

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  const goNext = () => setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[26px] bg-white/70"
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
        <img
          src={activeImage}
          alt={`${title} foto ${safeIndex + 1}`}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>

      {gallery.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, index) => {
            const isActive = index === safeIndex
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl transition ${
                  isActive ? 'ring-2 ring-dark/70' : 'opacity-80 hover:opacity-100'
                }`}
                aria-label={`Abrir foto ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`${title} miniatura ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
