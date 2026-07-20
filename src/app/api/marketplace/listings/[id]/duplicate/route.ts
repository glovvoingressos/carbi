import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const client = getSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: original } = await client
    .from('vehicle_listings')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!original) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  const { id: _, created_at, updated_at, view_count, slug, ...rest } = original
  const duplicate = {
    ...rest,
    ...body,
    user_id: user.id,
    status: 'active',
    view_count: 0,
    title: `${rest.brand} ${rest.model} ${body.year_model || rest.year_model}`,
  }

  const { data: newListing, error } = await client
    .from('vehicle_listings')
    .insert(duplicate)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ listing: newListing })
}
