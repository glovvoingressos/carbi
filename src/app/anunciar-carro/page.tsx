'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

export default function AnunciarCarroPage() {
  const router = useRouter()

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      router.replace('/entrar?redirect=/anunciar-carro/fluxo')
      return
    }

    const supabase = getSupabaseBrowserClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/anunciar-carro/fluxo')
      } else {
        router.replace('/entrar?redirect=/anunciar-carro/fluxo')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Verificando autenticação...</p>
    </div>
  )
}
