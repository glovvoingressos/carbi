'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import Link from 'next/link'
import { Heart, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function FavoritosPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) { router.replace('/entrar'); return }
    const supabase = getSupabaseBrowserClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/entrar?redirect=/minha-conta/favoritos'); return }
      const { data } = await supabase.from('users').select('full_name,avatar_url').eq('id', session.user.id).maybeSingle()
      setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '' })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-secondary)]" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-7 h-7 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-2">Nenhum favorito ainda</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">Salve seus carros favoritos para comparar preços e specs depois.</p>
          <Link href="/carros-a-venda" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-dark)] text-white rounded-full text-sm font-semibold hover:bg-[var(--color-dark-hover)] transition-colors">
            <Search className="w-4 h-4" strokeWidth={2} /> Buscar carros
          </Link>
        </div>
      </motion.div>
    </AccountLayout>
  )
}
