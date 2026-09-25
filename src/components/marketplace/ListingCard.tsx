'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, TrendingDown, TrendingUp, Gauge, Calendar, MapPin } from 'lucide-react'
import { getFipeDifferencePercent, ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from './MarketplaceListingImage'

export default function ListingCard({ listing, priority = false, index = 0 }: { listing: ListingPublic; priority?: boolean; index?: number }) {
  const [favorited, setFavorited] = useState(false)

  const difference = getFipeDifferencePercent(listing.price, listing.fipe_price, listing.fipe_difference_percent)
  const fipe = difference === null ? null : Math.round(difference)
  const fipeLabel = fipe === null
    ? 'FIPE indisponível'
    : fipe <= -3
      ? `${Math.abs(fipe)}% abaixo da FIPE`
      : fipe >= 3
        ? `${Math.abs(fipe)}% acima da FIPE`
        : 'Na média da FIPE'
  const imageUrls = listing.images?.map((img) => img.url) || []

  return (
    <Link
      href={`/anuncios/${listing.slug}`}
      className="cbi-card"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="cbi-card-media">
        <MarketplaceListingImage
          brand={listing.brand}
          model={listing.model}
          year={listing.year_model}
          imageUrls={imageUrls}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover"
          priority={priority}
        />
        <span className={`cbi-card-badge${fipe === null ? ' is-unavailable' : fipe <= -3 ? '' : fipe >= 3 ? ' is-above' : ' is-neutral'}`}>
          {fipe === null ? null : fipe <= -3 ? <TrendingDown size={10} /> : fipe >= 3 ? <TrendingUp size={10} /> : null}
          {fipeLabel}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setFavorited((f) => !f)
          }}
          className={`cbi-card-fav${favorited ? ' on' : ''}`}
          aria-label="Favoritar"
        >
          <Heart size={16} className={favorited ? 'fill-current' : ''} />
        </button>
      </div>
      <div className="cbi-card-body">
        <div className="cbi-card-brand">{listing.brand}</div>
        <div className="cbi-card-title">
          {listing.model} {listing.year_model}
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-[12px] font-semibold text-[#52607A]">R$</span>
          <div className="cbi-card-price">{formatBRL(Number(listing.price)).replace('R$', '').trim()}</div>
        </div>
        <div className="cbi-card-specs">
          <span><Gauge size={12} /> {listing.mileage.toLocaleString('pt-BR')} km</span>
          <span><Calendar size={12} /> {listing.year_model}</span>
          <span><MapPin size={12} /> {listing.city}</span>
        </div>
      </div>
    </Link>
  )
}
