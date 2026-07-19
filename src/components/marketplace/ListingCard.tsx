'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, TrendingUp, Gauge, Calendar, MapPin } from 'lucide-react'
import { ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from './MarketplaceListingImage'

export default function ListingCard({ listing, priority = false, index = 0 }: { listing: ListingPublic; priority?: boolean; index?: number }) {
  const [favorited, setFavorited] = useState(false)

  const hasFipe = typeof listing.fipe_price === 'number' && listing.fipe_price > 0
  const fipe = hasFipe ? Math.round((1 - Number(listing.price) / Number(listing.fipe_price)) * 100) : null
  const isBelowFipe = fipe !== null && fipe <= -3
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
          className="h-full w-full object-cover"
          priority={priority}
        />
        {isBelowFipe && (
          <span className="cbi-card-badge">
            <TrendingUp size={10} />
            {Math.abs(fipe!)}% abaixo FIPE
          </span>
        )}
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
        <div className="cbi-card-price">{formatBRL(Number(listing.price))}</div>
        <div className="cbi-card-specs">
          <span><Gauge size={12} /> {listing.mileage.toLocaleString('pt-BR')} km</span>
          <span><Calendar size={12} /> {listing.year_model}</span>
          <span><MapPin size={12} /> {listing.city}</span>
        </div>
      </div>
    </Link>
  )
}
