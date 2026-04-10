import Link from 'next/link'
import { ListingPublic, getFipeComparison } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'

export default function ListingCard({ listing }: { listing: ListingPublic }) {
  const cover = listing.images?.[0]?.url || '/assets/decorations/car-3d.png'
  const fipe = getFipeComparison(Number(listing.price), listing.fipe_price)

  return (
    <Link
      href={`/anuncios/${listing.slug}`}
      className="group rounded-3xl border border-border bg-white p-3 shadow-sm transition hover:-translate-y-0.5"
    >
      <img src={cover} alt={listing.title} className="h-44 w-full rounded-2xl object-cover" />
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
      </div>
    </Link>
  )
}
