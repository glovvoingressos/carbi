import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { ListingPublic } from '@/lib/marketplace'

export async function getPublicListingBySlug(slug: string): Promise<ListingPublic | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('vehicle_listings_public')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as ListingPublic
}

export async function getRelatedListings(params: {
  brand: string
  model: string
  yearModel?: number
  excludeId?: string
  limit?: number
}): Promise<ListingPublic[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = getSupabaseServerClient()

  let query = supabase
    .from('vehicle_listings_public')
    .select('*')
    .ilike('brand', params.brand)
    .ilike('model', params.model)
    .order('published_at', { ascending: false })
    .limit(params.limit || 6)

  if (params.excludeId) {
    query = query.neq('id', params.excludeId)
  }

  if (params.yearModel) {
    query = query.eq('year_model', params.yearModel)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data as ListingPublic[]
}
