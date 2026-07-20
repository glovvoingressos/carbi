import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Admin não configurado.' }, { status: 503 })

  const { data, error } = await supabase.rpc('get_top_listings_by_views', { p_limit: 10 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data || [])
}
