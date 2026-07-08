'use client'

import Link from 'next/link'
import { Heart, MapPin, TrendingDown } from 'lucide-react'
import { useState } from 'react'

interface VehicleCardMobileProps {
  slug: string
  brand: string
  model: string
  year: number
  price: number
  fipePrice?: number
  km?: number
  transmission?: string
  fuel?: string
  color?: string
  location?: string
  imageUrl: string
  isFavorited?: boolean
  onFavoriteToggle?: () => void
}

export default function VehicleCardMobile({
  slug,
  brand,
  model,
  year,
  price,
  fipePrice,
  km,
  transmission,
  location,
  imageUrl,
  isFavorited = false,
  onFavoriteToggle,
}: VehicleCardMobileProps) {
  const [fav, setFav] = useState(isFavorited)
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatKm = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value) + ' km'
  }

  const fipeDiff = fipePrice ? ((price - fipePrice) / fipePrice) * 100 : null
  const isBelowFipe = fipeDiff !== null && fipeDiff < 0

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFav(!fav)
    onFavoriteToggle?.()
  }

  return (
    <Link href={`/anuncios/${slug}`} className="vehicle-card-mobile">
      <div className="vehicle-card-image">
        <img 
          src={imageUrl} 
          alt={`${brand} ${model} ${year}`}
          loading="lazy"
        />
        <button 
          className="vehicle-card-favorite"
          onClick={handleFavorite}
          aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart 
            size={18} 
            fill={fav ? '#FF6B52' : 'none'} 
            color={fav ? '#FF6B52' : '#6F6F6F'}
          />
        </button>
      </div>
      
      <div className="vehicle-card-content">
        <h4 className="vehicle-card-title">{brand} {model}</h4>
        
        <p className="vehicle-card-specs">
          {year} {km && `• ${formatKm(km)}`} {transmission && `• ${transmission}`}
        </p>
        
        <div className="vehicle-card-price">{formatPrice(price)}</div>
        
        {fipePrice && (
          <div className={`vehicle-card-fipe ${isBelowFipe ? 'below-fipe' : ''}`}>
            {isBelowFipe ? (
              <>
                <TrendingDown size={14} />
                <span>FIPE: {formatPrice(fipePrice)}</span>
                <span className="badge-pill accent" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '11px' }}>
                  {Math.abs(fipeDiff).toFixed(1)}% abaixo
                </span>
              </>
            ) : (
              <span>FIPE: {formatPrice(fipePrice)}</span>
            )}
          </div>
        )}
        
        {location && (
          <div className="vehicle-card-location">
            <MapPin size={12} />
            <span>{location}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
