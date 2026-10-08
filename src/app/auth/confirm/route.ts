import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getSafeRedirectPath } from '@/lib/auth-redirect'
import { sendWelcomeEmailOnce } from '@/lib/welcome-email'

function getDestination(rawNext: string | null): string {
  if (!rawNext) return getSafeRedirectPath(null)

  try {
    const nestedUrl = new URL(rawNext, 'https://carbi.invalid')
    const nestedRedirect = nestedUrl.searchParams.get('redirect')
    if (nestedRedirect) return getSafeRedirectPath(nestedRedirect)
  } catch {
    // Fall through to the direct safe-path check.
  }

  return getSafeRedirectPath(rawNext)
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  const rawType = url.searchParams.get('type')
  const destination = getDestination(url.searchParams.get('next') || url.searchParams.get('redirect'))

  const redirectWithError = (reason: string) => {
    const errorUrl = new URL('/entrar', request.url)
    errorUrl.searchParams.set('redirect', destination)
    errorUrl.searchParams.set('auth_error', reason)
    return NextResponse.redirect(errorUrl)
  }

  if (!tokenHash || (rawType !== 'email' && rawType !== 'email_change')) {
    return redirectWithError('confirmation_invalid')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectWithError('auth_unavailable')
  }

  const pendingCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = []
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet)
      },
    },
  })

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType as EmailOtpType,
  })

  if (verifyError) {
    console.error('Falha ao confirmar e-mail:', verifyError)
    return redirectWithError('confirmation_failed')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      phone: (user.user_metadata?.phone as string | undefined) || '',
      cpf: (user.user_metadata?.cpf as string | undefined) || '',
    }

    const { error: profileError } = await supabase.from('users').upsert(profile, { onConflict: 'id' })
    if (profileError) console.error('Falha ao salvar perfil após confirmação:', profileError)

    await sendWelcomeEmailOnce({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name as string | undefined,
    })
  }

  const response = NextResponse.redirect(new URL(destination, request.url))
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
