import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { safeSanitizeMessage } from '@/lib/marketplace'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

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

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/marketplace/conversations/[conversationId]/messages failed', error)
    return NextResponse.json({ error: 'Falha ao enviar mensagem.' }, { status: 500 })
  }
}
