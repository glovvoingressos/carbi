import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Fuel,
  Gauge,
  Settings2,
} from 'lucide-react'

import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'

export type HomeFeaturedListingData = {
  brand: string
  model: string
  version: string | null
  year: number | null
  price: number | null
  priceLabel: string
  fuel: string | null
  transmission: string | null
  horsepower: number | null
  href: string
  imageUrls: string[]
  imageAlt: string
}

type HomeFeaturedListingProps = {
  listing: HomeFeaturedListingData | null
}

export default function HomeFeaturedListing({ listing }: HomeFeaturedListingProps) {
  if (!listing) return null

  // Keep the identity block resilient when an older listing has a blank field.
  // The model is the only title detail, keeping the card focused on identity.
  const brand = listing.brand.trim() || 'Marca não informada'
  const title = listing.model.trim() || 'Modelo não informado'
  const sourceLabel = 'Anúncio publicado'

  const facts = [
    listing.year ? { label: 'Ano', value: String(listing.year), icon: CalendarDays } : null,
    listing.fuel ? { label: 'Combustível', value: listing.fuel, icon: Fuel } : null,
    listing.transmission ? { label: 'Câmbio', value: listing.transmission, icon: Settings2 } : null,
    listing.horsepower ? { label: 'Potência', value: `${listing.horsepower} cv`, icon: Gauge } : null,
  ].filter(Boolean) as Array<{
    label: string
    value: string
    icon: typeof CalendarDays
  }>

  return (
    <section
      className="cb-section-pad cb-featured-section"
      style={{ paddingBottom: 'clamp(24px, 4vw, 48px)' }}
      aria-labelledby="home-featured-listing-title"
    >
      <div className="cb-wrap">
        <div className="cb-head">
          <h2 id="home-featured-listing-title">Anúncio em destaque</h2>
        </div>

        <Link
          href={listing.href}
          className="group grid overflow-hidden rounded-[28px] border border-[var(--cb-charcoal)] bg-[var(--cb-charcoal)] text-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--cb-accent)] hover:shadow-[0_18px_40px_-24px_rgba(26,26,26,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cb-iris)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--cb-bg)] md:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]"
          data-testid="home-featured-listing"
          aria-label={`${sourceLabel}: ${brand} ${title}`}
        >
          <div className="relative h-[220px] overflow-hidden bg-[var(--cb-bg-alt)] sm:h-[260px] md:h-auto md:min-h-[390px]">
            <MarketplaceListingImage
              brand={listing.brand}
              model={listing.model}
              year={listing.year ?? undefined}
              imageUrls={listing.imageUrls}
              alt={listing.imageAlt}
              priority
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-[var(--cb-accent)] px-3 py-1.5 text-xs font-bold tracking-[0.02em] text-[var(--cb-ink)]">
              {sourceLabel}
            </span>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-6 p-5 sm:gap-8 sm:p-8 md:p-10">
            <div className="min-w-0">
              <p className="cb-dark-copy-brand m-0 text-sm font-bold uppercase tracking-[0.16em] text-[var(--cb-accent)]">
                {brand}
              </p>
              <h3
                className="cb-dark-heading mt-2 !text-white text-3xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-4xl"
              >
                {title}
              </h3>
              {facts.length > 0 ? (
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/20 pt-5 sm:mt-7 sm:gap-y-5 sm:pt-6">
                  {facts.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="min-w-0">
                      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75">
                        <Icon size={14} aria-hidden="true" />
                        {label}
                      </dt>
                      <dd className="mt-1 truncate text-sm font-bold text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5 border-t border-white/15 pt-6">
              {listing.price ? (
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75">
                    {listing.priceLabel}
                  </span>
                  <strong className="mt-1 block text-2xl font-bold tracking-[-0.03em] text-white">
                    {formatBRL(listing.price)}
                  </strong>
                </div>
              ) : <span />}
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--cb-lime)]">
                Ver anúncio
                <ArrowRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
