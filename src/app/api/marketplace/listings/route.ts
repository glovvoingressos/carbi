import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { ListingFormPayload, validateListingPayload } from '@/lib/marketplace'
import { queryPublicListings } from '@/lib/marketplace-server'

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

    const limit = Math.min(Number(limitParam || '8') || 8, 20)

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

    const vehiclePayload = {
      owner_user_id: auth.userId,
      brand: payload.brand.trim(),
      model: payload.model.trim(),
      version: payload.version?.trim() || null,
      year: payload.year,
      year_model: payload.year_model,
      transmission: payload.transmission.trim(),
      fuel: payload.fuel.trim(),
      color: payload.color.trim(),
      body_type: payload.body_type.trim(),
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
      title: payload.title.trim(),
      description: payload.description.trim(),
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
      body_type: payload.body_type.trim(),
      city: payload.city.trim(),
      state: payload.state.trim().toUpperCase(),
      optional_items: payload.optional_items || [],
      engine: payload.engine?.trim() || null,
      horsepower: payload.horsepower || null,
      plate_final: payload.plate_final?.trim() || null,
      doors: payload.doors || null,
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

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/marketplace/listings failed', error)
    return NextResponse.json({ error: 'Falha ao criar anúncio.' }, { status: 500 })
  }
}
