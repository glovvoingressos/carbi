'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronDown,
  Gauge,
  MapPin,
  Settings2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import { formatBRL } from '@/data/cars'
import type { ListingPublic } from '@/lib/marketplace'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type HomeListingSort = 'price_desc' | 'price_asc' | 'year_desc' | 'year_asc' | 'recent'

const INITIAL_VISIBLE_LISTINGS = 6
const REVEAL_STEP = 6

const SORT_OPTIONS: Array<{ value: HomeListingSort; label: string }> = [
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'year_desc', label: 'Mais novo' },
  { value: 'year_asc', label: 'Mais antigo' },
  { value: 'recent', label: 'Mais recente' },
]

function parseSort(value: string | null): HomeListingSort {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? value as HomeListingSort
    : 'recent'
}

function dateValue(value: string | null | undefined) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function recentValue(listing: ListingPublic) {
  return dateValue(listing.published_at || listing.created_at)
}

export function sortHomeListings(listings: ListingPublic[], sort: HomeListingSort) {
  if (sort === 'recent') {
    return [...listings].sort((a, b) => recentValue(b) - recentValue(a))
  }

  return [...listings].sort((a, b) => {
    if (sort === 'price_desc') return Number(b.price) - Number(a.price)
    if (sort === 'price_asc') return Number(a.price) - Number(b.price)
    if (sort === 'year_desc') return b.year_model - a.year_model
    return a.year_model - b.year_model
  })
}

function fipePercent(listing: ListingPublic) {
  if (typeof listing.fipe_difference_percent !== 'number') return null
  return Math.round(listing.fipe_difference_percent)
}

type HomeListingsProps = {
  listings: ListingPublic[]
  fetchError?: boolean
}

