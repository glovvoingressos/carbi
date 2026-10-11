import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { notifyAdminAboutNewSignupOnce } from '@/lib/admin-signup-notification'

export async function POST(request: NextRequest) {
  let userId: string
  try {
    const body = await request.json()
    userId = typeof body?.userId === 'string' ? body.userId.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json({ error: 'Cadastro inválido.' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 503 })
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId)
  const user = data.user
  if (error || !user?.email) {
    return NextResponse.json({ error: 'Cadastro não encontrado.' }, { status: 404 })
  }

  const createdAt = Date.parse(user.created_at)
  const ageMs = Date.now() - createdAt
  if (!Number.isFinite(createdAt) || ageMs < -60_000 || ageMs > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'O período para notificar este cadastro expirou.' }, { status: 410 })
  }

  const result = await notifyAdminAboutNewSignupOnce({
    id: user.id,
    email: user.email,
    name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null,
  })

  if (!result.success) {
    return NextResponse.json({ error: 'Não foi possível enviar o aviso ao administrador.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, alreadyHandled: 'alreadyHandled' in result && result.alreadyHandled })
}
