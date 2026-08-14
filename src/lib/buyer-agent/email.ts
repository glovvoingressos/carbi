import { Resend } from 'resend'
import { CarCriteria, MatchLevel, SearchMatchRow } from './types'
import { matchLevelLabels } from './types'
import { criteriaSummary } from './explain'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Carbi <noreply@carbi.com.br>'

function formatMileage(value: number | null | undefined): string {
  return value ? `${value.toLocaleString('pt-BR')} km` : '—'
}

export async function sendMatchEmail(params: {
  to: string
  criteria: CarCriteria
  summary: string
  match: Pick<SearchMatchRow, 'match_level' | 'explanation' | 'created_at' | 'listing'>
  viewTokenUrl: string
}): Promise<{ success: boolean }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de e-mail de match.')
    return { success: true }
  }

  const { to, criteria, summary, match, viewTokenUrl } = params
  const m = match.match_level
  const levelLabel = matchLevelLabels[m as MatchLevel]
  const listing = match.listing
  const priceBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(listing?.price || 0))

  const brandModel = listing ? `${listing.brand} ${listing.model} ${listing.year_model || ''}` : 'Um carro'

  const footerNote =
    m === 'exato'
      ? 'Este veículo atende a todos os critérios principais que você definiu.'
      : m === 'proximo'
        ? 'Este veículo é muito próximo dos seus critérios, com pequenas diferenças.'
        : 'Este veículo tem características parecidas com o que você procura.'

  const emailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937; padding: 24px;">
      <div style="text-align: center; margin: 8px 0 20px;">
        <span style="display:inline-block; background: #D4F576; color: #1A1A1A; font-weight: 700; font-size: 12px; letter-spacing: 0.04em; padding: 6px 14px; border-radius: 999px;">🚨 MATCH ENCONTRADO</span>
      </div>
      <h2 style="margin: 12px 0 8px; font-size: 24px; line-height: 1.25; text-align: center;">
        Encontramos um carro parecido com o que você procura.
      </h2>
      <p style="color: #4b5563; font-size: 15px; text-align: center; margin: 0 0 20px;">
        Sobre a busca: <strong>${summary}</strong>
      </p>

      <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background: #ffffff;">
        <div style="font-size: 12px; color: #6f6f6f; letter-spacing: 0.03em; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">
          ${levelLabel}
        </div>
        <div style="font-size: 26px; font-weight: 800; line-height: 1.15; margin-bottom: 4px;">${brandModel}</div>
        <div style="font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 10px 0 12px;">${priceBRL}</div>
        <div style="display: grid; grid-template-columns: repeat(${listing && listing.city ? 3 : 2}, 1fr); gap: 8px; font-size: 14px; color: #374151;">
          ${listing?.mileage ? `<div><strong>${formatMileage(listing.mileage)}</strong><br/>Km</div>` : ''}
          ${listing?.city ? `<div><strong>${listing.city}${listing.state ? '/' + listing.state : ''}</strong><br/>Localização</div>` : ''}
          ${listing?.transmission ? `<div><strong>${listing.transmission}</strong><br/>Câmbio</div>` : ''}
        </div>
        ${match.explanation ? `<p style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #f3f4f6; font-size: 14px; color: #374151;"><em>${match.explanation}</em></p>` : ''}
        <p style="font-size: 13px; color: #6f6f6f;">${footerNote}</p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${listing ? `${SITE_URL}/anuncios/${listing.slug}` : viewTokenUrl}" style="background: #1A1A1A; color: #ffffff; font-weight: 700; padding: 14px 28px; border-radius: 999px; text-decoration: none; display: inline-block;">
          VER CARRO
        </a>
      </div>

      <div style="text-align: center; font-size: 13px; margin: 12px 0 8px;">
        <a href="${viewTokenUrl}" style="color: #1A1A1A; font-weight: 600;">Ver minha busca e todos os matches</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
        O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura.
        Quando aparecer uma oportunidade compatível, avisaremos você.<br/>
        Não responda a este e-mail automático.
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🚨 Encontramos um carro parecido: ${brandModel}`,
      html: emailHtml,
    })
    return { success: true }
  } catch (error) {
    console.error('Falha ao enviar e-mail de match:', error)
    return { success: false }
  }
}

export async function sendSearchSavedEmail(params: {
  to: string
  summary: string
  searchUrl: string
}): Promise<{ success: boolean }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Simulando envio de busca salva.')
    return { success: true }
  }

  const { to, summary, searchUrl } = params

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937; padding: 24px;">
      <div style="text-align: center; margin: 8px 0 16px;">
        <span style="display:inline-block; background: #D4F576; color: #1A1A1A; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 999px;">BUSCA REGISTRADA</span>
      </div>
      <h2 style="font-size: 24px; line-height: 1.3; text-align: center; margin: 12px 0 8px;">Você está procurando:</h2>
      <div style="text-align: center; font-size: 20px; font-weight: 800; margin: 4px 0 20px;">${summary}</div>
      <p style="font-size: 15px; color: #4b5563; text-align: center; margin: 0 0 24px;">
        Salve este link para acompanhar novos matches no Carbi. Enviaremos um e-mail quando um anúncio compatível aparecer.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${searchUrl}" style="background: #1A1A1A; color: #ffffff; font-weight: 700; padding: 14px 28px; border-radius: 999px; text-decoration: none; display: inline-block;">
          ACOMPANHAR MINHA BUSCA
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
        O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura.
        Quando aparecer uma oportunidade compatível, avisaremos você.
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '✔ Busca registrada no Carbi',
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Falha ao enviar e-mail de busca salva:', error)
    return { success: false }
  }
}