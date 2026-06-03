'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Star, Bookmark, Zap, Fuel, ChevronRight } from 'lucide-react'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'
import CarImage from './CarImage'

interface CarCardProps {
  car: CarSpec
  index?: number
  view?: 'grid' | 'list'
}

function getDisplayRating(car: CarSpec): number {
  if (car.latinNcap > 0) return parseFloat((car.latinNcap * 0.95 + 0.2).toFixed(1))
  return 4.4
}

function getCardBadge(car: CarSpec): { label: string; variant: 'accent' | 'gold' | 'neutral' } | null {
  if (car.segment === 'electric' || car.engineType.toLowerCase().includes('elétrico')) {
    return { label: 'ELÉTRICO', variant: 'accent' }
  }
  if (car.isPopular && car.latinNcap >= 5) {
    return { label: '5 ESTRELAS', variant: 'gold' }
  }
  if (car.isPopular) {
    return { label: 'POPULAR', variant: 'neutral' }
  }
  if (car.tags?.includes('tecnologia') || car.tags?.includes('hibrido')) {
    return { label: 'DESTAQUE', variant: 'neutral' }
  }
  return null
}

export default function CarCard({ car, index = 0 }: CarCardProps) {
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const rating = getDisplayRating(car)
  const badge = getCardBadge(car)
  const detailUrl = `/${brandSlug}/${car.slug}`

  const segmentLabel: Record<string, string> = {
    hatch: 'Hatch',
    sedan: 'Sedan',
    suv: 'SUV',
    picape: 'Picape',
    eletrico: 'Elétrico',
  }
  const segLabel = segmentLabel[car.segment] || car.segment

  return (
    <article
      className="card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col group cursor-pointer"
      onClick={() => router.push(detailUrl)}
    >
      <div className="relative w-full aspect-[4/3] bg-bg-alt overflow-hidden">
        {badge && (
          <div className={`absolute top-3 left-3 z-10 badge ${
            badge.variant === 'accent' ? 'badge-accent' :
            badge.variant === 'gold' ? 'badge-gold' :
            'badge-neutral'
          }`}>
            {badge.label}
          </div>
        )}

        <CarImage
          id={car.id}
          brand={car.brand}
          model={car.model}
          year={car.year}
          src={car.image}
          fit="cover"
          aspectRatio="4/3"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
            <span className="text-xs font-bold text-text-primary">{rating}</span>
          </div>
          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest truncate max-w-[80px]">
            {segLabel}
          </span>
        </div>

        <h3 className="text-base font-bold text-text-primary leading-tight mb-0.5 truncate">
          {car.model}
        </h3>
        <p className="text-xs text-text-secondary mb-3 truncate">
          {car.version}
        </p>

        <div className="mb-3">
          <span className="text-xl font-bold text-text-primary tracking-tight">
            {formatBRL(car.priceBrl)}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <span className="flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-bg-alt px-2.5 py-1 rounded-lg">
            <Fuel className="w-3 h-3 opacity-50" /> {car.engineType}
          </span>
          {car.horsepower > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-bg-alt px-2.5 py-1 rounded-lg">
              <Zap className="w-3 h-3 opacity-50" /> {car.horsepower} cv
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
          <div className="flex flex-1 items-center justify-between bg-bg-alt hover:bg-accent hover:text-white text-text-primary rounded-xl px-4 py-2.5 transition-colors duration-300">
            <span className="font-semibold text-sm">Ver detalhes</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" strokeWidth={2.5} />
          </div>

          <button
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
              saved ? 'bg-accent text-white' : 'bg-bg-alt text-text-tertiary hover:bg-border'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSaved(!saved)
            }}
            aria-label={saved ? 'Remover dos salvos' : 'Salvar carro'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  )
}
