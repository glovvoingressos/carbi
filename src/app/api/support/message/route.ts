import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Carbi <noreply@carbi.com.br>'

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req)
  if (!auth) {
    return NextResponse.json({ error: 'Você precisa estar logado para enviar uma mensagem.' }, { status: 401 })
  }

  let body: { message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const message = (body.message || '').trim()
  if (!message) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Mensagem muito longa (máx 2000 caracteres).' }, { status: 400 })
  }

  // Identifica o usuário logado (e-mail + nome)
  const supabase = getSupabaseServerClient(auth.accessToken)
  const { data: userData } = await supabase.auth.getUser()
  const userEmail = userData?.user?.email || 'desconhecido'
  const userId = auth.userId

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
  const resendKey = process.env.RESEND_API_KEY

  const subject = `[Suporte Carbi] Nova mensagem de ${userEmail}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #212121;">Nova mensagem de suporte</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 6px 0; color: #6F6F6F; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; width: 80px;">De</td><td style="padding: 6px 0; color: #212121; font-size: 14px;">${escapeHtml(userEmail)}</td></tr>
        <tr><td style="padding: 6px 0; color: #6F6F6F; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;">User ID</td><td style="padding: 6px 0; color: #212121; font-size: 13px; font-family: monospace;">${escapeHtml(userId)}</td></tr>
        <tr><td style="padding: 6px 0; color: #6F6F6F; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;">Quando</td><td style="padding: 6px 0; color: #212121; font-size: 14px;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td></tr>
      </table>
      <div style="background: #F5F5F5; border-radius: 12px; padding: 18px 20px; color: #212121; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
      <p style="margin-top: 20px; color: #6F6F6F; font-size: 12px;">Responda este e-mail para falar diretamente com o usuário.</p>
    </div>
  `

  const text = `Nova mensagem de suporte\n\nDe: ${userEmail}\nUser ID: ${userId}\nQuando: ${new Date().toISOString()}\n\n${message}\n\n---\nResponda este e-mail para falar diretamente com o usuário.`

  if (!adminEmail) {
    console.warn('[support] ADMIN_NOTIFY_EMAIL não configurada; mensagem registrada no log apenas.', { userEmail, userId, message })
    return NextResponse.json({ ok: true, warning: 'admin_email_not_configured' })
  }

  if (!resendKey) {
    console.warn('[support] RESEND_API_KEY não configurada; mensagem registrada no log apenas.', { userEmail, userId, message })
    return NextResponse.json({ ok: true, warning: 'resend_not_configured' })
  }

  try {
    const resend = new Resend(resendKey)
    const replyTo = userEmail
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
      replyTo,
      subject,
      html,
      text,
    })
    if (error) {
      console.error('[support] Resend error:', error)
      return NextResponse.json({ error: 'Não conseguimos enviar agora. Tente de novo em instantes.' }, { status: 502 })
    }
  } catch (err) {
    console.error('[support] Falha ao enviar:', err)
    return NextResponse.json({ error: 'Não conseguimos enviar agora. Tente de novo em instantes.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}