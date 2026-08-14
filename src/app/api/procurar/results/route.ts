import { NextRequest, NextResponse } from 'next/server'
import { findCandidates } from '@/lib/buyer-agent/candidates'
import { criteriaSchema, MatchLevel } from '@/lib/buyer-agent/types'
import { isSupabaseConfigured } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { criteria?: unknown; floor?: MatchLevel }
  try {
    body = (await req.json()) as { criteria?: unknown; floor?: MatchLevel }
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], total: 0, configured: false })
  }

  const parsed = criteriaSchema.safeParse(body?.criteria)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Critérios inválidos.' }, { status: 400 })
  }

  const candidates = await findCandidates(parsed.data, { floor: body?.floor || 'possivel' })

  const items = candidates.map((c) => ({
    slug: c.listing.slug,
    id: c.listing.id,
    brand: c.listing.brand,
    model: c.listing.model,
    version: c.listing.version,
    year_model: c.listing.year_model,
    price: c.listing.price,
    mileage: c.listing.mileage,
    city: c.listing.city,
    state: c.listing.state,
    transmission: c.listing.transmission,
    fuel: c.listing.fuel,
    body_type: c.listing.body_type,
    image: c.listing.images?.[0]?.url || null,
    level: c.level,
    score: c.score,
    explanation: c.explanation,
  }))

  return NextResponse.json({ items, total: items.length })
}