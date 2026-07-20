import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const { listingId } = await params
    const supabase = getSupabaseServerClient()

    // Get client IP hash for dedup (optional)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ipHash = Buffer.from(ip).toString('base64').substring(0, 16)

    // Increment view count atomically
    const { error } = await supabase.rpc('increment_listing_views', {
      listing_uuid: listingId,
    })

    if (error) {
      // Fallback: direct update if RPC not available
      const { error: updateError } = await supabase
        .from('vehicle_listings')
        .update({ view_count: 1 })
        .eq('id', listingId)

      if (updateError) {
        console.error('View count update failed:', updateError)
      }
    }

    // Log detailed view (non-blocking)
    supabase
      .from('listing_views')
      .insert({
        listing_id: listingId,
        ip_hash: ipHash,
        user_agent: req.headers.get('user-agent')?.substring(0, 255) || null,
      })
      .then(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/views failed', error)
    return NextResponse.json({ ok: true }) // Don't fail the page load
  }
}