export default function HomeListings({ listings, fetchError = false }: HomeListingsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState<HomeListingSort>(() => parseSort(searchParams.get('ordem')))
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LISTINGS)

  const sortedListings = useMemo(() => sortHomeListings(listings, sort), [listings, sort])
  const visibleListings = sortedListings.slice(0, visibleCount)
  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Mais recente'

  function handleSortChange(value: string | null) {
    const nextSort = parseSort(value)
    const nextSearchParams = new URLSearchParams(searchParams.toString())

    setSort(nextSort)

    if (nextSort === 'recent') {
      nextSearchParams.delete('ordem')
    } else {
      nextSearchParams.set('ordem', nextSort)
    }

    const query = nextSearchParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    setVisibleCount(INITIAL_VISIBLE_LISTINGS)
  }

  if (listings.length === 0) {
    return fetchError ? (
      <div className="cb-listing-empty" role="alert">
        <strong>Não foi possível carregar os anúncios agora.</strong>
        <p>Verifique sua conexão e tente novamente.</p>
        <Link href="/?retry=1" className="cb-btn cb-btn-dark cb-btn-arrow">
          Tentar novamente
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    ) : (
      <div className="cb-listing-empty">
        Ainda não há anúncios públicos disponíveis.
      </div>
    )
  }

  return (
    <>
      <div
        className="mb-6 flex flex-wrap items-center justify-start gap-3"
        style={{ borderBottom: '1px solid var(--cb-line)', paddingBottom: 16 }}
      >
        <div className="flex min-h-11 flex-wrap items-center gap-2" style={{ color: 'var(--cb-ink)', fontSize: 14, fontWeight: 700 }}>
          <span id="home-listing-sort-label">Ordenar por</span>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger
              id="home-listing-sort"
              aria-labelledby="home-listing-sort-label"
              className="h-11 min-h-11 min-w-48 touch-manipulation rounded-full border-[var(--cb-line-strong)] bg-[var(--cb-surface)] px-4 py-2 text-sm font-semibold text-[var(--cb-ink)] shadow-none transition-[border-color,background-color,box-shadow] hover:border-[var(--cb-charcoal)] hover:bg-[var(--cb-surface)] focus-visible:border-[var(--cb-iris)] focus-visible:ring-2 focus-visible:ring-[var(--cb-iris)] focus-visible:ring-offset-2"
            >
              <SelectValue>{selectedSortLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent
              align="end"
              className="w-[var(--anchor-width)] rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-1.5 text-[var(--color-text-primary)] shadow-[var(--shadow-md)]"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="w-full rounded-[var(--radius-sm)] px-3 py-2.5 font-semibold whitespace-nowrap text-[var(--color-text-primary)] focus:bg-[var(--color-accent-soft)] focus:text-[var(--color-text-primary)] data-[highlighted]:bg-[var(--color-accent-soft)] data-[highlighted]:text-[var(--color-text-primary)]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        id="home-listing-grid"
        className="cb-listing-cards"
        aria-label="Anúncios de veículos"
      >
        {visibleListings.map((listing) => {
          const fipe = fipePercent(listing)
          const imageUrls = listing.images?.map((img) => img.url) || []
          const version = listing.version?.trim()
          const hasDistinctVersion = Boolean(
            version && !listing.model.toLowerCase().includes(version.toLowerCase()),
          )

          return (
            <Link
              key={listing.id}
              href={`/anuncios/${listing.slug}`}
              className="cb-listing-card focus-visible:ring-2 focus-visible:ring-[var(--cb-iris)] focus-visible:ring-offset-2"
              data-testid="home-listing-card"
            >
              <div className="cb-listing-card-image">
                <MarketplaceListingImage
                  brand={listing.brand}
                  model={listing.model}
                  year={listing.year_model}
                  imageUrls={imageUrls}
                  alt={`${listing.brand} ${listing.model} ${listing.year_model}`}
                />
              </div>
              <div className="cb-listing-card-body">
                <div className="cb-listing-card-head">
                  <div className="cb-listing-card-title">
                    <span className="cb-listing-card-brand">{listing.brand}</span>
                    <span className="cb-listing-card-model">{listing.model}</span>
                  </div>
                  {hasDistinctVersion ? (
                    <span className="cb-listing-card-version">{version}</span>
                  ) : null}
                </div>

                <div className="cb-listing-card-specs" aria-label="Detalhes do veículo">
                  <div className="cb-listing-spec" aria-label={`Ano ${listing.year_model}`}>
                    <CalendarIcon size={13} />
                    <span className="cb-listing-spec-value">{listing.year_model}</span>
                  </div>
                  <div
                    className="cb-listing-spec"
                    aria-label={`Quilometragem ${listing.mileage ? `${(listing.mileage / 1000).toFixed(listing.mileage % 1000 === 0 ? 0 : 1)} mil quilômetros` : 'não informada'}`}
                  >
                    <Gauge size={13} />
                    <span className="cb-listing-spec-value">
                      {listing.mileage ? `${(listing.mileage / 1000).toFixed(listing.mileage % 1000 === 0 ? 0 : 1)}k km` : '—'}
                    </span>
                  </div>
                  {listing.transmission ? (
                    <div className="cb-listing-spec" aria-label={`Câmbio ${listing.transmission}`}>
                      <Settings2 size={13} />
                      <span className="cb-listing-spec-value">{listing.transmission}</span>
                    </div>
                  ) : null}
                </div>

                <div className="cb-listing-card-footer">
                  <strong className="cb-listing-card-price-main">{formatBRL(Number(listing.price))}</strong>
                  {fipe !== null ? (
                    <span className={`cb-listing-fipe-inline ${fipe <= 0 ? 'is-good' : 'is-bad'}`}>
                      {fipe <= 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                      {Math.abs(fipe)}% {fipe <= 0 ? 'abaixo da FIPE' : 'acima da FIPE'}
                    </span>
                  ) : null}
                  <span className="cb-listing-card-arrow" aria-hidden="true">
                    <ArrowRight size={14} />
                  </span>
                </div>
                {listing.city ? (
                  <span className="cb-listing-card-location">
                    <MapPin size={11} />
                    <span className="cb-listing-card-location-text">
                      {listing.city}{listing.state ? `, ${listing.state}` : ''}
                    </span>
                  </span>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>

      {visibleCount < sortedListings.length ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="cb-btn cb-btn-dark cb-btn-arrow touch-manipulation"
            aria-controls="home-listing-grid"
            onClick={() => setVisibleCount((current) => Math.min(current + REVEAL_STEP, sortedListings.length))}
            style={{ touchAction: 'manipulation' }}
          >
            Mostrar mais anúncios
            <ChevronDown size={17} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  )
}
