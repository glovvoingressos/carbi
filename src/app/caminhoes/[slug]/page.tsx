import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { fetchPublicTruckListingsPage, getFilterOptions, type ListingSort, type TruckListingFilters } from '@/lib/marketplace-server'
import { ALLOWED_SORTS } from '@/lib/marketplace-seo'
import { getAllTruckSeoParams, resolveTruckPreset, serializeJsonLd, truckCollectionJsonLd, truckPresetMetadata } from '@/lib/truck-seo'

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    return getAllTruckSeoParams()
  } catch (error) {
    console.error('Erro ao gerar static params para caminhoes/[slug]:', error)
    return []
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const preset = resolveTruckPreset(slug)
  if (!preset) {
    return {
      title: 'Caminhões à venda',
      description: 'Caminhões usados e seminovos com preço, ficha técnica e comparação FIPE.',
    }
  }

  const hasParameters = Object.values(sp).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : typeof value === 'string' && value.trim().length > 0,
  )

  return truckPresetMetadata(preset, hasParameters)
}

function readValue(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key]
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readValues(searchParams: Record<string, string | string[] | undefined>, key: string): string[] {
  const value = searchParams[key]
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function readNumber(searchParams: Record<string, string | string[] | undefined>, key: string): number | undefined {
  const value = readValue(searchParams, key)
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseTruckInput(
  searchParams: Record<string, string | string[] | undefined>,
  presetQuery: TruckListingFilters,
): TruckListingFilters {
  const sort = readValue(searchParams, 'ordem')
  const page = readNumber(searchParams, 'pagina') || readNumber(searchParams, 'page')
  const brand = readValues(searchParams, 'brand')
  const model = readValues(searchParams, 'model')
  const city = readValues(searchParams, 'city')
  const bodyType = readValues(searchParams, 'body_type')
  const transmission = readValues(searchParams, 'transmission')
  const fuel = readValues(searchParams, 'fuel')
  const color = readValues(searchParams, 'color')
  const truckType = readValues(searchParams, 'truck_type')
  const axles = readValues(searchParams, 'axles').map(Number).filter((value) => Number.isFinite(value))

  return {
    ...presetQuery,
    vehicle_type: 'truck',
    q: readValue(searchParams, 'q') || presetQuery.q,
    ...(brand.length > 0 ? { brand } : {}),
    ...(model.length > 0 ? { model } : {}),
    ...(city.length > 0 ? { city } : {}),
    state: readValue(searchParams, 'state') || presetQuery.state,
    ...(bodyType.length > 0 ? { bodyType } : {}),
    ...(transmission.length > 0 ? { transmission } : {}),
    ...(fuel.length > 0 ? { fuel } : {}),
    ...(color.length > 0 ? { color } : {}),
    ...(truckType.length > 0 ? { truckType } : {}),
    ...(axles.length > 0 ? { axles } : {}),
    priceMin: readNumber(searchParams, 'price_min') ?? presetQuery.priceMin,
    priceMax: readNumber(searchParams, 'price_max') ?? presetQuery.priceMax,
    yearMin: readNumber(searchParams, 'year_min') ?? presetQuery.yearMin,
    yearMax: readNumber(searchParams, 'year_max') ?? presetQuery.yearMax,
    mileageMin: readNumber(searchParams, 'mileage_min') ?? presetQuery.mileageMin,
    mileageMax: readNumber(searchParams, 'mileage_max') ?? presetQuery.mileageMax,
    loadCapacityMin: readNumber(searchParams, 'load_capacity_min') ?? presetQuery.loadCapacityMin,
    loadCapacityMax: readNumber(searchParams, 'load_capacity_max') ?? presetQuery.loadCapacityMax,
    sort: ALLOWED_SORTS.includes(sort as ListingSort) ? (sort as ListingSort) : presetQuery.sort || 'recent',
    page: page || 1,
    pageSize: 24,
  }
}

export default async function TruckSeoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const preset = resolveTruckPreset(slug)
  if (!preset) notFound()

  const [listings, filterOptions] = await Promise.all([
    fetchPublicTruckListingsPage(parseTruckInput(sp, preset.listingQuery)),
    getFilterOptions(),
  ])

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'}/caminhoes/${preset.slug}`

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Caminhões à venda', url: '/caminhoes' },
            { name: preset.h1, url: `/caminhoes/${preset.slug}` },
          ]}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              truckCollectionJsonLd({ url: canonicalUrl, name: preset.h1, listings: listings.items.slice(0, 24) }),
            ),
          }}
        />

        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Caminhões</div>
          <h1 className="cbi-hero-title">{preset.h1}</h1>
          <p className="cbi-hero-sub">{preset.intro}</p>
        </section>

        <MarketplaceClient
          initialListings={listings.items}
          initialTotal={listings.total}
          initialPage={listings.page}
          initialTotalPages={Math.max(1, Math.ceil(listings.total / listings.pageSize))}
          defaultFilters={{ ...preset.listingQuery, vehicle_type: 'truck' }}
          filterOptions={filterOptions}
        />
      </div>
      <nav className="cbi-nav" aria-label="Navegação de caminhões">
        <Link href="/caminhoes">Home</Link>
        <Link href="/caminhoes/buscar" className="active">Buscar</Link>
        <Link href="/anunciar-caminhao">Anunciar</Link>
      </nav>
    </main>
  )
}
