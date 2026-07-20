import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  const client = getSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { listingIds, updates } = body

  if (!listingIds?.length || !updates) {
    return NextResponse.json({ error: 'Missing listingIds or updates' }, { status: 400 })
  }

  // Verify ownership
  const { data: owned } = await client
    .from('vehicle_listings')
    .select('id')
    .in('id', listingIds)
    .eq('user_id', user.id)

  const ownedIds = (owned || []).map((r: any) => r.id)
  if (ownedIds.length === 0) return NextResponse.json({ updated: 0 })

  const { count, error } = await client
    .from('vehicle_listings')
    .update(updates)
    .in('id', ownedIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: count || 0 })
}

export async function DELETE(request: NextRequest) {
  const client = getSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingIds } = await request.json()
  if (!listingIds?.length) return NextResponse.json({ error: 'Missing listingIds' }, { status: 400 })

  const { data: owned } = await client
    .from('vehicle_listings')
    .select('id')
    .in('id', listingIds)
    .eq('user_id', user.id)

  const ownedIds = (owned || []).map((r: any) => r.id)
  if (ownedIds.length === 0) return NextResponse.json({ deleted: 0 })

  const { count, error } = await client
    .from('vehicle_listings')
    .delete()
    .in('id', ownedIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: count || 0 })
}
