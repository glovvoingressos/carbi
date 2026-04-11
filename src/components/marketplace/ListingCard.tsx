import Link from 'next/link'
import { ListingPublic, getFipeComparison } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import { resolveMarketplaceCarImage } from '@/lib/car-image-fallback'

export default function ListingCard({ listing }: { listing: ListingPublic }) {
  const cover = resolveMarketplaceCarImage({
    brand: listing.brand,
    model: listing.model,
    year: listing.year_model,
    preferredUrl: listing.images?.[0]?.url || null,
  })
  const fipe = getFipeComparison(Number(listing.price), listing.fipe_price)

  return (
    <Link
      href={`/anuncios/${listing.slug}`}
      className="group pastel-card pastel-card-blue rounded-3xl p-3 transition hover:-translate-y-0.5"
    >
      {cover ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/75">
          <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
          {listing.badges && listing.badges.length > 0 ? (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
              {listing.badges.map((badge) => (
                <span
                  key={badge.key}
                  className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-dark"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="aspect-square w-full rounded-2xl bg-white/75 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-text-tertiary">
          Sem imagem
        </div>
      )}
      <div className="p-2">
        <h3 className="line-clamp-2 text-sm font-black text-dark">{listing.title}</h3>
        <p className="mt-1 text-xl font-black text-dark">{formatBRL(Number(listing.price))}</p>
        <p className="text-xs font-semibold text-text-secondary">
          {listing.year}/{listing.year_model} • {listing.mileage.toLocaleString('pt-BR')} km • {listing.city}/{listing.state}
        </p>
        <p className="mt-1 text-xs font-bold text-text-tertiary">
          {fipe.status === 'below' && 'Abaixo do preço médio'}
          {fipe.status === 'near' && 'Próximo do preço médio'}
          {fipe.status === 'above' && 'Acima do preço médio'}
          {fipe.status === 'unknown' && 'Referência indisponível'}
        </p>
        <div className="mt-1.5 space-y-0.5">
          {listing.listed_since ? (
            <p className="text-[11px] font-semibold text-text-secondary">Anunciado {listing.listed_since}</p>
          ) : null}
          {listing.price_updated_since ? (
            <p className="text-[11px] font-semibold text-text-secondary">Preço atualizado {listing.price_updated_since}</p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
