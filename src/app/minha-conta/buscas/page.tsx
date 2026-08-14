'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import BuscasPage from '@/components/buyer/BuscasPage'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function MinhasBuscasPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string; phone?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) { router.replace('/entrar'); return }
    const supabase = getSupabaseBrowserClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/entrar?redirect=/minha-conta/buscas'); return }
      const { data: profile } = await supabase.from('users').select('full_name,avatar_url,phone').eq('id', session.user.id).maybeSingle()
      setUser({ email: session.user.email || '', fullName: profile?.full_name || '', avatarUrl: profile?.avatar_url || '', phone: profile?.phone || '' })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-secondary)]" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <BuscasPage />
    </AccountLayout>
  )
}