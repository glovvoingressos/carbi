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

export type ListingSort =
  | 'recent'
  | 'price_asc'
  | 'price_desc'
  | 'mileage_asc'
  | 'year_desc'

export type ListingsPageInput = {
  q?: string
  brand?: string
  model?: string
  city?: string
  state?: string
  bodyType?: string
  transmission?: string
  fuel?: string
  priceMax?: number
  priceMin?: number
  sort?: ListingSort
  page?: number
  pageSize?: number
}

type ListingPriceHistoryRow = {
  listing_id: string
  old_price: number | null
  new_price: number
  changed_at: string
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

function formatRelativeTime(dateInput?: string | null): string | null {
  if (!dateInput) return null
  const target = new Date(dateInput).getTime()
  if (!Number.isFinite(target)) return null
  const now = Date.now()
  const diffMs = Math.max(0, now - target)
  const min = Math.floor(diffMs / 60000)
  if (min < 60) return `há ${Math.max(min, 1)} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `há ${months} mês${months > 1 ? 'es' : ''}`
}

function buildBadges(listing: ListingPublic, history: ListingPriceHistoryRow[]): ListingPublic['badges'] {
  const badges: NonNullable<ListingPublic['badges']> = []
  const createdAt = new Date(listing.created_at).getTime()
  const now = Date.now()
  const isNew = Number.isFinite(createdAt) && now - createdAt <= 1000 * 60 * 60 * 24 * 7
  const hasRecentDrop = history.some((item) => {
    if (item.old_price == null) return false
    const changedAt = new Date(item.changed_at).getTime()
    return item.old_price > item.new_price && Number.isFinite(changedAt) && now - changedAt <= 1000 * 60 * 60 * 24 * 30
  })
  const belowFipe = typeof listing.fipe_difference_percent === 'number' && listing.fipe_difference_percent <= -3
  const recentYear = listing.year_model >= new Date().getFullYear() - 2
  const lowMileage = listing.mileage <= 60000
  const fairPrice = typeof listing.fipe_difference_percent === 'number' ? listing.fipe_difference_percent <= -5 : listing.price <= 80000
  const opportunityScore = Number(hasRecentDrop) + Number(belowFipe) + Number(recentYear) + Number(lowMileage) + Number(fairPrice)

  if (isNew) badges.push({ key: 'new', label: 'Recém-anunciado' })
  if (hasRecentDrop) badges.push({ key: 'price_drop', label: 'Baixou preço' })
  if (belowFipe) badges.push({ key: 'below_fipe', label: 'Abaixo da FIPE' })
  if (opportunityScore >= 4) badges.push({ key: 'opportunity', label: 'Oportunidade' })
  return badges.slice(0, 3)
}

async function enrichListingSignals(listings: ListingPublic[]): Promise<ListingPublic[]> {
  if (!listings.length) return listings
  const supabase = getSupabaseServerClient()
  const listingIds = listings.map((item) => item.id)
  const historyByListing = new Map<string, ListingPriceHistoryRow[]>()

  const { data: historyData, error: historyError } = await supabase
    .from('vehicle_price_history')
    .select('listing_id, old_price, new_price, changed_at')
    .in('listing_id', listingIds)
    .order('changed_at', { ascending: false })

  if (!historyError && Array.isArray(historyData)) {
    for (const row of historyData as ListingPriceHistoryRow[]) {
      const list = historyByListing.get(row.listing_id) || []
      list.push(row)
      historyByListing.set(row.listing_id, list)
    }
  }

  return listings.map((listing) => {
    const history = historyByListing.get(listing.id) || []
    const lastChange = history[0] || null
    const changesLast30d = history.filter((row) => {
      const changedAt = new Date(row.changed_at).getTime()
      return Number.isFinite(changedAt) && Date.now() - changedAt <= 1000 * 60 * 60 * 24 * 30
    }).length

    return {
      ...listing,
      badges: buildBadges(listing, history),
      listed_since: formatRelativeTime(listing.created_at) || undefined,
      price_updated_since: formatRelativeTime(listing.price_updated_at || listing.updated_at),
      price_history: {
        has_changes: history.length > 0,
        changes_last_30d: changesLast30d,
        last_old_price: lastChange?.old_price ?? null,
        last_new_price: lastChange?.new_price ?? null,
        last_changed_at: lastChange?.changed_at ?? null,
      },
    }
  })
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
      vehicle_id,
      title,
      description,
      brand,
      model,
      version,
      year,
      year_model,
      vin,
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
      price_updated_at,
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
  const listings = await queryListings(input)
  return enrichListingSignals(listings)
}

export async function getPublicListingBySlug(slug: string): Promise<ListingPublic | null> {
  if (!isSupabaseConfigured()) return null
  const results = await queryListings({ slug, single: true, limit: 1 })
  if (!results[0]) return null
  const [enriched] = await enrichListingSignals(results)
  return enriched || null
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
  const listings = await queryListings({ limit })
  return enrichListingSignals(listings)
}

export async function searchPublicListings(query: string, limit = 24): Promise<ListingPublic[]> {
  if (!isSupabaseConfigured()) return []
  const q = query.trim()
  if (!q) return getLatestPublicListings(limit)
  const listings = await queryListings({ q, limit })
  return enrichListingSignals(listings)
}

function applySort(
  query: any,
  sort: ListingSort,
) {
  if (sort === 'price_asc') return query.order('price', { ascending: true })
  if (sort === 'price_desc') return query.order('price', { ascending: false })
  if (sort === 'mileage_asc') return query.order('mileage', { ascending: true })
  if (sort === 'year_desc') return query.order('year_model', { ascending: false }).order('published_at', { ascending: false })
  return query.order('published_at', { ascending: false })
}

export async function fetchPublicListingsPage(input: ListingsPageInput = {}) {
  if (!isSupabaseConfigured()) {
    return { items: [] as ListingPublic[], total: 0, page: 1, pageSize: 24 }
  }

  const pageSize = Math.min(Math.max(input.pageSize || 24, 1), 48)
  const page = Math.max(input.page || 1, 1)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const sort = input.sort || 'recent'

  const supabase = getSupabaseServerClient()
  let query = supabase
    .from('vehicle_listings')
    .select(`
      id,
      user_id,
      vehicle_id,
      title,
      description,
      brand,
      model,
      version,
      year,
      year_model,
      vin,
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
      price_updated_at,
      images:vehicle_listing_images(
        id,
        public_url,
        sort_order,
        is_primary
      )
    `, { count: 'exact' })
    .eq('status', 'active')
    .range(from, to)

  if (input.q) query = query.or(`brand.ilike.%${input.q}%,model.ilike.%${input.q}%,title.ilike.%${input.q}%`)
  if (input.brand) query = query.ilike('brand', input.brand)
  if (input.model) query = query.ilike('model', `%${input.model}%`)
  if (input.city) query = query.ilike('city', input.city)
  if (input.state) query = query.ilike('state', input.state)
  if (input.bodyType) query = query.ilike('body_type', `%${input.bodyType}%`)
  if (input.transmission) query = query.ilike('transmission', `%${input.transmission}%`)
  if (input.fuel) query = query.ilike('fuel', `%${input.fuel}%`)
  if (typeof input.priceMin === 'number') query = query.gte('price', input.priceMin)
  if (typeof input.priceMax === 'number') query = query.lte('price', input.priceMax)

  query = applySort(query, sort) as typeof query

  const { data, error, count } = await query
  if (error || !Array.isArray(data)) {
    return { items: [] as ListingPublic[], total: 0, page, pageSize }
  }

  const normalized = (data as ListingRow[]).map(normalizeTableRow)
  const items = await enrichListingSignals(normalized)
  return { items, total: count || 0, page, pageSize }
}

export async function getMarketplaceDiscoverySections() {
  const base = await fetchPublicListingsPage({ page: 1, pageSize: 60, sort: 'recent' })
  const items = base.items
  const latest = items.slice(0, 12)
  const recent = items.filter((item) => item.badges?.some((badge) => badge.key === 'new')).slice(0, 8)
  const reduced = items.filter((item) => item.badges?.some((badge) => badge.key === 'price_drop')).slice(0, 8)
  const opportunities = items.filter((item) => item.badges?.some((badge) => badge.key === 'opportunity')).slice(0, 8)
  const belowFipe = items.filter((item) => item.badges?.some((badge) => badge.key === 'below_fipe')).slice(0, 8)
  const featured = opportunities[0] || reduced[0] || recent[0] || latest[0] || null

  return {
    latest,
    recent,
    reduced,
    opportunities,
    belowFipe,
    featured,
  }
}

export async function getListingVehicleId(listingId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('vehicle_listings')
    .select('vehicle_id')
    .eq('id', listingId)
    .maybeSingle()

  if (error || !data) return null
  return (data as { vehicle_id?: string | null }).vehicle_id || null
}
