'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import Link from 'next/link'
import { Heart, Search } from 'lucide-react'
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <Heart className="w-7 h-7 text-blue-500" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Nenhum favorito ainda</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-[280px]">
          Salve carros favoritos para acompanhar preços e comparar ofertas.
        </p>
        <Link
          href="/carros-a-venda"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Search className="w-4 h-4" strokeWidth={2} />
          Buscar seminovos
        </Link>
      </div>
    </AccountLayout>
  )
}
