'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, CheckCheck, MessageCircle, Tag, Car, Settings, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'

interface Notification {
  id: string; type: string; title: string; body: string | null
  link: string | null; read: boolean; created_at: string
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; colorClass: string; bgClass: string }> = {
  message:           { icon: <MessageCircle size={16} />, colorClass: 'text-blue-600',   bgClass: 'bg-blue-50' },
  offer:             { icon: <Tag size={16} />,           colorClass: 'text-green-600',  bgClass: 'bg-green-50' },
  listing_published: { icon: <Car size={16} />,           colorClass: 'text-orange-600', bgClass: 'bg-orange-50' },
  listing_removed:   { icon: <Car size={16} />,           colorClass: 'text-red-600',    bgClass: 'bg-red-50' },
}
const DEFAULT_TYPE = { icon: <Settings size={16} />, colorClass: 'text-gray-500', bgClass: 'bg-gray-100' } as const

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
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  )
}

function NotificationHeader({ unreadCount, onMarkAllRead, markingAll }: { unreadCount: number; onMarkAllRead: () => void; markingAll: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
          <Bell size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Notificações</h1>
          {unreadCount > 0 && <p className="text-sm text-[var(--color-text-secondary)]">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>}
        </div>
      </div>
      {unreadCount > 0 && (
        <button onClick={onMarkAllRead} disabled={markingAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
          {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
          Marcar todas como lidas
        </button>
      )}
    </div>
  )
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const cfg = TYPE_CONFIG[notification.type] ?? DEFAULT_TYPE
  const read = notification.read
  return (
    <motion.button layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      onClick={() => { if (!read) onRead(notification.id); if (notification.link) window.location.href = notification.link }}
      className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        read ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-[var(--color-accent)]/[0.04] border-l-[3px] border-l-[var(--color-accent)] border-t-gray-100 border-r-gray-100 border-b-gray-100 hover:bg-[var(--color-accent)]/[0.07]'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.bgClass} ${cfg.colorClass}`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${read ? 'font-medium' : 'font-semibold'} text-[var(--color-text-primary)]`}>{notification.title}</p>
          {!read && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0 mt-1.5" />}
        </div>
        {notification.body && <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-snug line-clamp-2">{notification.body}</p>}
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 opacity-60">{relativeTime(notification.created_at)}</p>
      </div>
    </motion.button>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Bell size={28} className="text-gray-400" /></div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Nenhuma notificação ainda</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">Quando alguém interagir com seus anúncios, você será notificado aqui.</p>
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

  if (!ready) return <main className="fingen-shell"><div className="fingen-shell-content pt-6 pb-24 max-w-2xl mx-auto flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div></main>
  if (!authenticated) return <main className="fingen-shell"><div className="fingen-shell-content pt-6 pb-24 max-w-md mx-auto"><AuthCard redirectTo="/notificacoes" /></div></main>

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <main className="fingen-shell">
      <div className="fingen-shell-content pt-6 pb-24 max-w-2xl mx-auto px-4">
        <NotificationHeader unreadCount={unreadCount} onMarkAllRead={markAllRead} markingAll={markingAll} />
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}</div>
        ) : notifications.length === 0 ? <EmptyState /> : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={markRead} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
