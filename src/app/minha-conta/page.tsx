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
      <div className="account-loading space-y-6" aria-busy="true">
        <span className="sr-only" role="status">Carregando sua conta…</span>
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
      <div className="account-dashboard min-w-0 space-y-6">
        {/* Hero Welcome */}
        <div className="account-welcome relative overflow-hidden rounded-[32px] p-5 md:p-8">
          <div className="account-welcome-glow absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <h1 className="account-welcome-title text-3xl font-bold tracking-tight md:text-4xl">
              Olá, {user.fullName?.split(' ')[0] || 'Usuário'}
            </h1>
            <p className="account-welcome-copy mt-3 max-w-[38rem] text-sm md:text-base">Seu espaço para vender, acompanhar e decidir melhor.</p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/minha-conta/anuncios"
                className="account-primary-cta inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                Novo anúncio
              </Link>
              <Link
                href="/carros-a-venda"
                className="account-secondary-cta inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors"
              >
                Explorar seminovos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href="/minha-conta/anuncios" data-tone="brand" className="account-stat-card group rounded-[24px] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="account-stat-icon flex h-10 w-10 items-center justify-center rounded-[14px]">
                <Car className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="account-stat-arrow ml-auto h-4 w-4 transition-colors" />
            </div>
            <p className="account-stat-value text-2xl font-bold tabular-nums">{dashboardStats.totalListings}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Anúncios totais</p>
          </Link>

          <div data-tone="signal" className="account-stat-card rounded-[24px] border bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="account-stat-icon flex h-10 w-10 items-center justify-center rounded-[14px]">
                <Eye className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="account-stat-value text-2xl font-bold tabular-nums">{dashboardStats.totalViews > 999 ? `${(dashboardStats.totalViews / 1000).toFixed(1)}k` : dashboardStats.totalViews}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Visualizações</p>
          </div>

          <Link href="/minha-conta/anuncios" data-tone="positive" className="account-stat-card group rounded-[24px] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="account-stat-icon flex h-10 w-10 items-center justify-center rounded-[14px]">
                <TrendingUp className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="account-stat-arrow ml-auto h-4 w-4 transition-colors" />
            </div>
            <p className="account-stat-value text-2xl font-bold tabular-nums">{dashboardStats.activeListings}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Ativos agora</p>
          </Link>

          <Link href="/minha-conta/conversas" data-tone="brand" className="account-stat-card group rounded-[24px] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="account-stat-icon flex h-10 w-10 items-center justify-center rounded-[14px]">
                <MessageCircle className="h-5 w-5 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <ArrowUpRight className="account-stat-arrow ml-auto h-4 w-4 transition-colors" />
            </div>
            <p className="account-stat-value text-2xl font-bold tabular-nums">{dashboardStats.unreadMessages}</p>
            <p className="mt-1 text-xs text-[#5C5C66]">Mensagens não lidas</p>
          </Link>
        </div>

        {/* Recent Listings */}
        {recentListings.length > 0 && (
          <div className="account-panel rounded-[28px] border bg-white p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0A0A0A]">Anúncios recentes</h2>
                <p className="mt-0.5 text-sm text-[#5C5C66]">Seus últimos veículos publicados</p>
              </div>
              <Link href="/minha-conta/anuncios" className="account-text-link text-sm font-semibold hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/minha-conta/anuncios`}
                  className="account-list-row flex min-w-0 items-center gap-4 rounded-[18px] p-3 transition-colors sm:p-4"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#F1F1F6]">
                    {listing.images?.[0]?.public_url ? (
                      <img src={listing.images[0].public_url} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="account-list-media flex h-full w-full items-center justify-center">
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
        <div className="account-panel rounded-[28px] border bg-white p-4 sm:p-6">
          <h2 className="mb-5 text-lg font-bold text-[#0A0A0A]">Ações rápidas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/minha-conta/anuncios" className="account-action-primary group flex flex-col items-center gap-3 rounded-[20px] p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00A36A]">
                <Plus className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#0A0A0A]">Novo anúncio</span>
            </Link>
            <Link href="/minha-conta/favoritos" className="account-action-secondary group flex flex-col items-center gap-3 rounded-[20px] p-4 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Heart className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Favoritos</span>
            </Link>
            <Link href="/minha-conta/conversas" className="account-action-secondary group flex flex-col items-center gap-3 rounded-[20px] p-4 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <MessageCircle className="h-6 w-6 text-[#0A0A0A]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Mensagens</span>
            </Link>
            <Link href="/minha-conta/configuracoes" className="account-action-secondary group flex flex-col items-center gap-3 rounded-[20px] p-4 transition-colors">
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
