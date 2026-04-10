import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { runAutoDevSync } from '@/lib/integrations/autoDev/service'

type ListingPatchPayload = {
  title?: string
  description?: string
  price?: number
  status?: 'active' | 'sold' | 'paused' | 'archived'
  vin?: string
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
    if (typeof body.status === 'string') {
      const allowedStatus = new Set(['active', 'sold', 'paused', 'archived'])
      if (!allowedStatus.has(body.status)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
      }
      updates.status = body.status
      updates.published_at = body.status === 'active' ? new Date().toISOString() : null
    }
    if (typeof body.vin === 'string') {
      const vin = body.vin.trim().toUpperCase()
      if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        return NextResponse.json({ error: 'VIN inválido. Use 17 caracteres válidos.' }, { status: 400 })
      }
      updates.vin = vin || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id, vehicle_id')
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
      .select('id, slug, title, description, price, status, updated_at, vin')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (typeof updates.vin !== 'undefined' && listing.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({ vin: updates.vin as string | null })
        .eq('id', listing.vehicle_id)

      if (typeof updates.vin === 'string' && updates.vin.length === 17) {
        await runAutoDevSync({
          vehicleId: listing.vehicle_id,
          requesterId: auth.userId,
          accessToken: auth.accessToken,
          vinOverride: updates.vin,
          force: true,
        })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/marketplace/listings/[listingId] failed', error)
    return NextResponse.json({ error: 'Falha ao atualizar anúncio.' }, { status: 500 })
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Sem permissão para excluir este anúncio.' }, { status: 403 })
    }

    const { data: imageRows } = await supabase
      .from('vehicle_listing_images')
      .select('storage_path')
      .eq('listing_id', listingId)

    const storagePaths = (imageRows || []).map((row) => row.storage_path).filter(Boolean)
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from('vehicle-listings').remove(storagePaths)
      if (storageError) {
        return NextResponse.json({ error: storageError.message }, { status: 500 })
      }
    }

    const { error } = await supabase.from('vehicle_listings').delete().eq('id', listingId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/marketplace/listings/[listingId] failed', error)
    return NextResponse.json({ error: 'Falha ao excluir anúncio.' }, { status: 500 })
  }
}
