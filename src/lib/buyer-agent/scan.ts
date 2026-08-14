import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { evaluateMatch, levelAtLeast, explanationNotes } from './match'
import { buildExplanation } from './explain'
import { criteriaSchema, BuyerSearchRow, MatchLevel } from './types'
import { sendMatchEmail } from './email'

interface ScanListing {
  id: string
  slug: string
  brand: string
  model: string
  version: string | null
  year: number
  year_model: number
  mileage: number
  price: number
  transmission: string | null
  fuel: string | null
  body_type: string | null
  city: string
  state: string
  optional_items?: string[]
  fipe_difference_percent?: number | null
  images?: Array<{ public_url: string }> | null
  published_at: string | null
  updated_at: string
}

export interface ScanResult {
  scannedSearches: number
  scannedListings: number
  matchesCreated: number
  emailsSent: number
  notificationsCreated: number
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export async function runBuyerMatchScan(opts?: { windowMinutes?: number; limitListings?: number }): Promise<ScanResult> {
  const result: ScanResult = { scannedSearches: 0, scannedListings: 0, matchesCreated: 0, emailsSent: 0, notificationsCreated: 0 }

  if (!isSupabaseConfigured()) return result
  const admin = getSupabaseAdminClient()
  if (!admin) return result

  const windowMinutes = opts?.windowMinutes ?? 25
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  // 1. Load active searches
  const { data: searches, error: searchError } = await admin
    .from('buyer_searches')
    .select('*')
    .eq('status', 'active')
    .limit(300)

  if (searchError || !searches) {
    console.error('scan: falha ao carregar buscas ativas', searchError?.message)
    return result
  }
  result.scannedSearches = searches.length

  // 2. Load listings published or updated in the window
  const { data: listings, error: listingError } = await admin
    .from('vehicle_listings')
    .select(`
      id, slug, brand, model, version, year_model, mileage, price, transmission, fuel,
      body_type, city, state, optional_items, fipe_difference_percent, published_at, updated_at,
      images:vehicle_listing_images(public_url)
    `)
    .eq('status', 'active')
    .or(`published_at.gte.${since},updated_at.gte.${since}`)
    .order('updated_at', { ascending: false })
    .limit(opts?.limitListings ?? 50)

  if (listingError || !listings) {
    console.error('scan: falha ao carregar anúncios', listingError?.message)
    return result
  }
  result.scannedListings = listings.length

  // 3. For each listing x search, evaluate and insert matches
  for (const listing of listings as ScanListing[]) {
    const listingId = listing.id
    const listingForMatch = normalizeListingForMatch(listing)

    for (const searchRow of searches as Array<Record<string, unknown>>) {
      const searchId = String(searchRow.id)
      const viewToken = String(searchRow.view_token)
      const contactEmail = String(searchRow.contact_email || '')
      const userId = (searchRow.user_id as string) || null
      const floor = (searchRow.match_level_min as MatchLevel) || 'possivel'

      const parsed = criteriaSchema.safeParse(searchRow.criteria)
      if (!parsed.success) continue

      const evaluation = evaluateMatch(parsed.data, listingForMatch)
      if (!evaluation.compatible || !levelAtLeast(evaluation.level, floor)) continue

      const notes = explanationNotes(listingForMatch, evaluation.criteriaMatched, evaluation.deviation, evaluation.level)
      const explanation = buildExplanation(evaluation.level, evaluation.criteriaMatched, evaluation.deviation, notes)

      // Insert (idempotent)
      const { data: inserted, error: insertError } = await admin
        .from('search_matches')
        .insert({
          search_id: searchId,
          listing_id: listingId,
          match_level: evaluation.level,
          score: evaluation.score,
          criteria_matched: evaluation.criteriaMatched,
          deviation: evaluation.deviation,
          explanation,
          notified_email: false,
          in_app_read: false,
        })
        .select('id, notified_email')
        .maybeSingle()

      if (insertError) {
        if (!insertError.message.includes('duplicate')) {
          console.error('scan: erro ao inserir match', insertError.message)
        }
        continue
      }

      if (!inserted) {
        // Duplicate — skip delivery
        continue
      }

      result.matchesCreated++
      await admin.from('buyer_searches').update({ matched_count: Number(searchRow.matched_count || 0) + 1 }).eq('id', searchId)

      // Delivery: email + in-app notification (when logged in)
      const isNew = true
      if (isNew) {
        const tokenUrl = `${SITE_URL}/procurar-meu-carro/busca?t=${viewToken}`

        if (contactEmail && insert_email_ok(contactEmail)) {
          const emailResult = await sendMatchEmail({
            to: contactEmail,
            criteria: parsed.data,
            summary: '(busca salva)',
            match: {
              match_level: evaluation.level,
              explanation,
              created_at: new Date().toISOString(),
              listing: {
                slug: listing.slug,
                brand: listing.brand,
                model: listing.model,
                version: listing.version,
                year_model: listing.year_model,
                price: listing.price,
                mileage: listing.mileage,
                city: listing.city,
                state: listing.state,
                transmission: listing.transmission,
                fuel: listing.fuel,
              },
            },
            viewTokenUrl: tokenUrl,
          })
          if (emailResult.success) {
            result.emailsSent++
            await admin
              .from('search_matches')
              .update({ notified_email: true, notified_at: new Date().toISOString() })
              .eq('id', (inserted as { id: string }).id)
          }
        }

        if (userId) {
          const { error: notifError } = await admin.from('notifications').insert({
            user_id: userId,
            type: 'buyer_match',
            title: `Encontramos um carro parecido: ${listing.brand} ${listing.model}`,
            body: `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(listing.price))} · ${listing.city}${listing.state ? '/' + listing.state : ''}`,
            link: `/procurar-meu-carro/busca?t=${viewToken}`,
          })
          if (!notifError) result.notificationsCreated++
        }
      }

      result.scannedSearches += 0 // keep count accurate — see scannedSearches above
    }
  }

  return result
}

function insert_email_ok(email: string): boolean {
  return email.length > 5 && email.includes('@') && email !== 'sem-email@carbi.com.br'
}

function normalizeListingForMatch(listing: ScanListing) {
  return {
    id: listing.id,
    slug: listing.slug,
    brand: listing.brand,
    model: listing.model,
    version: listing.version,
    year: listing.year_model,
    year_model: listing.year_model,
    mileage: listing.mileage,
    price: Number(listing.price),
    transmission: listing.transmission || '',
    fuel: listing.fuel || '',
    body_type: listing.body_type || '',
    city: listing.city || '',
    state: listing.state || '',
    optional_items: listing.optional_items || [],
    fipe_difference_percent: listing.fipe_difference_percent ?? null,
    title: `${listing.brand} ${listing.model}`,
    description: '',
    vehicle_type: 'car' as const,
    status: 'active' as const,
    color: '',
    engine: null,
    horsepower: null,
    plate_final: null,
    doors: null,
    fipe_price: null,
    fipe_difference_value: null,
    fipe_reference_month: null,
    published_at: listing.published_at,
    created_at: listing.published_at || listing.updated_at,
    updated_at: listing.updated_at,
    user_id: '',
    images: [],
  }
}