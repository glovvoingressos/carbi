import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { conversationId } = await params
    const supabase = getSupabaseServerClient(auth.accessToken)

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id,seller_user_id,buyer_user_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada.' }, { status: 404 })
    }

    if (conversation.seller_user_id !== auth.userId && conversation.buyer_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { error } = await supabase.from('conversation_reads').upsert(
      {
        conversation_id: conversationId,
        user_id: auth.userId,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: 'conversation_id,user_id',
      },
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/marketplace/conversations/[conversationId]/read failed', error)
    return NextResponse.json({ error: 'Falha ao marcar conversa como lida.' }, { status: 500 })
  }
}
