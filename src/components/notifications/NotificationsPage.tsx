'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, Car, MessageCircle, Trash2, Loader2, Inbox } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getIcon(type: string) {
  switch (type) {
    case 'message': return <MessageCircle size={18} />
    case 'listing_published': return <Car size={18} />
    case 'listing_removed': return <Trash2 size={18} />
    default: return <Bell size={18} />
  }
}

function getColor(type: string) {
  switch (type) {
    case 'message': return { bg: 'rgba(90,71,209,0.1)', color: '#5A47D1' }
    case 'listing_published': return { bg: 'rgba(22,133,92,0.1)', color: '#16855C' }
    case 'listing_removed': return { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' }
    default: return { bg: 'rgba(0,0,0,0.06)', color: '#6F6F6F' }
  }
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
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { access_token?: string; user?: { id?: string } } | null } }) => {
      setAuthenticated(!!session)
      setToken(session?.access_token || null)
      setReady(true)
    })
  }, [supabaseReady])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setNotifications(data.notifications || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const markAllRead = async () => {
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
  }

  const markRead = async (id: string) => {
    if (!token) return
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  if (!ready) {
    return (
      <main className="fingen-shell">
        <div className="fingen-shell-content" style={{ paddingTop: 24, paddingBottom: 96 }}>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#8A95A8]" />
          </div>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="fingen-shell">
        <div className="fingen-shell-content" style={{ paddingTop: 24, paddingBottom: 96, maxWidth: 480, margin: '0 auto' }}>
          <AuthCard redirectTo="/notificacoes" />
        </div>
      </main>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <main className="fingen-shell">
      <div className="fingen-shell-content" style={{ paddingTop: 24, paddingBottom: 96, maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-inverse)] flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
                Notificações
              </h1>
              {unreadCount > 0 && (
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors"
              style={{ background: 'var(--color-bg-elevated)', border: '1.5px solid var(--color-border-strong)', color: 'var(--color-text-secondary)' }}
            >
              {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Marcar todas como lidas
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#8A95A8]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-bg-muted)' }}>
              <Inbox size={28} className="text-[#A3A3A3]" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
              Nenhuma notificação
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', maxWidth: 320 }}>
              Quando você receber mensagens, seus anúncios forem publicados ou outras atualizações, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => {
              const icon = getIcon(notification.type)
              const colors = getColor(notification.type)

              return (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) markRead(notification.id)
                    if (notification.link) window.location.href = notification.link
                  }}
                  className="flex items-start gap-3 p-4 rounded-2xl transition-all cursor-pointer"
                  style={{
                    background: notification.read ? 'var(--color-bg-elevated)' : 'rgba(90,71,209,0.04)',
                    border: `1.5px solid ${notification.read ? 'var(--color-border)' : 'rgba(90,71,209,0.12)'}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: colors.bg, color: colors.color }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p style={{
                        fontSize: 14,
                        fontWeight: notification.read ? 500 : 600,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.4,
                      }}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--iris)' }} />
                      )}
                    </div>
                    {notification.body && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2, lineHeight: 1.4 }}>
                        {notification.body}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--color-text-disabled)', marginTop: 4 }}>
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
