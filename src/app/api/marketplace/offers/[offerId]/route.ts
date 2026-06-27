import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { CounterOfferPayload, validateCounterPayload } from '@/lib/offers'
import { sendOfferStatusUpdateEmail } from '@/lib/email'

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

    let updated: any = null
    let recipientId: string | null = null
    let emailStatus: 'accepted' | 'rejected' | 'countered' | null = null

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

      const isSeller = offer.seller_user_id === auth.userId
      const { data, error } = await supabase
        .from('offers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .select()
        .single()

      if (error) return NextResponse.json({ error: isSeller ? 'Erro ao aceitar oferta.' : 'Erro ao aceitar contraproposta.' }, { status: 500 })
      
      updated = data
      recipientId = isSeller ? offer.buyer_user_id : offer.seller_user_id
      emailStatus = 'accepted'
    }

    else if (action === 'reject') {
      if (offer.seller_user_id !== auth.userId && offer.buyer_user_id !== auth.userId) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }

      const isSeller = offer.seller_user_id === auth.userId
      const validStatuses = isSeller ? ['pending'] : ['countered']
      if (!validStatuses.includes(offer.status)) {
        return NextResponse.json({ error: 'Esta oferta não pode ser recusada.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('offers')
        .update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .select()
        .single()

      if (error) return NextResponse.json({ error: 'Erro ao recusar oferta.' }, { status: 500 })
      
      updated = data
      recipientId = isSeller ? offer.buyer_user_id : offer.seller_user_id
      emailStatus = 'rejected'
    }

    else if (action === 'counter') {
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

      const { data, error } = await supabase
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
      
      updated = data
      recipientId = offer.buyer_user_id
      emailStatus = 'countered'
    }

    if (updated && recipientId && emailStatus) {
      // Dispara notificação por e-mail assíncrona
      ;(async () => {
        try {
          const { data: users } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', [recipientId, auth.userId])

          if (users) {
            const recipient = users.find(u => u.id === recipientId)
            const sender = users.find(u => u.id === auth.userId)

            if (recipient?.email) {
              const listingReader = getSupabaseServerClient()
              const { data: carData } = await listingReader
                .from('vehicle_listings_public')
                .select('title, brand, model')
                .eq('id', offer.listing_id)
                .single()

              const title = carData?.title || `${carData?.brand} ${carData?.model}` || 'Veículo'

              await sendOfferStatusUpdateEmail({
                recipientEmail: recipient.email,
                recipientName: recipient.full_name || 'Cliente',
                senderName: sender?.full_name || 'Usuário',
                vehicleTitle: title,
                status: emailStatus!,
                originalAmount: offer.amount,
                counterAmount: updated.counter_amount || undefined,
                message: (emailStatus === 'countered' ? updated.seller_message : (emailStatus === 'rejected' ? 'Proposta recusada.' : 'Proposta aceita!')) || undefined,
                offerId: offerId
              })
            }
          }
        } catch (emailErr) {
          console.error('Falha ao enviar e-mail de atualização de proposta:', emailErr)
        }
      })()
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[OFFER_PATCH]', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
