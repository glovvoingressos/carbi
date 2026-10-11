import { sendAdminNewSignupEmail } from '@/lib/email'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

interface NewSignup {
  id: string
  email: string
  name?: string | null
}

export async function notifyAdminAboutNewSignupOnce(user: NewSignup) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }
  }

  const { error: insertError } = await supabase
    .from('admin_signup_notification_events')
    .insert({ user_id: user.id, status: 'processing', attempts: 1 })

  if (insertError?.code === '23505') {
    const { data: event, error: readError } = await supabase
      .from('admin_signup_notification_events')
      .select('status, attempts')
      .eq('user_id', user.id)
      .maybeSingle()

    if (readError) {
      console.error('[admin-signup-notification] could not read event state', readError)
      return { success: false, error: 'Não foi possível consultar o aviso de cadastro.' }
    }

    if (event?.status === 'sent' || event?.status === 'processing') {
      return { success: true, alreadyHandled: true }
    }

    if (event?.status === 'failed') {
      const { data: claimed, error: claimError } = await supabase
        .from('admin_signup_notification_events')
        .update({ status: 'processing', attempts: event.attempts + 1, last_error: null })
        .eq('user_id', user.id)
        .eq('status', 'failed')
        .select('user_id')
        .maybeSingle()

      if (claimError) {
        console.error('[admin-signup-notification] could not retry notification', claimError)
        return { success: false, error: 'Não foi possível preparar o novo envio.' }
      }
      if (!claimed) return { success: true, alreadyHandled: true }
    } else {
      return { success: false, error: 'Não foi possível registrar o aviso de cadastro.' }
    }
  } else if (insertError) {
    console.error('[admin-signup-notification] could not create event', insertError)
    return { success: false, error: 'Não foi possível registrar o aviso de cadastro.' }
  }

  const result = await sendAdminNewSignupEmail({ userEmail: user.email, userName: user.name })
  if (!result.success) {
    const errorMessage = result.error instanceof Error
      ? result.error.message
      : typeof result.error === 'string'
        ? result.error
        : 'Falha no envio de email.'
    await supabase
      .from('admin_signup_notification_events')
      .update({ status: 'failed', last_error: errorMessage.slice(0, 500) })
      .eq('user_id', user.id)
      .eq('status', 'processing')
    return result
  }

  const { error: updateError } = await supabase
    .from('admin_signup_notification_events')
    .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
    .eq('user_id', user.id)
    .eq('status', 'processing')

  if (updateError) {
    console.error('[admin-signup-notification] email sent but event state was not updated', updateError)
    return { ...result, warning: 'Email enviado, mas não foi possível registrar o envio.' }
  }

  return result
}
