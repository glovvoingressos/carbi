import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase-server'
import { queryPublicListings } from '@/lib/marketplace-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const { identifier } = await params
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    const data = await queryPublicListings({
      single: true,
      limit: 1,
      id: isUuid ? identifier : undefined,
      slug: isUuid ? undefined : identifier,
    })

    if (!data[0]) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('GET /api/marketplace/listings/[identifier] failed', error)
    return NextResponse.json({ error: 'Falha ao carregar anúncio.' }, { status: 500 })
  }
}
