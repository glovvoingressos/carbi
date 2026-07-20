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

    // Get client IP hash for dedup
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ipHash = Buffer.from(ip).toString('base64').substring(0, 16)

    // Dedup: skip if same IP viewed this listing in last 30 minutes
    const { data: isRecent } = await supabase.rpc('recent_listing_view', {
      p_listing_id: listingId,
      p_ip_hash: ipHash,
      p_window_minutes: 30,
    })

    if (!isRecent) {
      // Increment view count atomically
      const { error } = await supabase.rpc('increment_listing_views', {
        listing_uuid: listingId,
      })

      if (error) {
        console.error('increment_listing_views RPC failed:', error)
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
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/views failed', error)
    return NextResponse.json({ ok: true })
  }
}
