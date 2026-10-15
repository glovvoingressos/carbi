import type { RankingModelItem } from './rankings-types'

export const SEPTEMBER_2026_FIRST_HALF_TOTAL = 109536

export function getSeptemberFirstHalfShare(unitsSold: number): number {
  return Math.round((unitsSold / SEPTEMBER_2026_FIRST_HALF_TOTAL) * 1000) / 10
}

// Contagens por modelo reportadas pelo Motor1 a partir dos dados da Fenabrave.
// A Bright Consulting divulgou 109.536 emplacamentos de veículos leves no período.
export const SEPTEMBER_2026_NEW_RANKINGS: RankingModelItem[] = [
  {
    position: 1,
    brand: 'Fiat',
    model: 'Strada',
    slug: 'fiat-strada',
    unitsSold: 7307,
    category: 'Picape Compacta',
    segment: 'pickup',
  },
  {
    position: 2,
    brand: 'Volkswagen',
    model: 'Polo',
    slug: 'volkswagen-polo',
    unitsSold: 4995,
    category: 'Hatch Compacto',
    segment: 'hatch',
  },
  {
    position: 3,
    brand: 'BYD',
    model: 'Dolphin Mini',
    slug: 'byd-dolphin-mini',
    unitsSold: 4414,
    category: 'Hatch Elétrico',
    segment: 'electric',
  },
  {
    position: 4,
    brand: 'Fiat',
    model: 'Argo',
    slug: 'fiat-argo',
    unitsSold: 3298,
    category: 'Hatch Compacto',
    segment: 'hatch',
  },
  {
    position: 5,
    brand: 'Volkswagen',
    model: 'Tera',
    slug: 'volkswagen-tera',
    unitsSold: 3273,
    category: 'SUV Compacto',
    segment: 'suv',
  },
  {
    position: 6,
    brand: 'Hyundai',
    model: 'HB20',
    slug: 'hyundai-hb20',
    unitsSold: 3203,
    category: 'Hatch Compacto',
    segment: 'hatch',
  },
  {
    position: 7,
    brand: 'Volkswagen',
    model: 'T-Cross',
    slug: 'volkswagen-t-cross',
    unitsSold: 2999,
    category: 'SUV Compacto',
    segment: 'suv',
  },
  {
    position: 8,
    brand: 'BYD',
    model: 'Song',
    slug: 'byd-song',
    unitsSold: 2735,
    category: 'SUV Híbrido',
    segment: 'suv',
  },
  {
    position: 9,
    brand: 'Hyundai',
    model: 'Creta',
    slug: 'hyundai-creta',
    unitsSold: 2646,
    category: 'SUV Compacto',
    segment: 'suv',
  },
  {
    position: 10,
    brand: 'Fiat',
    model: 'Toro',
    slug: 'fiat-toro',
    unitsSold: 2621,
    category: 'Picape Intermediária',
    segment: 'pickup',
  },
]
