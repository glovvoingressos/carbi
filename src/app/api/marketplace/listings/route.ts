import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { ListingFormPayload, validateListingPayload } from '@/lib/marketplace'
import { queryPublicListings } from '@/lib/marketplace-server'
import { runAutoDevSync } from '@/lib/integrations/autoDev/service'
import { sendListingCreatedEmail, sendAdminNewListingEmail } from '@/lib/email'
import { notifyListingPublished } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const brand = req.nextUrl.searchParams.get('brand')
    const model = req.nextUrl.searchParams.get('model')
    const q = (req.nextUrl.searchParams.get('q') || '').trim()
    const yearModel = req.nextUrl.searchParams.get('yearModel')
    const limitParam = req.nextUrl.searchParams.get('limit')
    const excludeId = req.nextUrl.searchParams.get('excludeId')

    const limit = Math.min(Number(limitParam || '8') || 8, 48)

    const data = await queryPublicListings({
      brand: brand || undefined,
      model: model || undefined,
      q: q || undefined,
      yearModel: yearModel ? Number(yearModel) : undefined,
      excludeId: excludeId || undefined,
      limit,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/marketplace/listings failed', error)
    return NextResponse.json({ error: 'Falha ao carregar anúncios.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const payload = (await req.json()) as ListingFormPayload
    const validationErrors = validateListingPayload(payload)

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validationErrors }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const generatedTitle = `${payload.brand} ${payload.model} ${payload.year_model}${payload.version ? ` ${payload.version}` : ''}`
      .replace(/\s+/g, ' ')
      .trim()
    const resolvedTitle = payload.title?.trim() || generatedTitle
    const resolvedBodyType = payload.body_type?.trim() || 'Não informado'

    // Limite de anúncios grátis
    const { count: activeCount, error: countError } = await supabase
      .from('vehicle_listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('status', 'active')

    if (!countError && activeCount !== null && activeCount >= 5) {
      return NextResponse.json({ error: 'Você já atingiu o limite de 5 anúncios grátis. Remova ou arquive um anúncio antes de criar outro.' }, { status: 403 })
    }

    const vehiclePayload = {
      owner_user_id: auth.userId,
      brand: payload.brand.trim(),
      model: payload.model.trim(),
      version: payload.version?.trim() || null,
      trim: payload.version?.trim() || null,
      vin: payload.vin?.trim().toUpperCase() || null,
      year: payload.year,
      year_model: payload.year_model,
      transmission: payload.transmission.trim(),
      fuel: payload.fuel.trim(),
      color: payload.color.trim(),
      body_type: resolvedBodyType,
      engine: payload.engine?.trim() || null,
      horsepower: payload.horsepower || null,
      doors: payload.doors || null,
      mileage: payload.mileage,
      fipe_brand_code: payload.fipe_brand_code || null,
      fipe_model_code: payload.fipe_model_code || null,
      fipe_year_code: payload.fipe_year_code || null,
      fipe_reference_month: payload.fipe_reference_month || null,
      fipe_price: payload.fipe_price || null,
      technical_data: payload.structured_data || {},
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert(vehiclePayload)
      .select('id')
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: vehicleError?.message || 'Falha ao criar veículo.' }, { status: 500 })
    }

    const insertPayload = {
      user_id: auth.userId,
      vehicle_id: vehicle.id,
      title: resolvedTitle,
      description: payload.description?.trim() || '',
      brand: payload.brand.trim(),
      model: payload.model.trim(),
      version: payload.version?.trim() || null,
      year: payload.year,
      year_model: payload.year_model,
      mileage: payload.mileage,
      price: payload.price,
      transmission: payload.transmission.trim(),
      fuel: payload.fuel.trim(),
      color: payload.color.trim(),
      body_type: resolvedBodyType,
      city: payload.city.trim(),
      state: payload.state.trim().toUpperCase(),
      optional_items: payload.optional_items || [],
      engine: payload.engine?.trim() || null,
      horsepower: payload.horsepower || null,
      plate_final: payload.plate_final?.trim() || null,
      doors: payload.doors || null,
      vin: payload.vin?.trim().toUpperCase() || null,
      fipe_brand_code: payload.fipe_brand_code || null,
      fipe_model_code: payload.fipe_model_code || null,
      fipe_year_code: payload.fipe_year_code || null,
      fipe_reference_month: payload.fipe_reference_month || null,
      fipe_price: payload.fipe_price || null,
      structured_data: payload.structured_data || {},
      status: 'active',
    }

    const { data, error } = await supabase
      .from('vehicle_listings')
      .insert(insertPayload)
      .select('id, slug, created_at')
      .single()

    if (error) {
      await supabase.from('vehicles').delete().eq('id', vehicle.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Processamento síncrono para enviar confirmação de anúncio criado por e-mail
    const emailStatus: Record<string, unknown> = {
      resendKeyConfigured: Boolean(process.env.RESEND_API_KEY),
      listingSlug: data.slug,
    }

    try {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', auth.userId)
          .single()

        emailStatus.userProfileError = userProfileError?.message || null
        emailStatus.usersTableEmailFound = Boolean(userProfile?.email)

        let userEmail = userProfile?.email || ''
        let userName = userProfile?.full_name || 'Anunciante'

        if (!userEmail) {
          const { data: authUser, error: authUserError } = await supabase.auth.getUser(auth.accessToken)
          emailStatus.authUserError = authUserError?.message || null
          userEmail = authUser?.user?.email || ''
          if (!userName && authUser?.user?.user_metadata?.full_name) {
            userName = authUser.user.user_metadata.full_name
          }
        }

        emailStatus.userEmail = userEmail
        emailStatus.userName = userName

        console.log('[DEBUG-EMAIL] Attempting to send listing created email', {
          userId: auth.userId,
          userEmail,
          userName,
          hasResendKey: Boolean(process.env.RESEND_API_KEY),
          listingSlug: data.slug,
        })

        if (userEmail) {
          console.log('[DEBUG-EMAIL] Calling sendListingCreatedEmail', { userEmail })
          const createdResult = await sendListingCreatedEmail({
            userEmail,
            userName,
            vehicleTitle: resolvedTitle,
            price: payload.price,
            listingSlug: data.slug
          })
          console.log('[DEBUG-EMAIL] listing created email result', createdResult)
          emailStatus.userEmailSent = createdResult
        } else {
          console.warn('[DEBUG-EMAIL] listing created email skipped: userEmail is empty', {
            userId: auth.userId,
            userProfile,
          })
          emailStatus.userEmailSkipped = 'userEmail is empty'
        }

        const adminResult = await sendAdminNewListingEmail({
          vehicleTitle: resolvedTitle,
          brand: payload.brand,
          model: payload.model,
          year: payload.year,
          yearModel: payload.year_model,
          price: payload.price,
          city: payload.city,
          state: payload.state,
          sellerName: userName,
          listingSlug: data.slug
        })
        console.log('[email] admin new listing email result', adminResult)
        emailStatus.adminEmailSent = adminResult
    } catch (emailErr) {
        console.error('[email] listing created email failed', emailErr)
        emailStatus.error = emailErr instanceof Error ? emailErr.message : String(emailErr)
    }

    if (payload.vin) {
      const sync = await runAutoDevSync({
        vehicleId: vehicle.id,
        requesterId: auth.userId,
        accessToken: auth.accessToken,
        vinOverride: payload.vin,
        force: true,
      })

      if (!sync.success) {
        console.warn('Auto.dev sync failed after listing creation', {
          listingId: data.id,
          vehicleId: vehicle.id,
          errors: sync.errors,
        })
      }
    }

    return NextResponse.json({ ...data, vehicle_id: vehicle.id, emailStatus }, { status: 201 })
  } catch (error) {
    console.error('POST /api/marketplace/listings failed', error)
    return NextResponse.json({ error: 'Falha ao criar anúncio.' }, { status: 500 })
  }
}
