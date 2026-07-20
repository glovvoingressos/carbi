'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Eye, Car, Users, MessageCircle, TrendingUp, Calendar } from 'lucide-react'

interface AdminSummary {
  total_listings: number
  active_listings: number
  total_views: number
  unique_viewers_30d: number
  total_users: number
  listings_created_7d: number
}

interface TopListing {
  id: string
  title: string
  brand: string
  model: string
  view_count: number
  status: string
  created_at: string
}

interface DailyViews {
  date: string
  views: number
}

export default function AdminAnalytics() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [topListings, setTopListings] = useState<TopListing[]>([])
  const [dailyViews, setDailyViews] = useState<DailyViews[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics/summary').then((r) => r.json()),
      fetch('/api/admin/analytics/top-listings').then((r) => r.json()),
      fetch('/api/admin/analytics/views-by-day').then((r) => r.json()),
    ])
      .then(([s, t, d]) => {
        setSummary(s)
        setTopListings(Array.isArray(t) ? t : [])
        setDailyViews(Array.isArray(d) ? d : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A95A8] font-bold">Carregando analytics...</div>
      </div>
    )
  }

  const maxDailyViews = Math.max(...dailyViews.map((d) => d.views), 1)

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-black tracking-tight">Analytics Admin</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Car, label: 'Anúncios ativos', value: summary.active_listings, color: '#D4F576' },
            { icon: Eye, label: 'Views totais', value: summary.total_views, color: '#93C5FD' },
            { icon: Users, label: 'Usuários', value: summary.total_users, color: '#C9B8FF' },
            { icon: TrendingUp, label: 'Criados (7d)', value: summary.listings_created_7d, color: '#39E09B' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-[#EAEAE8] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <div className="text-3xl font-black">{card.value.toLocaleString('pt-BR')}</div>
              <div className="text-xs font-bold text-[#8A95A8] uppercase tracking-wider">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Views Chart */}
      <div className="bg-white rounded-2xl border border-[#EAEAE8] p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-[#8A95A8]" />
          <h2 className="font-black text-lg">Views por dia (últimos 30 dias)</h2>
        </div>
        <div className="flex items-end gap-1 h-40">
          {dailyViews.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[#D4F576] transition-all"
                style={{ height: `${(d.views / maxDailyViews) * 100}%`, minHeight: d.views > 0 ? 2 : 0 }}
                title={`${d.date}: ${d.views} views`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#A3A3A3] font-bold">
          {dailyViews.length > 0 && (
            <>
              <span>{dailyViews[0]?.date}</span>
              <span>{dailyViews[dailyViews.length - 1]?.date}</span>
            </>
          )}
        </div>
      </div>

      {/* Top Listings */}
      <div className="bg-white rounded-2xl border border-[#EAEAE8] p-8 space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} className="text-[#8A95A8]" />
          <h2 className="font-black text-lg">Top anúncios por views</h2>
        </div>
        <div className="space-y-2">
          {topListings.map((listing, i) => (
            <div key={listing.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAF9] transition-colors">
              <span className="text-sm font-black text-[#A3A3A3] w-6 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{listing.title}</div>
                <div className="text-xs text-[#8A95A8]">{listing.brand} {listing.model}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm">{listing.view_count.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-[#8A95A8]">views</div>
              </div>
            </div>
          ))}
          {topListings.length === 0 && (
            <p className="text-sm text-[#8A95A8] text-center py-8">Nenhum dado de views ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
