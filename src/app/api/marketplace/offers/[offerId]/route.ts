import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { CounterOfferPayload, validateCounterPayload } from '@/lib/offers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { offerId } = await params
    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: offer, error } = await supabase
      .from('offers')
      .select('*, buyer:buyer_user_id(id, email), seller:seller_user_id(id, email)')
      .eq('id', offerId)
      .single()

    if (error || !offer) {
      return NextResponse.json({ error: 'Oferta não encontrada.' }, { status: 404 })
    }

    if (offer.buyer_user_id !== auth.userId && offer.seller_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('[OFFER_GET]', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { offerId } = await params
    const body = await req.json()
    const { action } = body

    if (!action || !['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida. Use accept, reject ou counter.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Oferta não encontrada.' }, { status: 404 })
    }

    if (action === 'accept') {
      if (offer.seller_user_id === auth.userId && offer.status !== 'pending') {
        return NextResponse.json({ error: 'Esta oferta não está mais pendente.' }, { status: 400 })
      }

      if (offer.buyer_user_id === auth.userId && offer.status !== 'countered') {
        return NextResponse.json({ error: 'Não há contraproposta para aceitar.' }, { status: 400 })
      }

      if (offer.seller_user_id !== auth.userId && offer.buyer_user_id !== auth.userId) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }

      if (offer.seller_user_id === auth.userId && offer.status === 'pending') {
        const { data: updated, error } = await supabase
          .from('offers')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            resolved_at: new Date().toISOString(),
          })
          .eq('id', offerId)
          .select()
          .single()

        if (error) return NextResponse.json({ error: 'Erro ao aceitar oferta.' }, { status: 500 })
        return NextResponse.json(updated)
      }

      if (offer.buyer_user_id === auth.userId && offer.status === 'countered') {
        const { data: updated, error } = await supabase
          .from('offers')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            resolved_at: new Date().toISOString(),
          })
          .eq('id', offerId)
          .select()
          .single()

        if (error) return NextResponse.json({ error: 'Erro ao aceitar contraproposta.' }, { status: 500 })
        return NextResponse.json(updated)
      }
    }

    if (action === 'reject') {
      if (offer.seller_user_id !== auth.userId && offer.buyer_user_id !== auth.userId) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }

      const validStatuses = offer.seller_user_id === auth.userId ? ['pending'] : ['countered']
      if (!validStatuses.includes(offer.status)) {
        return NextResponse.json({ error: 'Esta oferta não pode ser recusada.' }, { status: 400 })
      }

      const { data: updated, error } = await supabase
        .from('offers')
        .update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .select()
        .single()

      if (error) return NextResponse.json({ error: 'Erro ao recusar oferta.' }, { status: 500 })
      return NextResponse.json(updated)
    }

    if (action === 'counter') {
      if (offer.seller_user_id !== auth.userId) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }

      if (offer.status !== 'pending') {
        return NextResponse.json({ error: 'Esta oferta não está mais pendente.' }, { status: 400 })
      }

      const counterPayload: CounterOfferPayload = {
        offer_id: offerId,
        counter_amount: body.counter_amount,
        seller_message: body.seller_message,
      }

      const errors = validateCounterPayload(counterPayload)
      if (errors.length > 0) {
        return NextResponse.json({ error: errors[0], details: errors }, { status: 400 })
      }

      const { data: updated, error } = await supabase
        .from('offers')
        .update({
          status: 'countered',
          counter_amount: counterPayload.counter_amount,
          seller_message: counterPayload.seller_message || null,
        })
        .eq('id', offerId)
        .select()
        .single()

      if (error) return NextResponse.json({ error: 'Erro ao enviar contraproposta.' }, { status: 500 })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (error) {
    console.error('[OFFER_PATCH]', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
