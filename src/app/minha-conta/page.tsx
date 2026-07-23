'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import ProfilePanel from '@/components/marketplace/ProfilePanel'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Car, Eye } from 'lucide-react'

export default function MinhaContaPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string } | null>(null)
  const [stats, setStats] = useState<{ label: string; value: string | number; icon: any }[]>([])
  const [loading, setLoading] = useState(true)

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

      const { data: listings } = await supabase
        .from('vehicle_listings')
        .select('view_count')
        .eq('user_id', session.user.id)

      const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.view_count || 0), 0) || 0

      setStats([
        { label: 'Anúncios', value: listingsCount || 0, icon: Car },
        { label: 'Visualizações', value: totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews, icon: Eye },
      ])

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh bg-[#F7F7F7]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
        <p className="text-sm text-[#999]">Carregando...</p>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <AccountLayout user={user} stats={stats}>
      <ProfilePanel onProfileUpdate={loadUserData} />
    </AccountLayout>
  )
}
