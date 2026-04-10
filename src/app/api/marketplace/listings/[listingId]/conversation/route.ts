import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { safeSanitizeMessage } from '@/lib/marketplace'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Faça login para iniciar conversa.' }, { status: 401 })
    }

    const { listingId } = await params
    const body = (await req.json().catch(() => ({}))) as { firstMessage?: string }

    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select('id, user_id, status')
      .eq('id', listingId)
      .single()

    if (listingError || !listing || listing.status !== 'active') {
      return NextResponse.json({ error: 'Anúncio indisponível.' }, { status: 404 })
    }

    if (listing.user_id === auth.userId) {
      return NextResponse.json({ error: 'Você não pode abrir conversa no próprio anúncio.' }, { status: 400 })
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .upsert(
        {
          listing_id: listing.id,
          seller_user_id: listing.user_id,
          buyer_user_id: auth.userId,
        },
        {
          onConflict: 'listing_id,seller_user_id,buyer_user_id',
        },
      )
      .select('id')
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json({ error: conversationError?.message || 'Falha ao iniciar conversa.' }, { status: 500 })
    }

    const firstMessage = safeSanitizeMessage(body.firstMessage || '')
    if (firstMessage) {
      const { error: msgError } = await supabase.from('conversation_messages').insert({
        conversation_id: conversation.id,
        sender_user_id: auth.userId,
        message: firstMessage,
      })

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/conversation failed', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a conversa.' }, { status: 500 })
  }
}
