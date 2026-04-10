'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Star, Bookmark, GitCompare, Zap, Users, Fuel, ChevronRight } from 'lucide-react'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'
import CarImage from './CarImage'

interface CarCardProps {
  car: CarSpec
  index?: number
  view?: 'grid' | 'list'
  onCompare?: (car: CarSpec) => void
  isComparing?: boolean
}

// ── Calcula rating visual com base em critérios reais ─────────────────────────
function getDisplayRating(car: CarSpec): number {
  if (car.latinNcap > 0) return parseFloat((car.latinNcap * 0.95 + 0.2).toFixed(1))
  return 4.4
}

// ── Badge do card baseado no tipo/tags ────────────────────────────────────────
function getCardBadge(car: CarSpec): { label: string; style: React.CSSProperties; className: string } | null {
  if (car.segment === 'electric' || car.engineType.toLowerCase().includes('elétrico')) {
    return { label: 'ELÉTRICO', className: 'text-white font-black tracking-widest', style: { backgroundColor: 'var(--color-bento-red)', transform: 'rotate(-3deg)', padding: '4px 10px', borderRadius: '4px', border: '1px solid #000', boxShadow: '2px 2px 0px #000' } }
  }
  if (car.isPopular && car.latinNcap >= 5) {
    return { label: '5 ESTRELAS', className: 'text-white font-black tracking-widest', style: { backgroundColor: 'var(--color-dark)', transform: 'rotate(2deg)', padding: '4px 10px', borderRadius: '4px' } }
  }
  if (car.isPopular) {
    return { label: 'POPULAR', className: 'text-dark font-black tracking-widest', style: { backgroundColor: 'var(--color-bento-amber)', transform: 'rotate(-2deg)', padding: '4px 10px', borderRadius: '4px', border: '1px solid #000', boxShadow: '2px 2px 0px #000' } }
  }
  if (car.tags?.includes('tecnologia') || car.tags?.includes('hibrido')) {
    return { label: 'DESTAQUE', className: 'text-dark font-black tracking-widest', style: { backgroundColor: 'var(--color-bento-blue)', transform: 'rotate(1deg)', padding: '4px 10px', borderRadius: '4px', border: '1px solid #000', boxShadow: '-2px 2px 0px #000' } }
  }
  return null
}

export default function CarCard({ car, index = 0, onCompare, isComparing = false }: CarCardProps) {
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
  const rating = getDisplayRating(car)
  const badge = getCardBadge(car)
  const detailUrl = `/${brandSlug}/${car.slug}`

  // Segmento legível
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
      className={`car-card relative bg-white border border-black/5 rounded-[24px] sm:rounded-[32px] p-0 sm:p-3.5 pb-3.5 sm:pb-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col group scroll-reveal sr-delay-${Math.min(index + 1, 6)}`}
      onClick={() => router.push(detailUrl)}
      style={{ cursor: 'pointer' }}
    >
      {/* ── Área da imagem ────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#f4f6f8] rounded-[24px] sm:rounded-[24px] overflow-hidden">
        {badge && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
            <span className={badge.className} style={{ display: 'inline-block', fontSize: 9, ...badge.style, border: 'none', boxShadow: 'none' }}>{badge.label}</span>
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
          className="h-full w-full"
        />

        {onCompare && (
          <button
            className="car-card-compare-btn absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-md rounded-full px-4 py-2 hidden sm:flex items-center gap-2 shadow-sm font-semibold text-[12px] text-[#0A0A0A]"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCompare(car)
            }}
            aria-label={`Comparar ${car.model}`}
          >
            <GitCompare className="w-3.5 h-3.5 opacity-60" />
            {isComparing ? 'Remover' : 'Comparar'}
          </button>
        )}
      </div>

      {/* ── Conteúdo ──────────────────────────────────── */}
      <div className="px-3 sm:px-3 pt-3.5 sm:pt-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="text-[12px] sm:text-[13px] font-bold text-[#0A0A0A]">{rating}</span>
          </div>
          <span className="text-[11px] sm:text-[12px] font-semibold text-[#0A0A0A]/45 uppercase tracking-widest truncate max-w-[84px]">
            {segLabel}
          </span>
        </div>

        <h3 className="text-xl sm:text-[1.25rem] font-bold text-[#0A0A0A] leading-tight mb-0.5 tracking-[-0.02em] line-clamp-1">
          {car.model}
        </h3>
        <p className="text-[13px] sm:text-[13px] text-[#0A0A0A]/55 mb-3.5 sm:mb-5 line-clamp-1">
          {car.version}
        </p>

        <div className="mb-3.5 sm:mb-5">
          <span className="text-2xl sm:text-[2rem] font-bold text-[#0A0A0A] tracking-[-0.03em] font-sans leading-none">
            {formatBRL(car.priceBrl)}
          </span>
        </div>

        <div className="hidden sm:flex gap-2 flex-wrap mb-6">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0A0A0A]/70 bg-[#f4f6f8] px-3 py-1.5 rounded-xl">
            <Fuel className="w-3.5 h-3.5 opacity-50" /> {car.engineType}
          </span>
          {car.horsepower > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0A0A0A]/70 bg-[#f4f6f8] px-3 py-1.5 rounded-xl">
              <Zap className="w-3.5 h-3.5 opacity-50" /> {car.horsepower} cv
            </span>
          )}
        </div>

        {/* Linha de Ação */}
        <div className="flex items-center gap-2 mt-auto pt-2.5 sm:pt-4 border-t border-black/5">
          <div className="flex flex-1 items-center justify-between bg-[#f4f6f8] hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] rounded-[14px] sm:rounded-[20px] px-3.5 sm:px-5 py-2.5 sm:py-3.5 transition-colors duration-300">
            <span className="font-semibold text-[14px] sm:text-[13px]">Ver</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" strokeWidth={2.5} />
          </div>

          <button
            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-[14px] sm:rounded-[20px] transition-colors ${saved ? 'bg-[var(--color-bento-blue)] text-white' : 'bg-[#f4f6f8] text-[#0A0A0A]/40 hover:bg-black/5'}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSaved(!saved)
            }}
            aria-label={saved ? 'Remover dos salvos' : 'Salvar carro'}
          >
            <Bookmark className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${saved ? 'fill-white opacity-100' : 'opacity-70'}`} />
          </button>
        </div>
      </div>
    </article>
  )
}
