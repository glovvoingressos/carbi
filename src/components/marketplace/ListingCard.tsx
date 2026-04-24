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
  const cover = resolveMarketplaceCarImage({
    brand: listing.brand,
    model: listing.model,
    year: listing.year_model,
    preferredUrl: listing.images?.[0]?.url || null,
  })
  const hasFipe = typeof listing.fipe_price === 'number' && listing.fipe_price > 0
  const isGoodDeal = hasFipe && Number(listing.price) <= Number(listing.fipe_price) * 0.9
  const isVeryRecent = listing.listed_since?.includes('segundos') || listing.listed_since?.includes('minutos') || listing.listed_since?.includes('hora')
  
  const tone = CARD_TONES[hashToIndex(listing.id, CARD_TONES.length)]
  const mainBadge = isGoodDeal ? { label: 'Oportunidade' } : isVeryRecent ? { label: 'Novo' } : listing.badges?.[0] || null

  const infoRows = [
    { label: 'Ano/Modelo', value: `${listing.year}/${listing.year_model}` },
    { label: 'Quilometragem', value: `${listing.mileage.toLocaleString('pt-BR')} km` },
    { label: 'Cidade/UF', value: `${listing.city}/${listing.state}` },
    ...(hasFipe ? [{ label: 'Preço FIPE', value: formatBRL(Number(listing.fipe_price)) }] : []),
    ...(listing.listed_since ? [{ label: 'Anunciado', value: listing.listed_since }] : []),
  ]

  return (
    <Link
      href={`/anuncios/${listing.slug}`}
      className="group block rounded-[34px] transition hover:-translate-y-0.5"
    >
      <PastelSpecCard tone={tone} titleBadge={mainBadge?.label || 'Destaque'} badgeInside>
        {cover ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-[30px] bg-[#e5e8ed]">
            <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
            {isGoodDeal && (
              <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                -{Math.round((1 - Number(listing.price) / Number(listing.fipe_price)) * 100)}% FIPE
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square w-full rounded-[30px] bg-[#e5e8ed] flex items-center justify-center text-xs font-bold uppercase tracking-widest text-text-tertiary">
            Sem imagem
          </div>
        )}

        <div className="mt-5">
          <h3 className="line-clamp-2 text-[20px] leading-tight font-black text-dark">{listing.title}</h3>
          <p className="mt-1.5 text-3xl sm:text-[38px] leading-none font-black text-dark">{formatBRL(Number(listing.price))}</p>
        </div>

        <div className="mt-5">
          <PastelKeyValueRows rows={infoRows} />
        </div>
      </PastelSpecCard>
    </Link>
  )
}
