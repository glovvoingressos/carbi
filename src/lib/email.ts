import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')

interface NewMessageEmailParams {
  recipientEmail: string
  recipientName: string
  senderName: string
  vehicleTitle: string
  messageContent: string
  conversationId: string
}

export async function sendNewMessageEmail(params: NewMessageEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de sucesso.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { recipientEmail, recipientName, senderName, vehicleTitle, messageContent, conversationId } = params

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    // Rota típica para o painel de mensagens, mas pode ser ajustada conforme a aplicação real
    const chatLink = `${siteUrl}/painel/mensagens/${conversationId}`

    const data = await resend.emails.send({
      from: 'CarDecision Notificações <onboarding@resend.dev>', // E-mail padrão de teste do Resend
      to: recipientEmail,
      subject: `Você recebeu uma nova mensagem sobre o ${vehicleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <h2 style="color: #2563eb;">Nova Mensagem no CarDecision</h2>
          <p>Olá, <strong>${recipientName || 'Cliente'}</strong>!</p>
          <p>O usuário <strong>${senderName || 'Alguém'}</strong> enviou uma mensagem a respeito do veículo <strong>${vehicleTitle}</strong>:</p>
          
          <blockquote style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 24px 0; font-style: italic;">
            "${messageContent}"
          </blockquote>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${chatLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Abrir Chat e Responder
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 48px;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Esta é uma notificação automática do marketplace CarDecision.<br />
            Por favor, não responda a este e-mail.
          </p>
        </div>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Falha ao enviar o e-mail via Resend:', error)
    // Retorna false em caso de erro, mas sem lançar exceção para não interromper o fluxo da aplicação
    return { success: false, error }
  }
}
