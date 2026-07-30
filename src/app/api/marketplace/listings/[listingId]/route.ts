import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { runAutoDevSync } from '@/lib/integrations/autoDev/service'
import { sendListingDeletedEmail, sendListingStatusChangedEmail } from '@/lib/email'

type ListingPatchPayload = {
  title?: string
  description?: string
  price?: number
  status?: 'active' | 'sold' | 'paused' | 'archived'
  vin?: string
  mileage?: number
  brand?: string
  model?: string
  version?: string
  year?: number
  year_model?: number
  transmission?: string
  fuel?: string
  color?: string
  body_type?: string
  city?: string
  state?: string
  optional_items?: string[]
  engine?: string
  horsepower?: number
  plate_final?: string
  doors?: number
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
    
    // Basic fields with validation
    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (title.length < 8) return NextResponse.json({ error: 'Título deve ter no mínimo 8 caracteres.' }, { status: 400 })
      updates.title = title
    }
    if (typeof body.description === 'string') {
      const description = body.description.trim()
      if (description.length < 20) return NextResponse.json({ error: 'Descrição deve ter no mínimo 20 caracteres.' }, { status: 400 })
      updates.description = description
    }
    if (typeof body.price === 'number') {
      if (!Number.isFinite(body.price) || body.price <= 0) return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 })
      updates.price = body.price
    }
    if (typeof body.vin === 'string') {
      const vin = body.vin.trim().toUpperCase()
      if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return NextResponse.json({ error: 'VIN inválido.' }, { status: 400 })
      updates.vin = vin || null
    }

    // Additional fields
    if (typeof body.mileage === 'number') updates.mileage = body.mileage
    if (typeof body.brand === 'string') updates.brand = body.brand
    if (typeof body.model === 'string') updates.model = body.model
    if (typeof body.version === 'string') updates.version = body.version
    if (typeof body.year === 'number') updates.year = body.year
    if (typeof body.year_model === 'number') updates.year_model = body.year_model
    if (typeof body.transmission === 'string') updates.transmission = body.transmission
    if (typeof body.fuel === 'string') updates.fuel = body.fuel
    if (typeof body.color === 'string') updates.color = body.color
    if (typeof body.body_type === 'string') updates.body_type = body.body_type
    if (typeof body.city === 'string') updates.city = body.city
    if (typeof body.state === 'string') updates.state = body.state.substring(0, 2)
    if (Array.isArray(body.optional_items)) updates.optional_items = body.optional_items
    if (typeof body.engine === 'string') updates.engine = body.engine
    if (typeof body.horsepower === 'number') updates.horsepower = body.horsepower
    if (typeof body.plate_final === 'string') updates.plate_final = body.plate_final.substring(0, 1)
    if (typeof body.doors === 'number') updates.doors = body.doors

    const supabase = getSupabaseServerClient(auth.accessToken)
    
    // Fetch current state to check for changes
    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id, vehicle_id, status, published_at')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    if (listing.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Sem permissão para editar este anúncio.' }, { status: 403 })
    }

    // Handle status transition for published_at
    if (typeof body.status === 'string') {
      const allowedStatus = new Set(['active', 'sold', 'paused', 'archived'])
      if (!allowedStatus.has(body.status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
      
      updates.status = body.status
      // Only set published_at if transitioning TO active and it wasn't published before
      if (body.status === 'active' && !listing.published_at) {
        updates.published_at = new Date().toISOString()
      } else if (body.status !== 'active') {
        updates.published_at = null
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vehicle_listings')
      .update(updates)
      .eq('id', listingId)
      .select('*')
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

    if (typeof updates.status === 'string') {
      ;(async () => {
        try {
          const { data: userProfile } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', auth.userId)
            .maybeSingle()

          if (userProfile?.email) {
            await sendListingStatusChangedEmail({
              userEmail: userProfile.email,
              userName: userProfile.full_name || 'Anunciante',
              vehicleTitle: data.title || 'Veículo',
              newStatus: updates.status as 'active' | 'sold' | 'paused' | 'archived',
              listingSlug: data.slug || listingId,
            })
          }
        } catch (emailErr) {
          console.error('Falha ao enviar e-mail de mudança de status:', emailErr)
        }
      })()
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
      .select('id, user_id, title')
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

    // Processamento assíncrono para enviar notificação de exclusão de anúncio por e-mail
    ;(async () => {
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', auth.userId)
          .single()

        if (userProfile?.email) {
          await sendListingDeletedEmail({
            userEmail: userProfile.email,
            userName: userProfile.full_name || 'Anunciante',
            vehicleTitle: listing.title || 'Veículo'
          })
        }
      } catch (emailErr) {
        console.error('Falha ao enviar e-mail de exclusão de anúncio:', emailErr)
      }
    })()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/marketplace/listings/[listingId] failed', error)
    return NextResponse.json({ error: 'Falha ao excluir anúncio.' }, { status: 500 })
  }
}
