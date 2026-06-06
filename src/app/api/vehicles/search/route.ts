import { NextResponse } from 'next/server'
import { searchPublicListings } from '@/lib/marketplace-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.toLowerCase() || ''

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const listings = await searchPublicListings(q, 8)
  const results = listings.map((listing) => ({
    listingSlug: listing.slug,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    image: listing.images?.find((image) => image.is_primary)?.url || listing.images?.[0]?.url || '',
    year: listing.year_model,
    price: listing.price,
    city: listing.city,
    state: listing.state,
  }))

  return NextResponse.json({ results })
}
