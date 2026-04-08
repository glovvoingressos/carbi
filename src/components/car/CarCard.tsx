'use client'

import Link from 'next/link'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'
import { Star, ArrowUpRight } from 'lucide-react'

interface CarCardProps {
  car: CarSpec
  index?: number
}

import { useState } from 'react'

export default function CarCard({ car, index = 0 }: CarCardProps) {
  const [imgSrc, setImgSrc] = useState(car.image || 'https://images.unsplash.com/photo-1542362567-b055002b91f4?q=80&w=600&auto=format&fit=crop')
  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const rating = car.latinNcap > 0 ? (car.latinNcap * 0.9 + 0.5).toFixed(1) : '4.5'

  return (
    <Link
      href={`/${brandSlug}/${car.slug}`}
      className={`block scroll-reveal sr-delay-${Math.min(index + 1, 6)}`}
    >
      <article className="car-card">
        {/* Image Area */}
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-2 px-1">
            {car.isPopular ? (
              <span className="badge-dark">Popular</span>
            ) : car.tags.includes('tecnologia') ? (
              <span className="tag-highlight">Destaque</span>
            ) : (
              <span className="badge-subtle">{car.year}</span>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current star" />
              <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>{rating}</span>
            </div>
          </div>

          <div className="car-card-image" style={{ height: 140 }}>
            <img
              src={imgSrc}
              alt={`${car.brand} ${car.model}`}
              loading="lazy"
              onError={() => setImgSrc('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop')}
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-3)' }}>
            {car.brand}
          </p>
          <h3 className="text-[15px] font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
            {car.model}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-2)' }}>
            {car.version}
          </p>

          {/* Price */}
          <div className="mt-3">
            <span className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>
              {formatBRL(car.priceBrl)}
            </span>
          </div>

          {/* Pills */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <span className="pill">⚙️ {car.transmission.split(' ')[0]}</span>
            <span className="pill">👤 {car.seats}</span>
            <span className="pill">⛽ {car.engineType}</span>
          </div>

          {/* CTA */}
          <button className="car-card-cta mt-3">
            Ver detalhes
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    </Link>
  )
}
