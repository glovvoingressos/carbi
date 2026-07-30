'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    ;(async () => {
      try {
        const hash = window.location.hash
        if (hash) {
          const p = new URLSearchParams(hash.substring(1))
          const at = p.get('access_token')
          const rt = p.get('refresh_token')
          if (at && rt) {
            const { error: e } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })
            if (e) throw e
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              await supabase.from('users').upsert({
                id: user.id, email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              }, { onConflict: 'id' })
              try {
                await fetch('/api/auth/welcome', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || user.email?.split('@')[0] }),
                })
              } catch (e) { console.error('Welcome email failed:', e) }
            }
            return router.replace('/minha-conta')
          }
        }
        const { data: { session } } = await supabase.auth.getSession()
        router.replace(session ? '/minha-conta' : '/entrar')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível confirmar seu e-mail. Tente fazer login novamente.')
      }
    })()
  }, [router])

  if (error) {
    return (<div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-red-500 text-center max-w-sm">{error}</p>
      <button onClick={() => router.replace('/entrar')} className="text-sm underline text-gray-500">Voltar ao login</button>
    </div>)
  }

  return (<div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Confirmando e-mail...</p>
    </div>
  </div>)
}
