import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const { data, error } = await supabase
      .from('vehicle_listings')
      .select(`
        id,
        slug,
        title,
        description,
        brand,
        model,
        version,
        year,
        year_model,
        mileage,
        price,
        transmission,
        fuel,
        color,
        body_type,
        city,
        state,
        status,
        published_at,
        created_at,
        updated_at,
        images:vehicle_listing_images(
          id,
          public_url,
          storage_path,
          sort_order,
          is_primary
        )
      `)
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/marketplace/my-listings failed', error)
    return NextResponse.json({ error: 'Falha ao carregar seus anúncios.' }, { status: 500 })
  }
}
