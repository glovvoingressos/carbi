import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { CreateOfferPayload, validateOfferPayload } from '@/lib/offers'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Você precisa estar logado para fazer uma oferta.' }, { status: 401 })
    }

    const body = (await req.json()) as CreateOfferPayload
    const errors = validateOfferPayload(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], details: errors }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id, status, accepts_offers, price')
      .eq('id', body.listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
    }

    if (listing.user_id === auth.userId) {
      return NextResponse.json({ error: 'Você não pode fazer uma oferta no seu próprio anúncio.' }, { status: 400 })
    }

    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Este anúncio não está mais ativo.' }, { status: 400 })
    }

    if (listing.accepts_offers === false) {
      return NextResponse.json({ error: 'Este vendedor não está aceitando ofertas no momento.' }, { status: 400 })
    }

    const { data: existingPending, error: pendingError } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', body.listing_id)
      .eq('buyer_user_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (!pendingError && existingPending) {
      return NextResponse.json({ error: 'Você já tem uma oferta pendente para este anúncio. Aguarde a resposta do vendedor.' }, { status: 400 })
    }

    const { data: existingCountered, error: counteredError } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', body.listing_id)
      .eq('buyer_user_id', auth.userId)
      .eq('status', 'countered')
      .maybeSingle()

    if (!counteredError && existingCountered) {
      return NextResponse.json({ error: 'O vendedor já enviou uma contraproposta para você. Verifique suas ofertas.' }, { status: 400 })
    }

    const { data: offer, error: insertError } = await supabase
      .from('offers')
      .insert({
        listing_id: body.listing_id,
        buyer_user_id: auth.userId,
        seller_user_id: listing.user_id,
        amount: body.amount,
        payment_method: body.payment_method,
        message: body.message || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Erro ao criar oferta. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('[OFFERS_POST]', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const listingId = req.nextUrl.searchParams.get('listingId')
    const role = req.nextUrl.searchParams.get('role')

    let query = supabase
      .from('offers')
      .select('*, buyer:buyer_user_id(id, email), seller:seller_user_id(id, email)')
      .order('created_at', { ascending: false })

    if (listingId) {
      query = query.eq('listing_id', listingId)
      const { data: listing } = await supabase
        .from('vehicle_listings')
        .select('user_id')
        .eq('id', listingId)
        .single()

      if (listing && listing.user_id !== auth.userId) {
        query = query.eq('buyer_user_id', auth.userId)
      }
    } else if (role === 'seller') {
      query = query.eq('seller_user_id', auth.userId)
    } else {
      query = query.or(`buyer_user_id.eq.${auth.userId},seller_user_id.eq.${auth.userId}`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar ofertas.' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[OFFERS_GET]', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
