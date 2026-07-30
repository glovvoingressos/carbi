'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import Link from 'next/link'
import { Heart, Search, Star, Sparkles } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function FavoritosPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string; phone?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) { router.replace('/entrar'); return }
    const supabase = getSupabaseBrowserClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/entrar?redirect=/minha-conta/favoritos'); return }
      const { data } = await supabase.from('users').select('full_name,avatar_url,phone').eq('id', session.user.id).maybeSingle()
      setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '', phone: data?.phone || '' })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 bg-gray-100 rounded-2xl animate-pulse w-48" />
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Favoritos</h1>
          <p className="text-sm text-gray-500 mt-1">Veículos que você salvou para acompanhar</p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 rounded-2xl bg-[#D4F576]/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Nenhum favorito ainda</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-[360px] mx-auto leading-relaxed">
            Salve carros favoritos para acompanhar variações de preço, comparar ofertas e contatar vendedores rapidamente.
          </p>
          <Link
            href="/carros-a-venda"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1A1A1A] text-[#D4F576] rounded-2xl text-base font-bold hover:bg-[#2D2D2D] transition-all shadow-lg shadow-[#1A1A1A]/20"
          >
            <Search className="w-5 h-5" />
            Explorar seminovos
          </Link>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#1A1A1A] mb-4">Como funciona</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4F576]/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Salve veículos</p>
                <p className="text-xs text-gray-500 mt-1">Clique no ícone de favorito em qualquer anúncio</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4F576]/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Acompanhe preços</p>
                <p className="text-xs text-gray-500 mt-1">Receba alertas quando o preço mudar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4F576]/20 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Compare opções</p>
                <p className="text-xs text-gray-500 mt-1">Encontre o melhor custo-benefício</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
