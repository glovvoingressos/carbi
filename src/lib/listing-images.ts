export type ListingImageSource = {
  id: string
  url?: string | null
  public_url?: string | null
  sort_order: number
  is_primary: boolean
}

export type ListingImageNormalized = {
  id: string
  url: string
  sort_order: number
  is_primary: boolean
}

// The `vehicle_listings_public` view exposes image objects with a `url` key,
// while direct `vehicle_listings` table queries expose `public_url`. Resolve
// both shapes so images survive regardless of the query path used.
export function normalizeListingImages(
  images: ListingImageSource[] | null | undefined,
): ListingImageNormalized[] {
  return (images || []).map((image) => ({
    id: image.id,
    url: image.public_url || image.url || '',
    sort_order: image.sort_order,
    is_primary: image.is_primary,
  }))
}