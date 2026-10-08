'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Car, Eye, MessageCircle, TrendingUp } from 'lucide-react'
import AccountLayout, { type AccountWorkspaceListing } from '@/components/marketplace/AccountLayout'
import MemberOverview, { type MemberConversation, type MemberMetrics } from '@/components/marketplace/MemberOverview'
import ProfilePanel from '@/components/marketplace/ProfilePanel'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

type AccountUser = { email: string; fullName: string; avatarUrl: string; phone?: string }
type LoadState = { loading: boolean; error: string | null }
type ListingImage = { public_url: string; sort_order?: number; is_primary?: boolean }
type ApiListing = AccountWorkspaceListing & { images?: ListingImage[] | null }

const pending: LoadState = { loading: true, error: null }
const unknownMetrics: MemberMetrics = { totalListings: null, totalViews: null, activeListings: null }
const blankUser: AccountUser = { email: '', fullName: '', avatarUrl: '' }

async function fetchArray<T>(url: string, token: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error('Não foi possível carregar os dados.')
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Resposta inválida.')
  return data as T[]
}

async function loadMetrics(userId: string, signal: AbortSignal): Promise<MemberMetrics> {
  const supabase = getSupabaseBrowserClient()
  const [total, active, views] = await Promise.all([
    supabase.from('vehicle_listings').select('id', { count: 'exact', head: true }).eq('user_id', userId).abortSignal(signal),
    supabase.from('vehicle_listings').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active').abortSignal(signal),
    (async () => {
      // The Data API caps each response; read every page before presenting a total.
      let sum = 0
      const pageSize = 500
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from('vehicle_listings')
          .select('id,view_count').eq('user_id', userId).order('id')
          .range(offset, offset + pageSize - 1).abortSignal(signal)
        if (error || !data) throw new Error('Falha ao carregar visualizações.')
        for (const listing of data) sum += listing.view_count ?? 0
        if (data.length < pageSize) return sum
      }
    })(),
  ])
  if (total.error || active.error || total.count === null || active.count === null) {
    throw new Error('Falha ao carregar os totais.')
  }
  return { totalListings: total.count, activeListings: active.count, totalViews: views }
}

function MinhaContaWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<AccountUser | null>(null)
  const [listings, setListings] = useState<AccountWorkspaceListing[]>([])
  const [conversations, setConversations] = useState<MemberConversation[]>([])
  const [metrics, setMetrics] = useState<MemberMetrics>(unknownMetrics)
  const [authState, setAuthState] = useState<LoadState>(pending)
  const [profileState, setProfileState] = useState<LoadState>(pending)
  const [listingState, setListingState] = useState<LoadState>(pending)
  const [conversationState, setConversationState] = useState<LoadState>(pending)
  const [metricState, setMetricState] = useState<LoadState>(pending)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setAuthState(pending)
    setProfileState(pending)
    setListingState(pending)
    setConversationState(pending)
    setMetricState(pending)
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    if (!isSupabaseBrowserConfigured()) {
      router.replace('/entrar')
      return () => controller.abort()
    }

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        if (signal.aborted) return
        if (error) throw error
        if (!session) {
          router.replace('/entrar?redirect=/minha-conta')
          return
        }
        const accountUser: AccountUser = { ...blankUser, email: session.user.email || '' }
        setUser((current) => current ?? accountUser)
        setAuthState({ loading: false, error: null })

        // Each panel settles independently, so one unavailable source cannot hide the rest.
        await Promise.allSettled([
          (async () => {
            try {
              const { data, error: profileError } = await supabase.from('users')
                .select('full_name,avatar_url,phone').eq('id', session.user.id).abortSignal(signal).maybeSingle()
              if (profileError) throw profileError
              if (signal.aborted) return
              setUser({ ...accountUser, fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '', phone: data?.phone || '' })
              setProfileState({ loading: false, error: null })
            } catch {
              if (!signal.aborted) setProfileState({ loading: false, error: 'Não foi possível carregar seus dados de perfil.' })
            }
          })(),
          (async () => {
            try {
              const data = await fetchArray<ApiListing>('/api/marketplace/my-listings', session.access_token, signal)
              if (signal.aborted) return
              setListings(data.map((listing) => ({
                ...listing,
                images: [...(listing.images || [])].sort((a, b) =>
                  Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order ?? 0) - (b.sort_order ?? 0)),
              })))
              setListingState({ loading: false, error: null })
            } catch {
              if (!signal.aborted) setListingState({ loading: false, error: 'Não foi possível carregar seus anúncios.' })
            }
          })(),
          (async () => {
            try {
              const data = await fetchArray<MemberConversation>('/api/marketplace/conversations', session.access_token, signal)
              if (signal.aborted) return
              setConversations(data)
              setConversationState({ loading: false, error: null })
            } catch {
              if (!signal.aborted) setConversationState({ loading: false, error: 'Não foi possível carregar suas conversas.' })
            }
          })(),
          (async () => {
            try {
              const data = await loadMetrics(session.user.id, signal)
              if (signal.aborted) return
              setMetrics(data)
              setMetricState({ loading: false, error: null })
            } catch {
              if (!signal.aborted) setMetricState({ loading: false, error: 'Não foi possível carregar o desempenho dos anúncios.' })
            }
          })(),
        ])
      } catch {
        if (!signal.aborted) setAuthState({ loading: false, error: 'Não foi possível acessar sua conta. Tente novamente.' })
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt, router])

  const refreshProfile = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) { router.replace('/entrar?redirect=/minha-conta'); return }
      const { data, error: profileError } = await supabase.from('users')
        .select('full_name,avatar_url,phone').eq('id', session.user.id).maybeSingle()
      if (profileError) throw profileError
      setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '', phone: data?.phone || '' })
      setProfileState({ loading: false, error: null })
    } catch {
      setProfileState({ loading: false, error: 'Seu perfil não pôde ser atualizado no painel. Tente novamente.' })
    }
  }, [router])

  const metricsReady = !metricState.loading && !metricState.error
  const conversationsReady = !conversationState.loading && !conversationState.error
  const shellStats = [
    { label: 'Anúncios', value: metricsReady ? metrics.totalListings ?? '—' : '—', icon: Car },
    { label: 'Visualizações', value: metricsReady ? metrics.totalViews ?? '—' : '—', icon: Eye },
    { label: 'Ativos', value: metricsReady ? metrics.activeListings ?? '—' : '—', icon: TrendingUp },
    { label: 'Conversas', value: conversationsReady ? conversations.length : '—', icon: MessageCircle },
  ]

  return (
    <AccountLayout
      user={user || blankUser}
      stats={shellStats}
      listings={listings}
      loading={authState.loading || listingState.loading}
      listingsError={listingState.error}
      onListingsRetry={retry}
    >
      {authState.error ? (
        <div className="member-overview-notice" role="alert">
          <p>{authState.error}</p>
          <Button variant="outline" onClick={retry}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          {profileState.error && (
            <div className="member-overview-notice" role="alert">
              <p>{profileState.error}</p>
              <Button variant="outline" onClick={retry}>Tentar novamente</Button>
            </div>
          )}
          {searchParams.get('tab') === 'perfil' ? (
            user && <ProfilePanel onProfileUpdate={refreshProfile} />
          ) : (
            <MemberOverview
              listings={listings}
              conversations={conversations}
              metrics={metrics}
              selectedVehicleId={searchParams.get('vehicle')}
              listingState={listingState}
              conversationState={conversationState}
              metricState={metricState}
              onRetry={retry}
            />
          )}
        </>
      )}
    </AccountLayout>
  )
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={<AccountLayout user={blankUser} loading><div className="member-overview-notice" role="status">Carregando sua conta…</div></AccountLayout>}>
      <MinhaContaWorkspace />
    </Suspense>
  )
}
