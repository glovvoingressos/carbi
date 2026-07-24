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

  if (loading) return <div className="flex items-center justify-center min-h-dvh bg-[#F7F7F7]"><Loader2 className="w-5 h-5 animate-spin text-[#999]" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#D4F576]/30 flex items-center justify-center mx-auto mb-5 border border-[#D4F576]">
            <Heart className="w-7 h-7 text-gray-900" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2 font-[family-name:var(--font-heading)]">Nenhum veículo favorito ainda</h2>
          <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">Salve seus carros favoritos para acompanhar variações de preço, comparar ofertas e contatar vendedores.</p>
          <Link href="/carros-a-venda" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-950 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm min-h-[44px]">
            <Search className="w-4 h-4 text-[#D4F576]" strokeWidth={2} /> Buscar ofertas de seminovos
          </Link>
        </div>
      </motion.div>
    </AccountLayout>
  )
}
