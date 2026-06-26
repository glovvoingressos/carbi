import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { safeSanitizeMessage } from '@/lib/marketplace'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { sendNewMessageEmail } from '@/lib/email'

async function canAccessConversation(accessToken: string, conversationId: string, userId: string) {
  const supabase = getSupabaseServerClient(accessToken)
  const { data, error } = await supabase
    .from('conversations')
    .select('id,seller_user_id,buyer_user_id')
    .eq('id', conversationId)
    .single()

  if (error || !data) return false
  return data.seller_user_id === userId || data.buyer_user_id === userId
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { conversationId } = await params
    const canAccess = await canAccessConversation(auth.accessToken, conversationId, auth.userId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Sem permissão para esta conversa.' }, { status: 403 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('id,conversation_id,sender_user_id,message,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/marketplace/conversations/[conversationId]/messages failed', error)
    return NextResponse.json({ error: 'Falha ao carregar mensagens.' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { conversationId } = await params
    const canAccess = await canAccessConversation(auth.accessToken, conversationId, auth.userId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Sem permissão para esta conversa.' }, { status: 403 })
    }

    const body = (await req.json()) as { message?: string }
    const message = safeSanitizeMessage(body.message || '')

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: auth.userId,
        message,
      })
      .select('id,conversation_id,sender_user_id,message,created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Processamento assíncrono para enviar notificação por e-mail
    // Não utilizamos await aqui para não atrasar a resposta da API (fire-and-forget)
    ;(async () => {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select(`
            seller_user_id,
            buyer_user_id,
            vehicle_listings (title, brand, model)
          `)
          .eq('id', conversationId)
          .single()

        if (conv) {
          const isSenderBuyer = auth.userId === conv.buyer_user_id
          const recipientId = isSenderBuyer ? conv.seller_user_id : conv.buyer_user_id

          const { data: users } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', [recipientId, auth.userId])

          if (users) {
            const recipient = users.find(u => u.id === recipientId)
            const sender = users.find(u => u.id === auth.userId)

            if (recipient?.email) {
              const carInfo = Array.isArray(conv.vehicle_listings) ? conv.vehicle_listings[0] : conv.vehicle_listings
              const title = carInfo?.title || `${carInfo?.brand} ${carInfo?.model}`

              await sendNewMessageEmail({
                recipientEmail: recipient.email,
                recipientName: recipient.full_name || 'Cliente',
                senderName: sender?.full_name || 'Um usuário',
                vehicleTitle: title,
                messageContent: message,
                conversationId: conversationId
              })
            }
          }
        }
      } catch (emailErr) {
        console.error('Falha no processo de notificação por e-mail (reply):', emailErr)
      }
    })()

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/marketplace/conversations/[conversationId]/messages failed', error)
    return NextResponse.json({ error: 'Falha ao enviar mensagem.' }, { status: 500 })
  }
}
