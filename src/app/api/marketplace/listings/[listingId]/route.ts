import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

type ListingPatchPayload = {
  title?: string
  description?: string
  price?: number
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { listingId } = await params
    const body = (await req.json()) as ListingPatchPayload

    const updates: Record<string, unknown> = {}
    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (title.length < 8) {
        return NextResponse.json({ error: 'Título deve ter no mínimo 8 caracteres.' }, { status: 400 })
      }
      updates.title = title
    }
    if (typeof body.description === 'string') {
      const description = body.description.trim()
      if (description.length < 20) {
        return NextResponse.json({ error: 'Descrição deve ter no mínimo 20 caracteres.' }, { status: 400 })
      }
      updates.description = description
    }
    if (typeof body.price === 'number') {
      if (!Number.isFinite(body.price) || body.price <= 0) {
        return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 })
      }
      updates.price = body.price
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    if (listing.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Sem permissão para editar este anúncio.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('vehicle_listings')
      .update(updates)
      .eq('id', listingId)
      .select('id, slug, title, description, price, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/marketplace/listings/[listingId] failed', error)
    return NextResponse.json({ error: 'Falha ao atualizar anúncio.' }, { status: 500 })
  }
}
