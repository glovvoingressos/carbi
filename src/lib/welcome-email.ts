import { sendWelcomeEmail } from '@/lib/email'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

interface ConfirmedUser {
  id: string
  email: string | null | undefined
  name?: string | null
}

/**
 * Sends the welcome email once, after the account has been confirmed.
 *
 * The marker is kept in the profile table and written with the service-role
 * client so an authenticated browser cannot mark its own email as sent.
 */
export async function sendWelcomeEmailOnce(user: ConfirmedUser) {
  if (!user.email) {
    return { success: false, error: 'Usuário sem e-mail.' }
  }

  const admin = getSupabaseAdminClient()

  if (admin) {
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('welcome_email_sent_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Falha ao verificar envio do e-mail de boas-vindas:', profileError)
      return { success: false, error: 'Não foi possível verificar o envio do e-mail.' }
    }

    if (profile?.welcome_email_sent_at) {
      return { success: true, alreadySent: true }
    }
  } else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY não configurada; o envio não terá marcação de idempotência.')
  }

  const result = await sendWelcomeEmail({
    userEmail: user.email,
    userName: user.name || user.email.split('@')[0],
  })

  if (!result.success) return result

  if (admin) {
    const { error: updateError } = await admin
      .from('users')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('welcome_email_sent_at', null)

    if (updateError) {
      console.error('E-mail enviado, mas não foi possível registrar a marcação:', updateError)
      return { ...result, warning: 'E-mail enviado sem marcação de idempotência.' }
    }
  }

  return result
}
