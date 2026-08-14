import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { matchId?: string; searchId?: string; token?: string }
  try {
    body = (await req.json()) as { matchId?: string; searchId?: string; token?: string }
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { matchId, searchId, token } = body
  if (!matchId || !searchId) {
    return NextResponse.json({ error: 'Faltam dados.' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Não configurado.' }, { status: 500 })
  }

  // Validate access: either logged-in owner of the search, or the search's view token
  const auth = await getAuthContext(req)
  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })

  let allowed = false
  if (auth?.userId) {
    const { data: search } = await admin.from('buyer_searches').select('user_id').eq('id', searchId).maybeSingle()
    if (search && search.user_id === auth.userId) allowed = true
  }
  if (!allowed && token) {
    const { data: search } = await admin.from('buyer_searches').select('view_token').eq('id', searchId).maybeSingle()
    if (search && search.view_token === token) allowed = true
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { error } = await admin
    .from('search_matches')
    .update({ in_app_read: true })
    .eq('id', matchId)
    .eq('search_id', searchId)

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}