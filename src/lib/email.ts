import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'
const LOGO_URL = `${SITE_URL}/logo.svg`
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Carbi <onboarding@resend.dev>'

// Função utilitária para formatar valores em Real (BRL)
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// 1. Notificação de Nova Mensagem (Chat)
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
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de nova mensagem.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { recipientEmail, recipientName, senderName, vehicleTitle, messageContent, conversationId } = params

  try {
    const chatLink = `${SITE_URL}/minha-conta/conversas?conversation=${conversationId}`

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Você recebeu uma nova mensagem sobre o ${vehicleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: #2563eb; text-align: center;">Nova Mensagem no CarDecision</h2>
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
    return { success: false, error }
  }
}

// 2. Notificação de Nova Proposta (Vendedor recebe oferta)
interface NewOfferEmailParams {
  sellerEmail: string
  sellerName: string
  buyerName: string
  vehicleTitle: string
  offerAmount: number
  paymentMethod: string
  buyerMessage?: string
  offerId: string
}

export async function sendNewOfferEmail(params: NewOfferEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de nova proposta.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { sellerEmail, sellerName, buyerName, vehicleTitle, offerAmount, paymentMethod, buyerMessage, offerId } = params

  try {
    const offerLink = `${SITE_URL}/painel/propostas/${offerId}`

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: `Nova proposta de ${formatBRL(offerAmount)} para o seu ${vehicleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: #10b981; text-align: center;">Você recebeu uma Proposta!</h2>
          <p>Olá, <strong>${sellerName || 'Vendedor'}</strong>!</p>
          <p>O comprador <strong>${buyerName || 'Interessado'}</strong> fez uma proposta para o seu veículo <strong>${vehicleTitle}</strong>.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #065f46;">
              Valor da Oferta: ${formatBRL(offerAmount)}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #047857;">
              Forma de Pagamento: ${paymentMethod}
            </p>
            ${buyerMessage ? `<p style="margin: 12px 0 0 0; font-size: 14px; font-style: italic; color: #374151;">"${buyerMessage}"</p>` : ''}
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${offerLink}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Analisar Proposta
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
    console.error('Falha ao enviar e-mail de nova proposta:', error)
    return { success: false, error }
  }
}

// 3. Notificação de Resposta de Proposta (Aceita, Recusada ou Contraproposta)
interface OfferStatusUpdateEmailParams {
  recipientEmail: string
  recipientName: string
  senderName: string
  vehicleTitle: string
  status: 'accepted' | 'rejected' | 'countered'
  originalAmount: number
  counterAmount?: number
  message?: string
  offerId: string
}

export async function sendOfferStatusUpdateEmail(params: OfferStatusUpdateEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de atualização de proposta.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { recipientEmail, recipientName, senderName, vehicleTitle, status, originalAmount, counterAmount, message, offerId } = params

  try {
    const offerLink = `${SITE_URL}/painel/propostas/${offerId}`
    let subject = ''
    let statusTitle = ''
    let statusColor = '#3b82f6'
    let statusDescription = ''

    if (status === 'accepted') {
      subject = `Proposta aceita para o ${vehicleTitle}! 🎉`
      statusTitle = 'Proposta Aceita!'
      statusColor = '#10b981'
      statusDescription = `Boas notícias! <strong>${senderName}</strong> aceitou a proposta no valor de <strong>${formatBRL(originalAmount)}</strong> para o veículo <strong>${vehicleTitle}</strong>.`
    } else if (status === 'rejected') {
      subject = `Proposta recusada para o ${vehicleTitle}`
      statusTitle = 'Proposta Recusada'
      statusColor = '#ef4444'
      statusDescription = `A proposta de <strong>${formatBRL(originalAmount)}</strong> feita para o veículo <strong>${vehicleTitle}</strong> foi recusada por <strong>${senderName}</strong>.`
    } else if (status === 'countered') {
      subject = `Nova contraproposta recebida para o ${vehicleTitle}`
      statusTitle = 'Contraproposta Recebida!'
      statusColor = '#f59e0b'
      statusDescription = `<strong>${senderName}</strong> enviou uma contraproposta de <strong>${formatBRL(counterAmount || 0)}</strong> para o veículo <strong>${vehicleTitle}</strong>.`
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: ${statusColor}; text-align: center;">${statusTitle}</h2>
          <p>Olá, <strong>${recipientName || 'Usuário'}</strong>!</p>
          <p>${statusDescription}</p>

          ${status === 'countered' && counterAmount ? `
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #78350f;">
                Novo Valor Sugerido: ${formatBRL(counterAmount)}
              </p>
              ${message ? `<p style="margin: 8px 0 0 0; font-size: 14px; font-style: italic; color: #374151;">"${message}"</p>` : ''}
            </div>
          ` : ''}

          ${status === 'rejected' && message ? `
            <blockquote style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 24px 0; font-style: italic;">
              "${message}"
            </blockquote>
          ` : ''}

          ${status === 'accepted' && message ? `
            <blockquote style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 24px 0; font-style: italic;">
              "${message}"
            </blockquote>
          ` : ''}

          <div style="text-align: center; margin-top: 32px;">
            <a href="${offerLink}" style="background-color: ${statusColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Ver Detalhes da Proposta
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
    console.error('Falha ao enviar e-mail de atualização de proposta:', error)
    return { success: false, error }
  }
}

// 4. Confirmação de Anúncio Enviado (Sucesso na criação do anúncio)
interface ListingCreatedEmailParams {
  userEmail: string
  userName: string
  vehicleTitle: string
  price: number
  listingSlug: string
}

export async function sendListingCreatedEmail(params: ListingCreatedEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de anúncio ativo.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { userEmail, userName, vehicleTitle, price, listingSlug } = params

  try {
    const listingLink = `${SITE_URL}/anuncios/${listingSlug}`

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Seu anúncio do ${vehicleTitle} está no ar! 🚀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: #2563eb; text-align: center;">Parabéns! Seu anúncio está ativo</h2>
          <p>Olá, <strong>${userName || 'Anunciante'}</strong>!</p>
          <p>Seu veículo <strong>${vehicleTitle}</strong> foi cadastrado com sucesso e já está disponível para compradores de todo o Brasil.</p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e3a8a;">
              Preço anunciado: ${formatBRL(price)}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #3b82f6;">
              Status: Ativo e Visível
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${listingLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Visualizar Meu Anúncio
            </a>
          </div>

          <div style="margin-top: 32px; background-color: #f9fafb; padding: 16px; border-radius: 6px; font-size: 14px;">
            <h4 style="margin: 0 0 8px 0; color: #374151;">Dicas de Venda Rápida:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li>Fique de olho nas mensagens no chat da plataforma; respondê-las rápido dobra a chance de venda.</li>
              <li>Mantenha as fotos atualizadas e limpas.</li>
              <li>Ajuste o valor se notar que o mercado mudou.</li>
            </ul>
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
    console.error('Falha ao enviar e-mail de anúncio ativo:', error)
    return { success: false, error }
  }
}

// 5. Notificação de Admin — Novo Anúncio Criado
interface AdminNewListingEmailParams {
  vehicleTitle: string
  brand: string
  model: string
  year: number
  yearModel: number
  price: number
  city: string
  state: string
  sellerName: string
  listingSlug: string
}

export async function sendAdminNewListingEmail(params: AdminNewListingEmailParams) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL

  if (!adminEmail) {
    console.warn('ADMIN_NOTIFY_EMAIL não configurada. Pulando notificação de novo anúncio para o admin.')
    return { success: true, warning: 'ADMIN_NOTIFY_EMAIL not configured' }
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de novo anúncio para o admin.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { vehicleTitle, brand, model, year, yearModel, price, city, state, sellerName, listingSlug } = params

  try {
    const listingLink = `${SITE_URL}/anuncios/${listingSlug}`

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Novo anúncio: ${vehicleTitle} — ${formatBRL(price)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: #7c3aed; text-align: center;">Novo anúncio no marketplace</h2>
          <p>Um novo veículo foi anunciado na plataforma CarDecision.</p>

          <div style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #5b21b6;">
              ${vehicleTitle}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">
              ${brand} ${model} · ${year}/${yearModel} · ${formatBRL(price)}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">
              Local: ${city || '—'}/${state || '—'} · Anunciante: ${sellerName || '—'}
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${listingLink}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Ver Anúncio
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
    console.error('Falha ao enviar e-mail de novo anúncio para o admin:', error)
    return { success: false, error }
  }
}

// 6. Confirmação de Anúncio Excluído
interface ListingDeletedEmailParams {
  userEmail: string
  userName: string
  vehicleTitle: string
}

export async function sendListingDeletedEmail(params: ListingDeletedEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de anúncio excluído.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { userEmail, userName, vehicleTitle } = params

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Seu anúncio do ${vehicleTitle} foi removido`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: #4b5563; text-align: center;">Confirmação de Exclusão</h2>
          <p>Olá, <strong>${userName || 'Anunciante'}</strong>!</p>
          <p>Confirmamos que o anúncio do veículo <strong>${vehicleTitle}</strong> foi removido do marketplace CarDecision.</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #4b5563; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;">
              Caso você tenha vendido o veículo pela nossa plataforma, ficamos muito felizes em ajudar!
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;">
              Se precisar de ajuda para anunciar outro carro futuramente, estaremos aqui.
            </p>
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
    console.error('Falha ao enviar e-mail de exclusão de anúncio:', error)
    return { success: false, error }
  }
}

