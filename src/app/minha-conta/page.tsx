'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import ProfilePanel from '@/components/marketplace/ProfilePanel'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Car, Eye, TrendingUp, MessageCircle, Heart, Star, Clock, ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatBRL } from '@/data/cars'

interface DashboardStats {
  totalListings: number
  totalViews: number
  activeListings: number
  unreadMessages: number
}

export default function MinhaContaPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string } | null>(null)
  const [stats, setStats] = useState<{ label: string; value: string | number; icon: any }[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ totalListings: 0, totalViews: 0, activeListings: 0, unreadMessages: 0 })
  const [loading, setLoading] = useState(true)
  const [recentListings, setRecentListings] = useState<any[]>([])

  const loadUserData = useCallback(async () => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = getSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase.from('users').select('full_name,avatar_url').eq('id', session.user.id).maybeSingle()
    setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '' })
  }, [])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      router.replace('/entrar')
      return
    }
    const supabase = getSupabaseBrowserClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/entrar?redirect=/minha-conta'); return }

      const { data } = await supabase.from('users').select('full_name,avatar_url').eq('id', session.user.id).maybeSingle()
      setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '' })

      // Fetch real stats
      const { count: listingsCount } = await supabase
        .from('vehicle_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      const { count: activeCount } = await supabase
        .from('vehicle_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      const { data: listings } = await supabase
        .from('vehicle_listings')
        .select('view_count')
        .eq('user_id', session.user.id)

      const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.view_count || 0), 0) || 0

      setStats([
        { label: 'Anúncios', value: listingsCount || 0, icon: Car },
        { label: 'Visualizações', value: totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews, icon: Eye },
      ])

      setDashboardStats({
        totalListings: listingsCount || 0,
        totalViews: totalViews,
        activeListings: activeCount || 0,
        unreadMessages: 0,
      })

      // Fetch recent listings
      const { data: recent } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentListings(recent || [])

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <AccountLayout user={{ email: '', fullName: '', avatarUrl: '' }} stats={[]}>
      <div className="space-y-6">
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    </AccountLayout>
  )

  if (!user) return null

  return (
    <AccountLayout user={user} stats={stats}>
      <div className="space-y-6">
        {/* Hero Welcome */}
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#D4F576_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Olá, {user.fullName?.split(' ')[0] || 'Usuário'} 👋
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">Bem-vindo de volta à sua área de membros</p>
            
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/minha-conta/anuncios"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#D4F576] text-[#1A1A1A] rounded-xl text-sm font-bold hover:bg-[#C8E64E] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo anúncio
              </Link>
              <Link
                href="/carros-a-venda"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors border border-white/10"
              >
                Explorar seminovos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/minha-conta/anuncios" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4F576]/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#1A1A1A] transition-colors ml-auto" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{dashboardStats.totalListings}</p>
            <p className="text-xs text-gray-500 mt-1">Anúncios totais</p>
          </Link>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#16855C]/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#16855C]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{dashboardStats.totalViews > 999 ? `${(dashboardStats.totalViews / 1000).toFixed(1)}k` : dashboardStats.totalViews}</p>
            <p className="text-xs text-gray-500 mt-1">Visualizações</p>
          </div>

          <Link href="/minha-conta/anuncios" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#16855C]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#16855C]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#1A1A1A] transition-colors ml-auto" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{dashboardStats.activeListings}</p>
            <p className="text-xs text-gray-500 mt-1">Ativos agora</p>
          </Link>

          <Link href="/minha-conta/conversas" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#1A1A1A] transition-colors ml-auto" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{dashboardStats.unreadMessages}</p>
            <p className="text-xs text-gray-500 mt-1">Mensagens não lidas</p>
          </Link>
        </div>

        {/* Recent Listings */}
        {recentListings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Anúncios recentes</h2>
                <p className="text-sm text-gray-500 mt-0.5">Seus últimos veículos publicados</p>
              </div>
              <Link href="/minha-conta/anuncios" className="text-sm font-semibold text-[#1A1A1A] hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/minha-conta/anuncios`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#F8F9FA] transition-colors"
                >
                  <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {listing.images?.[0]?.public_url ? (
                      <img src={listing.images[0].public_url} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1A1A1A]">
                        <Car className="w-5 h-5 text-[#D4F576]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{listing.year}/{listing.year_model} · {listing.mileage?.toLocaleString('pt-BR')} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1A1A1A]">{formatBRL(listing.price)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : 'Vendido'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-5">Ações rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/minha-conta/anuncios" className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#F8F9FA] hover:bg-gray-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#D4F576]/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Novo anúncio</span>
            </Link>
            <Link href="/minha-conta/favoritos" className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#F8F9FA] hover:bg-gray-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#D4F576]/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Favoritos</span>
            </Link>
            <Link href="/minha-conta/conversas" className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#F8F9FA] hover:bg-gray-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#D4F576]/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Mensagens</span>
            </Link>
            <Link href="/minha-conta/configuracoes" className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#F8F9FA] hover:bg-gray-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#D4F576]/20 flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#1A1A1A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Configurações</span>
            </Link>
          </div>
        </div>

        {/* Profile Section */}
        <ProfilePanel onProfileUpdate={loadUserData} />
      </div>
    </AccountLayout>
  )
}

function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
