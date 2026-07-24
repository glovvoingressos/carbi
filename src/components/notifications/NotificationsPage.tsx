'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, CheckCheck, MessageCircle, Tag, Car, Settings, Loader2, Check, Inbox } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'

interface Notification {
  id: string; type: string; title: string; body: string | null
  link: string | null; read: boolean; created_at: string
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; colorClass: string; bgClass: string }> = {
  message:           { icon: <MessageCircle size={18} />, colorClass: 'text-blue-600',   bgClass: 'bg-blue-100' },
  offer:             { icon: <Tag size={18} />,           colorClass: 'text-[#16855C]',  bgClass: 'bg-[#16855C]/10' },
  listing_published: { icon: <Car size={18} />,           colorClass: 'text-[#F59E0B]', bgClass: 'bg-[#F59E0B]/10' },
  listing_removed:   { icon: <Car size={18} />,           colorClass: 'text-[#DC2626]',    bgClass: 'bg-[#DC2626]/10' },
}
const DEFAULT_TYPE = { icon: <Settings size={18} />, colorClass: 'text-gray-500', bgClass: 'bg-gray-100' } as const

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) > 1 ? 's' : ''}`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-100" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-2xl bg-[#F8F9FA] flex items-center justify-center mb-6">
        <Inbox size={40} className="text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Nenhuma notificação</h3>
      <p className="text-sm text-gray-500 max-w-[320px] leading-relaxed">
        Quando alguém interagir com seus anúncios, você será notificado aqui.
      </p>
    </motion.div>
  )
}

export default function NotificationsPage() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (!supabaseReady) { setReady(true); return }
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }: { data: { session: { access_token?: string } | null } }) => {
      setAuthenticated(!!session)
      setToken(session?.access_token ?? null)
      setReady(true)
    })
  }, [supabaseReady])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const markAllRead = useCallback(async () => {
    if (!token) return
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {}
    setMarkingAll(false)
  }, [token])

  const markRead = useCallback(async (id: string) => {
    if (!token) return
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }, [token])

  if (!ready) return (
    <div className="space-y-6">
      <div className="h-10 bg-gray-100 rounded-2xl animate-pulse w-48" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <NotificationSkeleton key={i} />)}
      </div>
    </div>
  )
  if (!authenticated) return <div className="py-20"><AuthCard redirectTo="/notificacoes" /></div>

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Notificações</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo lido'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A1A] bg-[#D4F576] hover:bg-[#C8E64E] transition-colors shadow-sm">
            {markingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
            Marcar como lidas
          </button>
        )}
      </div>

      <div className="max-w-3xl">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <NotificationSkeleton key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? DEFAULT_TYPE
                const read = n.read
                return (
                  <motion.button
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={() => { if (!read) markRead(n.id); if (n.link) window.location.href = n.link }}
                    className={`w-full text-left flex items-start gap-5 p-5 rounded-2xl border transition-all cursor-pointer ${
                      read ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm' : 'bg-[#D4F576]/5 border-[#D4F576]/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.bgClass} ${cfg.colorClass}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-base leading-snug ${read ? 'font-medium text-gray-600' : 'font-bold text-[#1A1A1A]'}`}>
                          {n.title}
                        </p>
                        {!read && <span className="w-3 h-3 rounded-full bg-[#D4F576] shrink-0 mt-1.5" />}
                      </div>
                      {n.body && (
                        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2.5">{relativeTime(n.created_at)}</p>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
