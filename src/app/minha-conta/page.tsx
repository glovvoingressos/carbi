'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import ProfilePanel from '@/components/marketplace/ProfilePanel'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Car, Eye, TrendingUp, MessageCircle, Heart, Star, Clock, ArrowUpRight, Plus, Settings } from 'lucide-react'
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
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string; phone?: string } | null>(null)
  const [stats, setStats] = useState<{ label: string; value: string | number; icon: any }[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ totalListings: 0, totalViews: 0, activeListings: 0, unreadMessages: 0 })
  const [loading, setLoading] = useState(true)
  const [recentListings, setRecentListings] = useState<any[]>([])

  const loadUserData = useCallback(async () => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = getSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase.from('users').select('full_name,avatar_url,phone').eq('id', session.user.id).maybeSingle()
    setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '', phone: data?.phone || '' })
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

      const { data } = await supabase.from('users').select('full_name,avatar_url,phone').eq('id', session.user.id).maybeSingle()
      setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '', phone: data?.phone || '' })

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
      <div className="min-w-0 space-y-6">
        {/* Hero Welcome */}
        <div className="relative overflow-hidden rounded-[32px] bg-[#00A36A] p-5 text-[#0A0A0A] md:p-8">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#B8FF00]/30 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">Carbi member space</p>
            <h1 className="text-[14px] font-bold tracking-tight text-[#0A0A0A] md:text-[15px]">
              Olá, {user.fullName?.split(' ')[0] || 'Usuário'} 👋
            </h1>
            <p className="mt-2 text-xs text-black/70 md:text-sm">Seu espaço para vender, acompanhar e decidir melhor.</p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/minha-conta/anuncios"
                className="inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-5 py-3 text-sm font-bold text-[#0A0A0A] transition-transform hover:-translate-y-0.5 hover:bg-[#A9EE00]"
              >
                <Plus className="w-4 h-4" />
                Novo anúncio
              </Link>
              <Link
                href="/carros-a-venda"
                className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/65 px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-white/85"
              >
                Explorar seminovos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href="/minha-conta/anuncios" className="group rounded-[24px] border border-black/[0.06] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#B8FF00]">
                <Car className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-black/20 transition-colors group-hover:text-[#0A0A0A]" />
            </div>
            <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{dashboardStats.totalListings}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Anúncios totais</p>
          </Link>

          <div className="rounded-[24px] border border-black/[0.06] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#00A36A]">
                <Eye className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{dashboardStats.totalViews > 999 ? `${(dashboardStats.totalViews / 1000).toFixed(1)}k` : dashboardStats.totalViews}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Visualizações</p>
          </div>

          <Link href="/minha-conta/anuncios" className="group rounded-[24px] border border-black/[0.06] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1F1F6]">
                <TrendingUp className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-black/20 transition-colors group-hover:text-[#0A0A0A]" />
            </div>
            <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{dashboardStats.activeListings}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Ativos agora</p>
          </Link>

          <Link href="/minha-conta/conversas" className="group rounded-[24px] border border-black/[0.06] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#B8FF00]">
                <MessageCircle className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-black/20 transition-colors group-hover:text-[#0A0A0A]" />
            </div>
            <p className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">{dashboardStats.unreadMessages}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Mensagens não lidas</p>
          </Link>
        </div>

        {/* Recent Listings */}
        {recentListings.length > 0 && (
          <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Anúncios recentes</h2>
                <p className="mt-0.5 text-sm text-[#5C5C66]">Seus últimos veículos publicados</p>
              </div>
              <Link href="/minha-conta/anuncios" className="text-sm font-semibold text-[#0A0A0A] hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/minha-conta/anuncios`}
                  className="flex min-w-0 items-center gap-4 rounded-[18px] p-3 transition-colors hover:bg-[#F1F1F6] sm:p-4"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#F1F1F6]">
                    {listing.images?.[0]?.public_url ? (
                      <img src={listing.images[0].public_url} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#00A36A]">
                        <Car className="h-5 w-5 text-[#0A0A0A]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0A0A0A]">{listing.title}</p>
                    <p className="mt-0.5 text-xs text-[#5C5C66]">{listing.year}/{listing.year_model} · {listing.mileage?.toLocaleString('pt-BR')} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0A0A0A]">{formatBRL(listing.price)}</p>
                    <p className="mt-0.5 text-[10px] text-[#5C5C66]">{listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : 'Vendido'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="rounded-[28px] border border-black/[0.06] bg-white p-4 sm:p-6">
          <h2 className="mb-5 text-[14px] font-bold text-[#0A0A0A] md:text-[15px]">Ações rápidas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/minha-conta/anuncios" className="group flex flex-col items-center gap-3 rounded-[20px] bg-[#B8FF00] p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00A36A]">
                <Plus className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#0A0A0A]">Novo anúncio</span>
            </Link>
            <Link href="/minha-conta/favoritos" className="group flex flex-col items-center gap-3 rounded-[20px] bg-[#F1F1F6] p-4 transition-colors hover:bg-[#E7E7ED]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Heart className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Favoritos</span>
            </Link>
            <Link href="/minha-conta/conversas" className="group flex flex-col items-center gap-3 rounded-[20px] bg-[#F1F1F6] p-4 transition-colors hover:bg-[#E7E7ED]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <MessageCircle className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Mensagens</span>
            </Link>
            <Link href="/minha-conta/configuracoes" className="group flex flex-col items-center gap-3 rounded-[20px] bg-[#F1F1F6] p-4 transition-colors hover:bg-[#E7E7ED]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Settings className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
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
