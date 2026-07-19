import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { safeSanitizeMessage } from '@/lib/marketplace'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { sendNewMessageEmail } from '@/lib/email'
import { notifyNewMessage } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Faça login para iniciar conversa.' }, { status: 401 })
    }

    const { listingId } = await params
    const body = (await req.json().catch(() => ({}))) as { firstMessage?: string }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const listingReader = getSupabaseServerClient()

    const { data: listing, error: listingError } = await listingReader
      .from('vehicle_listings_public')
      .select('id, user_id, status, title, brand, model')
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

      // Processamento assíncrono para enviar notificação por e-mail ao vendedor
      ;(async () => {
        try {
          const { data: users } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', [listing.user_id, auth.userId])

          if (users) {
            const seller = users.find(u => u.id === listing.user_id)
            const buyer = users.find(u => u.id === auth.userId)

            if (seller?.email) {
              const title = listing.title || `${listing.brand} ${listing.model}`
              await sendNewMessageEmail({
                recipientEmail: seller.email,
                recipientName: seller.full_name || 'Vendedor',
                senderName: buyer?.full_name || 'Um interessado',
                vehicleTitle: title,
                messageContent: firstMessage,
                conversationId: conversation.id
              })

              // In-app notification
              await notifyNewMessage({
                recipientUserId: listing.user_id,
                senderName: buyer?.full_name || 'Um interessado',
                vehicleTitle: title,
                conversationId: conversation.id,
              })
            }
          }
        } catch (emailErr) {
          console.error('Falha ao notificar vendedor por e-mail sobre nova conversa:', emailErr)
        }
      })()
    }

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/conversation failed', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a conversa.' }, { status: 500 })
  }
}
