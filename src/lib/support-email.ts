import { Resend } from 'resend'

type SupportAdminNotificationParams = {
  conversationId: string
  name?: string
  email?: string
  message: string
}

type SupportAdminNotificationResult = {
  success: boolean
  warning?: string
}

const DEFAULT_SITE_URL = 'https://www.carbi.com.br'
const DEFAULT_FROM_EMAIL = 'Carbi <noreply@carbi.com.br>'
const SUBJECT = 'Nova mensagem de suporte no Carbi'

export async function sendSupportAdminNotification(
  params: SupportAdminNotificationParams,
): Promise<SupportAdminNotificationResult> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim()
  if (!adminEmail) return { success: false, warning: 'ADMIN_NOTIFY_EMAIL not configured' }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, warning: 'RESEND_API_KEY not configured' }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')
  const adminLink = `${siteUrl}/admin/suporte?conversation=${encodeURIComponent(params.conversationId)}`
  const replyTo = params.email?.trim()
  const recipientName = escapeHtml(params.name || 'Visitante')
  const visitorEmail = replyTo ? escapeHtml(replyTo) : 'Não informado'
  const message = escapeHtml(params.message)

  try {
    const response = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to: [adminEmail],
      ...(replyTo ? { replyTo } : {}),
      subject: SUBJECT,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <h2>Nova mensagem de suporte</h2>
          <p><strong>Nome:</strong> ${recipientName}</p>
          <p><strong>E-mail:</strong> ${visitorEmail}</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; white-space: pre-wrap;">${message}</div>
          <p style="margin-top: 24px;"><a href="${adminLink}">Abrir conversa no painel administrativo</a></p>
        </div>
      `,
    })

    if (response.error) {
      console.error('[support] admin notification delivery failed')
      return { success: false, warning: 'Support notification could not be sent' }
    }

    return { success: true }
  } catch {
    console.error('[support] admin notification delivery failed')
    return { success: false, warning: 'Support notification could not be sent' }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
