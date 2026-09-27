import {
  fetchPublicSitemapListingsPage,
  type PublicSitemapListing,
} from '@/lib/marketplace-server'

type SitemapListingCollections = {
  cars: PublicSitemapListing[]
  trucks: PublicSitemapListing[]
}

async function getAllPublicSitemapListingsForType(
  vehicleType: 'car' | 'truck',
  includeImages: boolean,
): Promise<PublicSitemapListing[]> {
  const firstPage = await fetchPublicSitemapListingsPage({ vehicleType, page: 1, includeImages })
  const totalPages = Math.ceil(firstPage.total / firstPage.pageSize)
  if (totalPages <= 1) return firstPage.items

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchPublicSitemapListingsPage({
        vehicleType,
        page: index + 2,
        includeImages,
      }),
    ),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.items)
}

function dedupeBySlug(listings: PublicSitemapListing[]): PublicSitemapListing[] {
  const seen = new Set<string>()
  return listings.filter((listing) => {
    if (!listing.slug || seen.has(listing.slug)) return false
    seen.add(listing.slug)
    return true
  })
}

export async function getAllPublicSitemapListings(includeImages = false): Promise<SitemapListingCollections> {
  const [cars, trucks] = await Promise.all([
    getAllPublicSitemapListingsForType('car', includeImages),
    getAllPublicSitemapListingsForType('truck', includeImages),
  ])

  return {
    cars: dedupeBySlug(cars),
    trucks: dedupeBySlug(trucks),
  }
}
