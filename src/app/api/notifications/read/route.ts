import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await req.json()) as { ids?: string[]; all?: boolean }
    const supabase = getSupabaseServerClient(auth.accessToken)

    if (body.all) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', auth.userId)
        .eq('read', false)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (body.ids && body.ids.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', auth.userId)
        .in('id', body.ids)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notifications/read failed', error)
    return NextResponse.json({ error: 'Falha ao marcar notificações.' }, { status: 500 })
  }
}
