import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 })
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'email',
      email,
      options: {
        email_redirect_to: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'}/auth/callback`,
      },
    })

    if (error) {
      console.error('Failed to generate confirmation link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const confirmationLink = data.properties?.action_link

    if (confirmationLink && process.env.RESEND_API_KEY) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Carbi <noreply@carbi.com.br>'

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Confirme seu e-mail — Carbi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="${siteUrl}/logo.svg" alt="Carbi" style="max-width: 120px; height: auto;" />
            </div>
            <h2 style="color: #2563eb; text-align: center;">Confirme seu e-mail</h2>
            <p>Olá, <strong>${name || 'Parceiro'}</strong>!</p>
            <p>Sua conta foi criada com sucesso. Para ativá-la, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmationLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Confirmar meu e-mail
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">Ou copie e cole este link no navegador:<br/>${confirmationLink}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 48px;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              Esta é uma notificação automática do marketplace CarDecision.<br />
              Por favor, não responda a este e-mail.
            </p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true, confirmationLink })
  } catch (e) {
    console.error('Confirm-email route error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}