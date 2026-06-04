'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import { resolveMarketplaceCarImage } from '@/lib/car-image-fallback'
import { PastelKeyValueRows, PastelSpecCard, PastelTone } from '@/components/ui/PastelSpecCard'

const CARD_TONES: PastelTone[] = ['gray']

function hashToIndex(value: string, size: number): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash % size
}

export default function ListingCard({ listing }: { listing: ListingPublic }) {
  const [imgError, setImgError] = useState(false)
  const cover = !imgError ? resolveMarketplaceCarImage({
    brand: listing.brand,
    model: listing.model,
    year: listing.year_model,
    preferredUrl: listing.images?.[0]?.url || null,
  }) : null
  const hasFipe = typeof listing.fipe_price === 'number' && listing.fipe_price > 0
  const isGoodDeal = hasFipe && Number(listing.price) <= Number(listing.fipe_price) * 0.9
  const isVeryRecent = listing.listed_since?.includes('segundos') || listing.listed_since?.includes('minutos') || listing.listed_since?.includes('hora')

  const tone = CARD_TONES[hashToIndex(listing.id, CARD_TONES.length)]
  const mainBadge = isGoodDeal ? { label: 'Oportunidade' } : isVeryRecent ? { label: 'Novo' } : listing.badges?.[0] || null

  const infoRows = [
    { label: 'Ano', value: `${listing.year}/${listing.year_model}` },
    { label: 'Km', value: `${listing.mileage.toLocaleString('pt-BR')} km` },
    { label: 'Local', value: `${listing.city}/${listing.state}` },
    ...(listing.vehicle_type === 'truck' ? [
      { label: 'Tipo', value: listing.truck_type || 'Não informado' },
      { label: 'Carga', value: listing.load_capacity ? `${listing.load_capacity} t` : 'Não informado' },
    ] : []),
  ].slice(0, 4)

  return (
    <Link
      href={`/anuncios/${listing.slug}`}
      className="group block transition-transform duration-300 hover:-translate-y-0.5"
    >
      <PastelSpecCard tone={tone} titleBadge={mainBadge?.label} badgeInside className="p-0 overflow-hidden">
        {cover ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-alt">
            <img src={cover} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setImgError(true)} />
            {isGoodDeal && (
              <div className="absolute top-3 right-3 badge badge-success text-[10px]">
                -{Math.round((1 - Number(listing.price) / Number(listing.fipe_price)) * 100)}% FIPE
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-bg-alt flex items-center justify-center text-xs font-semibold text-text-tertiary">
            Sem imagem
          </div>
        )}

        <div className="p-4 pt-3">
          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{listing.title}</h3>
          <p className="mt-1 text-xl font-bold text-text-primary tracking-tight">{formatBRL(Number(listing.price))}</p>
        </div>

        <div className="px-4 pb-4">
          <PastelKeyValueRows rows={infoRows} />
        </div>
      </PastelSpecCard>
    </Link>
  )
}