// 7. Notificação de Mudança de Status do Anúncio
interface ListingStatusChangedEmailParams {
  userEmail: string
  userName: string
  vehicleTitle: string
  newStatus: 'active' | 'sold' | 'paused' | 'archived'
  listingSlug: string
}

export async function sendListingStatusChangedEmail(params: ListingStatusChangedEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de mudança de status.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { userEmail, userName, vehicleTitle, newStatus, listingSlug } = params

  let subject = ''
  let title = ''
  let description = ''
  let statusColor = '#6b7280'
  let buttonText = 'Ver Anúncio'
  let buttonLink = `${SITE_URL}/anuncios/${listingSlug}`

  if (newStatus === 'active') {
    subject = `Seu anúncio do ${vehicleTitle} está ativo!`
    title = 'Anúncio Ativo'
    statusColor = '#10b981'
    description = 'Seu anúncio está visível e disponível para compradores.'
  } else if (newStatus === 'sold') {
    subject = `Parabéns! Seu ${vehicleTitle} foi vendido!`
    title = 'Anúncio Vendido'
    statusColor = '#2563eb'
    description = 'Parabéns pela venda! Seu anúncio foi marcado como vendido.'
    buttonText = 'Ver Anúncio'
  } else if (newStatus === 'paused') {
    subject = `Seu anúncio do ${vehicleTitle} foi pausado`
    title = 'Anúncio Pausado'
    statusColor = '#f59e0b'
    description = 'Seu anúncio foi pausado e não está mais visível para compradores.'
    buttonText = 'Reativar Anúncio'
  } else if (newStatus === 'archived') {
    subject = `Seu anúncio do ${vehicleTitle} foi arquivado`
    title = 'Anúncio Arquivado'
    statusColor = '#6b7280'
    description = 'Seu anúncio foi arquivado e não está mais visível.'
    buttonText = 'Ver Anúncio'
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: ${statusColor}; text-align: center;">${title}</h2>
          <p>Olá, <strong>${userName || 'Anunciante'}</strong>!</p>
          <p>${description}</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">
              ${vehicleTitle}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">
              Status: ${newStatus === 'active' ? 'Ativo' : newStatus === 'sold' ? 'Vendido' : newStatus === 'paused' ? 'Pausado' : 'Arquivado'}
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${buttonLink}" style="background-color: ${statusColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ${buttonText}
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
    console.error('Falha ao enviar e-mail de mudança de status:', error)
    return { success: false, error }
  }
}

// 8. E-mail de Boas-vindas (Conta Criada)
interface WelcomeEmailParams {
  userEmail: string
  userName: string
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de boas-vindas.')
    return { success: true, warning: 'RESEND_API_KEY not configured' }
  }

  const { userEmail, userName } = params

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Bem-vindo à Carbi! 🚗',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="Carbi" style="max-width: 120px; height: auto;" />
          </div>
          <h2 style="color: #2563eb; text-align: center;">Bem-vindo à Carbi!</h2>
          <p>Olá, <strong>${userName || 'Parceiro'}</strong>!</p>
          <p>Sua conta foi criada com sucesso. Agora você pode anunciar seus carros e encontrar os melhores seminovos do Brasil.</p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #065f46;">
              O que você pode fazer agora:
            </p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #047857; font-size: 14px;">
              <li>Anunciar seu carro grátis em poucos minutos</li>
              <li>Comparar preços com a tabela FIPE</li>
              <li>Receber tráfego pago grátis no Google e Meta Ads</li>
              <li>Negociar seguro pelo chat interno</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${SITE_URL}/anunciar-carro" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Anunciar meu primeiro carro
            </a>
          </div>

          <div style="text-align: center; margin-top: 16px;">
            <a href="${SITE_URL}/carros-a-venda" style="color: #2563eb; text-decoration: none; font-weight: bold;">
              Ou explorar carros à venda
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
    console.error('Falha ao enviar e-mail de boas-vindas:', error)
    return { success: false, error }
  }
}
