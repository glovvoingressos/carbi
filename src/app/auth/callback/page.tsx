'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const handleCallback = async () => {
      const hash = window.location.hash
      if (!hash) {
        router.replace('/entrar')
        return
      }

      // Parse tokens from hash fragment
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          // Also ensure user exists in users table
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('users').upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              account_type: user.user_metadata?.account_type || 'pf',
              store_name: user.user_metadata?.store_name || null,
              cnpj: user.user_metadata?.cnpj || null,
            }, { onConflict: 'id' })
          }

          router.replace('/anunciar-carro')
          return
        }
      }

      // Fallback: check if there's already a session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/anunciar-carro')
      } else {
        router.replace('/entrar')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-heading)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Confirmando e-mail...</p>
    </div>
  )
}
