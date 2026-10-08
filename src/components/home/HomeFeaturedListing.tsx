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
import { heroFont } from './home-font'
import '../../app/home-hero.css'

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
      className={`cb-section-pad hf ${heroFont.variable}`}
      aria-labelledby="home-featured-listing-title"
    >
      <div className="cb-wrap">
        <div className="hf-head">
          <h2 id="home-featured-listing-title" className="hf-title">Anúncio em destaque</h2>
        </div>

        <Link
          href={listing.href}
          className="hf-card"
          data-testid="home-featured-listing"
          aria-label={`${sourceLabel}: ${brand} ${title}`}
        >
          <div className="hf-media">
            <MarketplaceListingImage
              brand={listing.brand}
              model={listing.model}
              year={listing.year ?? undefined}
              imageUrls={listing.imageUrls}
              alt={listing.imageAlt}
              priority
              className="hf-image"
            />
            <span className="hf-status">{sourceLabel}</span>
          </div>

          <div className="hf-body">
            <div>
              <p className="hf-brand">{brand}</p>
              <h3 className="hf-model">{title}</h3>
            </div>

            {facts.length > 0 ? (
              <dl className="hf-facts">
                {facts.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="hf-fact">
                    <dt>
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="hf-footer">
              {listing.price ? (
                <div>
                  <span className="hf-price-label">{listing.priceLabel}</span>
                  <strong className="hf-price">{formatBRL(listing.price)}</strong>
                </div>
              ) : <span />}
              <span className="hf-cta">
                Ver anúncio
                <span className="hf-cta-circle" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
