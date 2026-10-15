'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bookmark, Zap, Fuel, ArrowRight } from 'lucide-react'
import type { CarSpec } from '@/data/cars'
import { slugifyBrand } from '@/lib/brand-utils'
import { canonicalModelSlug } from '@/lib/vehicle-slug'
import CarImage from './CarImage'

interface CarCardProps {
  car: CarSpec
  index?: number
  view?: 'grid' | 'list'
}

function getCardBadge(car: CarSpec): { label: string; tone: 'dark' | 'light' } | null {
  if (car.segment === 'electric' || car.engineType.toLowerCase().includes('elétrico')) {
    return { label: 'Elétrico', tone: 'dark' }
  }
  return null
}

export default function CarCard({ car, index = 0 }: CarCardProps) {
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const badge = getCardBadge(car)
  const detailUrl = `/${slugifyBrand(car.brand)}/${canonicalModelSlug(car.model)}`

  const segmentLabel: Record<string, string> = {
    hatch: 'Hatch', sedan: 'Sedan', suv: 'SUV', picape: 'Picape', eletrico: 'Elétrico',
  }
  const segLabel = segmentLabel[car.segment] || car.segment

  return (
    <article
      className="overflow-hidden transition-all duration-200 group cursor-pointer hover:-translate-y-1 hover:shadow-xl flex flex-col bg-white rounded-[28px] border-0 border-none"
      style={{ border: 'none' }}
      onClick={() => router.push(detailUrl)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(detailUrl)
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`${car.brand} ${car.model} ${car.version}, ano-modelo ${car.year}`}
    >
      {/* Image - 100% width, only top corners rounded */}
      <div className="relative w-full h-[280px] overflow-hidden rounded-t-[28px]">
        <CarImage
          id={car.id}
          brand={car.brand}
          model={car.model}
          year={car.year}
          src={car.image}
          strict
          fit="cover"
          className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* Badge overlay */}
        {badge && (
          <span className={`absolute top-4 left-4 z-10 badge ${badge.tone === 'dark' ? 'badge-inverse' : 'badge-glass'}`}>
            {badge.label}
          </span>
        )}

        {/* Favorite button overlay */}
        <button
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm border border-white/70 z-10"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setSaved(!saved)
          }}
          aria-label={saved ? 'Remover dos salvos' : 'Salvar carro'}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'text-[#0A0A0A]'}`} strokeWidth={1.75} />
        </button>
      </div>

      {/* Content - with internal padding */}
      <div className="px-6 py-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-[#8A95A8]">Ano-modelo {car.year}</span>
          <span className="text-[11px] font-medium text-[#8A95A8] uppercase tracking-wider truncate max-w-[80px]">
            {segLabel}
          </span>
        </div>

        <h3 className="text-[17px] font-bold text-[#0A0A0A] leading-tight tracking-tight mb-0.5 truncate">
          {car.model}
        </h3>
        <p className="text-[13px] text-[#A3A3A3] mb-3 truncate">{car.version}</p>

        <p className="mb-4 text-xs leading-relaxed text-[#52607A]">
          Consulte o preço FIPE para esta versão e ano.
        </p>

        <div className="flex gap-1.5 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#52607A] bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
            <Fuel className="w-3 h-3" strokeWidth={1.75} /> {car.engineType}
          </span>
          {car.horsepower > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#52607A] bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" strokeWidth={1.75} /> {car.horsepower} cv
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#0A0A0A] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
            Ver detalhes
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
        </div>
      </div>
    </article>
  )
}
