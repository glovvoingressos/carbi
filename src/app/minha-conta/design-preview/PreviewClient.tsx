'use client'

import Link from 'next/link'
import { Car, Eye, MessageCircle, TrendingUp } from 'lucide-react'
import AccountLayout from '@/components/marketplace/AccountLayout'
import MemberOverview from '@/components/marketplace/MemberOverview'
import ProfilePanel from '@/components/marketplace/ProfilePanel'
import {
  emptyConversations,
  emptyListings,
  emptyMetrics,
  messages,
  previewConversations,
  previewListings,
  previewMetrics,
  previewUser,
  type PreviewView,
} from './fixtures'
import './design-preview.css'

const views: { value: PreviewView; label: string; hint: string }[] = [
  { value: 'populated', label: 'Populado', hint: '4 anúncios' },
  { value: 'empty', label: 'Vazio', hint: 'conta nova' },
  { value: 'loading', label: 'Carregando', hint: 'esqueleto' },
  { value: 'error', label: 'Erro', hint: 'falha de rede' },
]

const ready = { loading: false, error: null } as const
const loading = { loading: true, error: null } as const
const failed = (error: string) => ({ loading: false, error })

export default function PreviewClient({ view, tab }: { view: PreviewView; tab?: string }) {
  const profile = tab === 'perfil'
  const empty = view === 'empty'
  const isLoading = view === 'loading'
  const isError = view === 'error'

  const listings = isLoading || isError ? [] : empty ? emptyListings : previewListings
  const conversations = isLoading || isError ? [] : empty ? emptyConversations : previewConversations
  const metrics = isLoading || isError ? emptyMetrics : empty ? emptyMetrics : previewMetrics
  const listingState = isLoading ? loading : isError ? failed(messages.listings) : ready
  const conversationState = isLoading ? loading : isError ? failed(messages.conversations) : ready
  const metricState = isLoading ? loading : isError ? failed(messages.metrics) : ready

  const stats = [
    { label: 'Anúncios', value: metrics.totalListings ?? '—', icon: Car },
    { label: 'Visualizações', value: metrics.totalViews ?? '—', icon: Eye },
    { label: 'Ativos', value: metrics.activeListings ?? '—', icon: TrendingUp },
    { label: 'Conversas', value: conversations.length, icon: MessageCircle },
  ]

  const hrefFor = (value: PreviewView) =>
    `/minha-conta/design-preview?${new URLSearchParams({ view: value, ...(profile ? { tab: 'perfil' } : {}) })}`

  return (
    <>
      <AccountLayout
        user={previewUser}
        stats={stats}
        listings={listings}
        loading={isLoading}
        listingsError={isError ? messages.listings : null}
        onListingsRetry={() => undefined}
        activePath="/minha-conta"
      >
        {profile ? (
          <ProfilePanel onProfileUpdate={() => undefined} />
        ) : (
          <MemberOverview
            listings={listings}
            conversations={conversations}
            metrics={metrics}
            selectedVehicleId={null}
            listingState={listingState}
            conversationState={conversationState}
            metricState={metricState}
            onRetry={() => undefined}
          />
        )}
      </AccountLayout>

      <details className="dp-switcher">
        <summary>◐ Preview de desenvolvimento</summary>
        <div className="dp-panel">
          <p>Estado do painel</p>
          {views.map((item) => (
            <Link key={item.value} href={hrefFor(item.value)} data-active={!profile && view === item.value}>
              {item.label} <small>{item.hint}</small>
            </Link>
          ))}
          <p style={{ marginTop: 8 }}>Aba</p>
          <Link href="/minha-conta/design-preview" data-active={!profile}>Resumo <small>MemberOverview</small></Link>
          <Link href="/minha-conta/design-preview?tab=perfil" data-active={profile}>Meu perfil <small>ProfilePanel</small></Link>
        </div>
      </details>
    </>
  )
}
