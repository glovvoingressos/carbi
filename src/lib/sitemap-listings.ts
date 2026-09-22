import { fetchPublicSitemapListingsPage, type PublicSitemapListing } from '@/lib/marketplace-server'

const SITEMAP_PAGE_SIZE = 48
const MAX_PARALLEL_PAGES = 4

async function getListingsOfType(vehicleType: 'car' | 'truck', includeImages: boolean): Promise<PublicSitemapListing[]> {
  const firstPage = await fetchPublicSitemapListingsPage(vehicleType, 1, SITEMAP_PAGE_SIZE, includeImages)
  const pages = Math.ceil(firstPage.total / firstPage.pageSize)
  const results = [...firstPage.items]

  for (let first = 2; first <= pages; first += MAX_PARALLEL_PAGES) {
    const pageNumbers = Array.from(
      { length: Math.min(MAX_PARALLEL_PAGES, pages - first + 1) },
      (_, index) => first + index,
    )
    const pageResults = await Promise.all(
      pageNumbers.map((page) => fetchPublicSitemapListingsPage(vehicleType, page, SITEMAP_PAGE_SIZE, includeImages)),
    )
    for (const result of pageResults) results.push(...result.items)
  }

  const seen = new Set<string>()
  return results.filter((listing) => {
    if (!listing.slug || seen.has(listing.slug)) return false
    seen.add(listing.slug)
    return true
  })
}

export async function getAllPublicSitemapListings(includeImages = false) {
  const [cars, trucks] = await Promise.all([
    getListingsOfType('car', includeImages),
    getListingsOfType('truck', includeImages),
  ])
  return { cars, trucks }
}
