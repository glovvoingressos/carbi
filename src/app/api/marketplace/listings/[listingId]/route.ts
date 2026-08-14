import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { runAutoDevSync } from '@/lib/integrations/autoDev/service'
import { sendListingDeletedEmail, sendListingStatusChangedEmail } from '@/lib/email'
import { buildListingRollbackPayload, resolveTruckPatch } from '@/lib/marketplace'
import type { TruckCategory } from '@/lib/trucks'

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
  vehicle_type?: 'car' | 'truck'
  truck_type?: string | null
  load_capacity?: number | null
  axles?: number | null
  truck_body_type?: string | null
  cabin_type?: string | null
  pbt?: number | null
  cmt?: number | null
  truck_category?: TruckCategory | null
  structured_data?: Record<string, unknown>
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
    if (typeof body.mileage === 'number') {
      if (!Number.isInteger(body.mileage) || body.mileage < 0) return NextResponse.json({ error: 'Quilometragem inválida.' }, { status: 400 })
      updates.mileage = body.mileage
    }
    if (typeof body.brand === 'string') updates.brand = body.brand
    if (typeof body.model === 'string') updates.model = body.model
    if (typeof body.version === 'string') updates.version = body.version
    if (typeof body.year === 'number') {
      if (!Number.isInteger(body.year) || body.year < 1950 || body.year > 2100) return NextResponse.json({ error: 'Ano inválido.' }, { status: 400 })
      updates.year = body.year
    }
    if (typeof body.year_model === 'number') {
      if (!Number.isInteger(body.year_model) || body.year_model < 1950 || body.year_model > 2100) return NextResponse.json({ error: 'Ano/modelo inválido.' }, { status: 400 })
      updates.year_model = body.year_model
    }
    if (typeof body.transmission === 'string') updates.transmission = body.transmission
    if (typeof body.fuel === 'string') updates.fuel = body.fuel
    if (typeof body.color === 'string') updates.color = body.color
    if (typeof body.body_type === 'string') updates.body_type = body.body_type
    if (typeof body.city === 'string') updates.city = body.city
    if (typeof body.state === 'string') {
      const state = body.state.trim().toUpperCase()
      if (!/^[A-Z]{2}$/.test(state)) return NextResponse.json({ error: 'Estado deve conter 2 letras.' }, { status: 400 })
      updates.state = state
    }
    if (Array.isArray(body.optional_items)) updates.optional_items = body.optional_items
    if (typeof body.engine === 'string') updates.engine = body.engine
    if (typeof body.horsepower === 'number') {
      if (!Number.isInteger(body.horsepower) || body.horsepower < 0) return NextResponse.json({ error: 'Potência inválida.' }, { status: 400 })
      updates.horsepower = body.horsepower
    }
    if (typeof body.plate_final === 'string') updates.plate_final = body.plate_final.substring(0, 1)
    if (typeof body.doors === 'number') {
      if (!Number.isInteger(body.doors) || body.doors < 1 || body.doors > 20) return NextResponse.json({ error: 'Portas inválidas.' }, { status: 400 })
      updates.doors = body.doors
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    
    // Fetch current state to check for changes
    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    if (listing.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Sem permissão para editar este anúncio.' }, { status: 403 })
    }

    const truckPatch = resolveTruckPatch(body, listing.vehicle_type)
    if (truckPatch.error) return NextResponse.json({ error: truckPatch.error }, { status: 400 })
    Object.assign(updates, truckPatch.updates)

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

    if (listing.vehicle_id) {
      const vehicleUpdates: Record<string, unknown> = {}
      const vehicleFields = ['brand', 'model', 'version', 'year', 'year_model', 'transmission', 'fuel', 'color', 'body_type', 'engine', 'horsepower', 'doors', 'mileage', 'vin']
      for (const field of vehicleFields) {
        if (field in updates) vehicleUpdates[field] = updates[field]
      }
      if ('structured_data' in updates) vehicleUpdates.technical_data = updates.structured_data
      if (Object.keys(vehicleUpdates).length > 0) {
        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update(vehicleUpdates)
          .eq('id', listing.vehicle_id)

        if (vehicleUpdateError) {
          const rollbackPayload = buildListingRollbackPayload(listing as Record<string, unknown>, updates)
          const { error: rollbackError } = await supabase
            .from('vehicle_listings')
            .update(rollbackPayload)
            .eq('id', listingId)

          if (rollbackError) {
            console.error('Falha ao reverter anúncio após erro de sincronização', {
              listingId,
              rollbackError: rollbackError.message,
            })
          }

          console.error('Falha ao sincronizar veículo relacionado', {
            listingId,
            vehicleUpdateError: vehicleUpdateError.message,
          })
          return NextResponse.json({ error: 'Falha ao sincronizar o veículo relacionado.' }, { status: 500 })
        }
      }

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

          let userEmail = userProfile?.email || ''
          let userName = userProfile?.full_name || 'Anunciante'

          if (!userEmail) {
            const { data: authUser } = await supabase.auth.getUser(auth.accessToken)
            userEmail = authUser?.user?.email || ''
            if (!userName && authUser?.user?.user_metadata?.full_name) {
              userName = authUser.user.user_metadata.full_name
            }
          }

          if (userEmail) {
            await sendListingStatusChangedEmail({
              userEmail,
              userName,
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
          .maybeSingle()

        let userEmail = userProfile?.email || ''
        let userName = userProfile?.full_name || 'Anunciante'

        if (!userEmail) {
          const { data: authUser } = await supabase.auth.getUser(auth.accessToken)
          userEmail = authUser?.user?.email || ''
          if (!userName && authUser?.user?.user_metadata?.full_name) {
            userName = authUser.user.user_metadata.full_name
          }
        }

        if (userEmail) {
          await sendListingDeletedEmail({
            userEmail,
            userName,
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
