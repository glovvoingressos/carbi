import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { fetchPublicListingsPage, getFilterOptions, ListingSort, ListingsPageInput } from '@/lib/marketplace-server'
import { ALLOWED_SORTS, MARKETPLACE_SEO_SLUGS, resolveSeoPreset } from '@/lib/marketplace-seo'

export async function generateStaticParams() {
  return MARKETPLACE_SEO_SLUGS.map((slug) => ({ slug }))
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const preset = resolveSeoPreset(slug)
  if (!preset) {
    return {
      title: 'Carros à venda | Carbi',
      description: 'Explore anúncios ativos com filtros inteligentes e dados reais.',
    }
  }

  return {
    title: preset.title,
    description: preset.description,
    keywords: ['carros à venda', 'seminovos à venda', 'carros usados', preset.h1.toLowerCase()],
    alternates: {
      canonical: `/carros/${preset.slug}`,
    },
    openGraph: {
      title: preset.title,
      description: preset.description,
      url: `/carros/${preset.slug}`,
      type: 'website',
    },
  }
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

function parseListingInput(
  searchParams: Record<string, string | string[] | undefined>,
  presetQuery: ListingsPageInput,
): ListingsPageInput {
  const sort = readValue(searchParams, 'ordem')
  const page = readNumber(searchParams, 'pagina') || readNumber(searchParams, 'page')
  const vehicleType = readValues(searchParams, 'vehicle_type')
  const brand = readValues(searchParams, 'brand')
  const model = readValues(searchParams, 'model')
  const city = readValues(searchParams, 'city')
  const bodyType = readValues(searchParams, 'body_type')
  const transmission = readValues(searchParams, 'transmission')
  const fuel = readValues(searchParams, 'fuel')
  const color = readValues(searchParams, 'color')
  const optionalItems = readValues(searchParams, 'optional')

  const input: ListingsPageInput = {
    ...presetQuery,
    q: readValue(searchParams, 'q') || presetQuery.q,
    ...(vehicleType.length > 0 ? { vehicle_type: vehicleType } : {}),
    ...(brand.length > 0 ? { brand } : {}),
    ...(model.length > 0 ? { model } : {}),
    ...(city.length > 0 ? { city } : {}),
    state: readValue(searchParams, 'state'),
    ...(bodyType.length > 0 ? { bodyType } : {}),
    ...(transmission.length > 0 ? { transmission } : {}),
    ...(fuel.length > 0 ? { fuel } : {}),
    ...(color.length > 0 ? { color } : {}),
    priceMin: readNumber(searchParams, 'price_min'),
    priceMax: readNumber(searchParams, 'price_max'),
    yearMin: readNumber(searchParams, 'year_min'),
    yearMax: readNumber(searchParams, 'year_max'),
    mileageMin: readNumber(searchParams, 'mileage_min'),
    mileageMax: readNumber(searchParams, 'mileage_max'),
    ...(optionalItems.length > 0 ? { optionalItems } : {}),
    sort: ALLOWED_SORTS.includes(sort as ListingSort)
      ? (sort as ListingSort)
      : presetQuery.sort || 'recent',
    page: page || 1,
    pageSize: 24,
  }

  return input
}

export default async function CarrosSeoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const preset = resolveSeoPreset(slug)
  if (!preset) notFound()

  const sp = await searchParams
  const queryInput = parseListingInput(sp, preset.listingQuery)
  const listings = await fetchPublicListingsPage(queryInput)
  const filterOptions = await getFilterOptions()

  return (
    <main className="min-h-screen bg-[#f5f5f3] pt-28 pb-20">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Carros à venda', url: '/carros-a-venda' },
          { name: preset.h1, url: `/carros/${preset.slug}` },
        ]}
      />

      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAEAE8] bg-white/70 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A3A3A3]">Marketplace real</span>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#0A0A0A] sm:text-5xl">
            {preset.h1}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] font-medium leading-relaxed text-[#52607A] sm:text-[16px]">
            {preset.intro}
          </p>
        </header>

        <MarketplaceClient
          initialListings={listings.items}
          initialTotal={listings.total}
          initialPage={listings.page}
          initialTotalPages={Math.max(1, Math.ceil(listings.total / listings.pageSize))}
          defaultFilters={preset.listingQuery}
          filterOptions={filterOptions}
        />
      </div>
    </main>
  )
}
