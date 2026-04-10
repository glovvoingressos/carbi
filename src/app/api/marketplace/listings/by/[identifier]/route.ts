import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const { identifier } = await params
    const supabase = getSupabaseServerClient()

    const baseQuery = supabase
      .from('vehicle_listings_public')
      .select('*')
      .limit(1)

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    const { data, error } = await (isUuid
      ? baseQuery.eq('id', identifier).single()
      : baseQuery.eq('slug', identifier).single())

    if (error || !data) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/marketplace/listings/[identifier] failed', error)
    return NextResponse.json({ error: 'Falha ao carregar anúncio.' }, { status: 500 })
  }
}
