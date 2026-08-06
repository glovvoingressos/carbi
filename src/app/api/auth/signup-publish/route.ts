import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = String(body?.full_name || '').trim()
    const phone = String(body?.phone || '').replace(/\D/g, '')
    const cpf = String(body?.cpf || '').replace(/\D/g, '')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'A senha deve ter 8+ caracteres, com letra maiúscula, número e símbolo.' },
        { status: 400 },
      )
    }
    if (fullName.length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 500 })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        cpf,
      },
    })

    if (error) {
      const msg = String(error.message || '')
      if (msg.toLowerCase().includes('already been registered') || msg.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'email_exists' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (data?.user) {
      void sendWelcomeEmail({
        userEmail: email,
        userName: fullName,
      }).catch((err) => console.error('[signup-publish] welcome email failed', err))
    }

    return NextResponse.json({ ok: true, email })
  } catch (e) {
    console.error('POST /api/auth/signup-publish failed', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
