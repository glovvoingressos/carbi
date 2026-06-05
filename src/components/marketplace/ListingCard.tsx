'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Gauge, Calendar, MapPin, ImageIcon } from 'lucide-react'
import { ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import { resolveMarketplaceCarImage, getCarImageUrl } from '@/lib/car-image-fallback'

export default function ListingCard({ listing, priority = false }: { listing: ListingPublic; priority?: boolean }) {
  const [imgError, setImgError] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const cover = !imgError ? getCarImageUrl(resolveMarketplaceCarImage({
    brand: listing.brand,
    model: listing.model,
    year: listing.year_model,
    preferredUrl: listing.images?.[0]?.url || null,
  })) : null

  const hasFipe = typeof listing.fipe_price === 'number' && listing.fipe_price > 0
  const isGoodDeal = hasFipe && Number(listing.price) <= Number(listing.fipe_price) * 0.9
  const dealPercent = hasFipe ? Math.round((1 - Number(listing.price) / Number(listing.fipe_price)) * 100) : 0
  const mileageFormatted = listing.mileage.toLocaleString('pt-BR')

  return (
    <Link
      href={`/anuncios/${listing.slug}`}
      className="group block press"
    >
      <article className="surface-strong overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFF8DF]">
          {cover ? (
            <img
              src={cover}
              alt={listing.title}
              width={1080}
              height={1080}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-[#A3A3A3]">
              <ImageIcon className="w-8 h-8 mb-2" strokeWidth={1.5} />
              <span className="text-xs font-medium">Sem imagem</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isGoodDeal && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D9F85F] text-[#17170F] text-[11px] font-bold tracking-tight shadow-sm border border-[#17170F]/20">
                {dealPercent}% abaixo da FIPE
              </span>
            )}
            {listing.badges?.slice(0, 1).map((b) => (
              <span key={b.key} className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-[#17170F] text-[11px] font-bold tracking-tight border border-[#17170F]/12 shadow-sm">
                {b.label}
              </span>
            ))}
          </div>

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setFavorited((f) => !f)
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white transition-all shadow-sm border border-white/60"
            aria-label="Favoritar"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${favorited ? 'fill-[#DC2626] text-[#DC2626]' : 'text-[#0A0A0A]'}`}
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-[15px] font-bold text-[#17170F] tracking-tight line-clamp-1">
            {listing.title}
          </h3>

          <p className="mt-2 text-[21px] font-extrabold text-[#17170F] tracking-tight">
            {formatBRL(Number(listing.price))}
          </p>

          {hasFipe && (
            <p className="mt-0.5 text-[12px] text-[#857C6B] tracking-tight">
              FIPE {formatBRL(Number(listing.fipe_price))}
            </p>
          )}

          {/* Specs */}
          <div className="mt-4 pt-3 border-t border-[#17170F]/10 flex items-center gap-3 text-[12px] text-[#4F4A3E]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
              {listing.year}/{listing.year_model}
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" strokeWidth={1.75} />
              {mileageFormatted} km
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-[#4F4A3E]">
            <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="truncate">{listing.city}/{listing.state}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
