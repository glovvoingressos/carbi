'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Car, Zap, Truck, Gauge, CarFront, Leaf, Crown, Wallet, BadgeCheck, Sparkles, ArrowRight } from 'lucide-react'

interface Category {
  label: string
  filter: string
  img: string
  badge: string
}

const ICON_MAP: Record<string, typeof Car> = {
  SUVs: Car,
  'Elétricos': Zap,
  'Picapes': Truck,
  'Esportivos': Gauge,
  'Sedans': CarFront,
  'Hatches': Car,
  'Híbridos': Leaf,
  'Executivos': Crown,
  'Acessíveis': Wallet,
  'Luxo': Sparkles,
  // fallbacks
}

function iconFor(cat: Category) {
  return ICON_MAP[cat.label] || BadgeCheck
}

// pares [fundo do círculo, cor do ícone/borda do destaque]
const STYLE_SET: Array<[string, string]> = [
  ['rgba(207, 202, 236, 0.7)', '#6B5FC7'],   // lavender
  ['rgba(212, 245, 118, 0.6)', '#5A6B00'],   // lime
  ['rgba(248, 213, 200, 0.75)', '#C0593B'],  // peach
  ['rgba(180, 214, 235, 0.7)', '#2B6C9E'],   // blue
  ['rgba(220, 226, 222, 0.8)', '#5A6B60'],   // sage
  ['rgba(234, 226, 240, 0.75)', '#7A5E9E'],  // mauve
  ['rgba(255, 229, 196, 0.75)', '#8A5A12'],  // amber
  ['rgba(214, 232, 208, 0.7)', '#3F7A3A'],   // green
  ['rgba(242, 214, 230, 0.7)', '#9E2B63'],   // pink
  ['rgba(214, 226, 245, 0.75)', '#33549E'],  // indigo
]

export default function ExploreCarousel({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(0)

  return (
    <div className="cb-cat-row" role="tablist" aria-label="Categorias de veículos">
      {categories.map((cat, i) => {
        const Icon = iconFor(cat)
        const [bg, fg] = STYLE_SET[i % STYLE_SET.length]
        const isActive = i === active
        return (
          <Link
            key={cat.label}
            href={`/carros-a-venda?body_type=${encodeURIComponent(cat.filter)}`}
            className={`cb-cat-item ${isActive ? 'is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            style={{
              '--cat-bg': bg,
              '--cat-fg': fg,
            } as React.CSSProperties}
          >
            <span className="cb-cat-icon-wrap" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className="cb-cat-label">{cat.label}</span>
            <span className="cb-cat-arrow" aria-hidden="true">
              <ArrowRight size={14} />
            </span>
          </Link>
        )
      })}
    </div>
  )
}