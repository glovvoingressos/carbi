'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Star, Bookmark, GitCompare, Zap, Users, Fuel } from 'lucide-react'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'
import CarImage from './CarImage'

interface CarCardProps {
  car: CarSpec
  index?: number
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
      className={`car-card relative bg-white border-2 border-[#0A0A0A] rounded-[32px] p-2 pb-5 shadow-[4px_4px_0_#0A0A0A] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#0A0A0A] flex flex-col group scroll-reveal sr-delay-${Math.min(index + 1, 6)}`}
      onClick={() => router.push(detailUrl)}
      style={{ cursor: 'pointer' }}
    >
      {/* ── Área da imagem ────────────────────────────── */}
      <div className="relative w-full aspect-[16/10] bg-[#f4f6f8] rounded-[24px] border-2 border-[#0A0A0A] overflow-hidden">
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className={badge.className} style={{ display: 'inline-block', fontSize: 11, ...badge.style }}>{badge.label}</span>
          </div>
        )}

        <CarImage 
          id={car.id} 
          brand={car.brand} 
          model={car.model} 
          year={car.year} 
          src={car.image} 
        />

        {onCompare && (
          <button
            className="car-card-compare-btn absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border-2 border-[#0A0A0A] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[2px_2px_0_#0A0A0A] font-black text-[11px] uppercase tracking-wider"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCompare(car)
            }}
            aria-label={`Comparar ${car.model}`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {isComparing ? 'Remover' : 'Comparar'}
          </button>
        )}
      </div>

      {/* ── Conteúdo ──────────────────────────────────── */}
      <div className="px-4 pt-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-[#f4f6f8] px-2 py-1 rounded-md border border-[#0A0A0A]/10">
            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="text-[12px] font-black text-[#0A0A0A] ml-1">{rating}</span>
          </div>
          <span className="text-[11px] font-bold text-[#0A0A0A]/50 uppercase tracking-widest">
            {segLabel} · {car.brand}
          </span>
        </div>

        <h3 className="text-xl font-black text-[#0A0A0A] leading-tight mb-1 tracking-[-0.03em]">
          {car.model}
        </h3>
        <p className="text-[13px] font-semibold text-[#0A0A0A]/60 mb-4 line-clamp-1">
          {car.version}
        </p>

        <div className="mb-4">
          <span className="text-2xl font-black text-[#0A0A0A] tracking-[-0.05em]">
            {formatBRL(car.priceBrl)}
          </span>
          <span className="text-[11px] font-bold text-[#0A0A0A]/50 ml-2 uppercase tracking-wide">Fipe</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A] bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] px-2 py-1 rounded-md">
            <Fuel className="w-3 h-3" /> {car.engineType}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A] bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] px-2 py-1 rounded-md">
            <Users className="w-3 h-3" /> {car.seats} lug
          </span>
          {car.horsepower > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A] bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] px-2 py-1 rounded-md">
              <Zap className="w-3 h-3" /> {car.horsepower} cv
            </span>
          )}
        </div>

        {/* Linha de Ação */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t-2 border-[#0A0A0A]/10">
          <div className="flex flex-1 items-center justify-between bg-[#0A0A0A] text-white rounded-2xl px-5 py-3 transition-transform hover:scale-[1.02]">
            <span className="font-black text-[12px] tracking-widest uppercase">Ver Detalhes</span>
            <div className="w-6 h-6 bg-[#00D632] rounded-full flex items-center justify-center text-[#0A0A0A]">
              <ChevronRight className="w-4 h-4 ml-0.5" strokeWidth={3} />
            </div>
          </div>

          <button
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] transition-colors ${saved ? 'bg-[#00D632] text-[#0A0A0A]' : 'bg-white text-[#0A0A0A]/50 hover:bg-[#f4f6f8]'}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSaved(!saved)
            }}
            aria-label={saved ? 'Remover dos salvos' : 'Salvar carro'}
          >
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-[#0A0A0A]' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  )
}
