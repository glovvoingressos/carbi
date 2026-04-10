import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { ListingPublic } from '@/lib/marketplace'

type ListingImageRow = {
  id: string
  public_url: string
  sort_order: number
  is_primary: boolean
}

type ListingRow = Omit<ListingPublic, 'images'> & {
  images?: ListingImageRow[] | null
}

type ListingQueryInput = {
  id?: string
  slug?: string
  brand?: string
  model?: string
  q?: string
  yearModel?: number
  excludeId?: string
  limit?: number
  single?: boolean
}

function isMissingRelationError(message?: string): boolean {
  if (!message) return false
  return message.includes('Could not find the table')
    || message.includes('does not exist')
    || message.includes('relation')
}

function normalizeTableRow(row: ListingRow): ListingPublic {
  return {
    ...row,
    images: (row.images || []).map((image) => ({
      id: image.id,
      url: image.public_url,
      sort_order: image.sort_order,
      is_primary: image.is_primary,
    })),
  } as ListingPublic
}

async function queryListings(input: ListingQueryInput): Promise<ListingPublic[]> {
  const supabase = getSupabaseServerClient()
  const safeLimit = Math.min(Math.max(input.limit || 8, 1), 60)

  let viewQuery = supabase
    .from('vehicle_listings_public')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(safeLimit)

  if (input.id) viewQuery = viewQuery.eq('id', input.id)
  if (input.slug) viewQuery = viewQuery.eq('slug', input.slug)
  if (input.brand) viewQuery = viewQuery.ilike('brand', `%${input.brand}%`)
  if (input.model) viewQuery = viewQuery.ilike('model', `%${input.model}%`)
  if (input.q) viewQuery = viewQuery.or(`brand.ilike.%${input.q}%,model.ilike.%${input.q}%`)
  if (input.yearModel) viewQuery = viewQuery.eq('year_model', input.yearModel)
  if (input.excludeId) viewQuery = viewQuery.neq('id', input.excludeId)

  const { data: viewData, error: viewError } = await (input.single ? viewQuery.maybeSingle() : viewQuery)
  if (!viewError) {
    if (!viewData) return []
    return Array.isArray(viewData) ? (viewData as ListingPublic[]) : [viewData as ListingPublic]
  }

  if (!isMissingRelationError(viewError.message)) {
    return []
  }

  let tableQuery = supabase
    .from('vehicle_listings')
    .select(`
      id,
      user_id,
      title,
      description,
      brand,
      model,
      version,
      year,
      year_model,
      mileage,
      price,
      transmission,
      fuel,
      color,
      body_type,
      city,
      state,
      optional_items,
      engine,
      horsepower,
      plate_final,
      doors,
      fipe_price,
      fipe_difference_value,
      fipe_difference_percent,
      fipe_reference_month,
      status,
      slug,
      published_at,
      created_at,
      updated_at,
      images:vehicle_listing_images(
        id,
        public_url,
        sort_order,
        is_primary
      )
    `)
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(safeLimit)

  if (input.id) tableQuery = tableQuery.eq('id', input.id)
  if (input.slug) tableQuery = tableQuery.eq('slug', input.slug)
  if (input.brand) tableQuery = tableQuery.ilike('brand', `%${input.brand}%`)
  if (input.model) tableQuery = tableQuery.ilike('model', `%${input.model}%`)
  if (input.q) tableQuery = tableQuery.or(`brand.ilike.%${input.q}%,model.ilike.%${input.q}%`)
  if (input.yearModel) tableQuery = tableQuery.eq('year_model', input.yearModel)
  if (input.excludeId) tableQuery = tableQuery.neq('id', input.excludeId)

  const { data: tableData, error: tableError } = await (input.single ? tableQuery.maybeSingle() : tableQuery)
  if (tableError || !tableData) return []

  const rows = Array.isArray(tableData) ? (tableData as ListingRow[]) : [tableData as ListingRow]
  return rows.map(normalizeTableRow)
}

export async function queryPublicListings(input: ListingQueryInput): Promise<ListingPublic[]> {
  if (!isSupabaseConfigured()) return []
  return queryListings(input)
}

export async function getPublicListingBySlug(slug: string): Promise<ListingPublic | null> {
  if (!isSupabaseConfigured()) return null
  const results = await queryListings({ slug, single: true, limit: 1 })
  return results[0] || null
}

export async function getRelatedListings(params: {
  brand: string
  model: string
  yearModel?: number
  excludeId?: string
  limit?: number
}): Promise<ListingPublic[]> {
  if (!isSupabaseConfigured()) return []
  return queryListings({
    brand: params.brand,
    model: params.model,
    yearModel: params.yearModel,
    excludeId: params.excludeId,
    limit: params.limit || 6,
  })
}

export async function getLatestPublicListings(limit = 8): Promise<ListingPublic[]> {
  if (!isSupabaseConfigured()) return []
  return queryListings({ limit })
}

export async function searchPublicListings(query: string, limit = 24): Promise<ListingPublic[]> {
  if (!isSupabaseConfigured()) return []
  const q = query.trim()
  if (!q) return getLatestPublicListings(limit)
  return queryListings({ q, limit })
}
