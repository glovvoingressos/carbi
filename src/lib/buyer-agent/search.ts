import { getSupabaseAdminClient, getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { CarCriteria, MatchLevel, SearchMatchRow, BuyerSearchRow } from './types'
import { criteriaSchema } from './types'

function getAdminClient() {
  const client = getSupabaseAdminClient()
  if (!client) throw new Error('Supabase admin não configurado.')
  return client
}

export interface SaveSearchInput {
  user_id?: string | null
  contact_email?: string | null
  original_query: string
  criteria: CarCriteria
  interpretation_source: 'rules' | 'llm'
}

export async function createBuyerSearch(input: SaveSearchInput): Promise<BuyerSearchRow | null> {
  if (!isSupabaseConfigured()) return null
  const client = getAdminClient()
  if (!client) return null
  const { data, error } = await client
    .from('buyer_searches')
    .insert({
      user_id: input.user_id || null,
      contact_email: input.contact_email || null,
      original_query: input.original_query,
      criteria: criteriaSchema.parse(input.criteria),
      interpretation_source: input.interpretation_source,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('createBuyerSearch error:', error?.message, error?.details)
    return null
  }
  return data as unknown as BuyerSearchRow
}

export async function getBuyerSearchByToken(token: string): Promise<BuyerSearchRow | null> {
  if (!isSupabaseConfigured()) return null
  const client = getAdminClient()
  if (!client) return null
  const { data, error } = await client
    .from('buyer_searches')
    .select('*')
    .eq('view_token', token)
    .single()
  if (error || !data) return null
  return data as unknown as BuyerSearchRow
}

export async function listSearchesForUser(userId: string): Promise<BuyerSearchRow[]> {
  if (!isSupabaseConfigured()) return []
  const client = getSupabaseServerClient()
  const { data, error } = await client
    .from('buyer_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return (data as unknown as BuyerSearchRow[])
}

export async function getSearchById(id: string): Promise<BuyerSearchRow | null> {
  if (!isSupabaseConfigured()) return null
  const client = getAdminClient()
  const { data, error } = await client
    .from('buyer_searches')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as unknown as BuyerSearchRow
}

export async function listMatchesForSearch(searchId: string): Promise<SearchMatchRow[]> {
  if (!isSupabaseConfigured()) return []
  const client = getAdminClient()
  const { data, error } = await client
    .from('search_matches')
    .select(`
      id,
      search_id,
      listing_id,
      match_level,
      score,
      criteria_matched,
      deviation,
      explanation,
      notified_email,
      in_app_read,
      created_at,
      listing:vehicle_listings(
        slug,
        brand,
        model,
        version,
        year_model,
        price,
        mileage,
        city,
        state,
        transmission,
        fuel,
        images:vehicle_listing_images(public_url)
      )
    `)
    .eq('search_id', searchId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return normalizeMatches(data as unknown as Record<string, unknown>[])
}

function normalizeMatches(rows: Record<string, unknown>[]): SearchMatchRow[] {
  return rows.map((row) => ({
    id: row.id as string,
    search_id: row.search_id as string,
    listing_id: row.listing_id as string,
    match_level: row.match_level as MatchLevel,
    score: typeof row.score === 'string' ? Number(row.score) : (row.score as number),
    criteria_matched: (row.criteria_matched as string[]) || [],
    deviation: (row.deviation as SearchMatchRow['deviation']) || [],
    explanation: (row.explanation as string) || null,
    notified_email: Boolean(row.notified_email),
    in_app_read: Boolean(row.in_app_read),
    created_at: row.created_at as string,
    listing: normalizeListing(row.listing),
  }))
}

function normalizeListing(listing: unknown): SearchMatchRow['listing'] {
  if (!listing || typeof listing !== 'object') return null
  const l = listing as Record<string, unknown>
  const first = Array.isArray(l) ? l[0] : l
  if (!first || typeof first !== 'object') return null
  const f = first as Record<string, unknown>
  const images = Array.isArray(f.images) ? f.images : []
  const firstImage = (images[0] as { public_url?: string } | undefined)?.public_url || null
  return {
    slug: f.slug as string,
    brand: f.brand as string,
    model: f.model as string,
    version: (f.version as string) || null,
    year_model: f.year_model as number,
    price: f.price as number,
    mileage: f.mileage as number | null,
    city: f.city as string,
    state: f.state as string,
    transmission: (f.transmission as string) || null,
    fuel: (f.fuel as string) || null,
    image: firstImage,
  }
}

export async function resetMatchRead(searchId: string, matchId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const client = getAdminClient()
  const { error } = await client
    .from('search_matches')
    .update({ in_app_read: true })
    .eq('id', matchId)
    .eq('search_id', searchId)
  return !error
}

export async function markMatchRead(matchId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const client = getAdminClient()
  const { error } = await client
    .from('search_matches')
    .update({ in_app_read: true })
    .eq('id', matchId)
  return !error
}

export async function getUnreadMatchCount(searchId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const client = getAdminClient()
  const { count, error } = await client
    .from('search_matches')
    .select('id', { count: 'exact', head: true })
    .eq('search_id', searchId)
    .eq('in_app_read', false)
  if (error) return 0
  return count || 0
}