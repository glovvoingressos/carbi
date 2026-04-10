'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'

interface ConversationItem {
  id: string
  listing_id: string
  last_message_at: string | null
  last_message_preview: string | null
  is_unread: boolean
  vehicle_listings_public: {
    slug: string
    title: string
    price: number
    city: string
    state: string
    images: Array<{ url: string }> | null
  }
}

interface MessageItem {
  id: string
  sender_user_id: string
  message: string
  created_at: string
}

export default function ConversationInbox() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const searchParams = useSearchParams()
  const selectedFromQuery = searchParams.get('conversation')

  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromQuery)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [sending, setSending] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId],
  )

  useEffect(() => {
    if (!supabaseReady) {
      setReady(true)
      setAuthenticated(false)
      setError('Chat indisponível: Supabase não configurado no ambiente.')
      return
    }

    let unsubscribe: (() => void) | null = null

    const init = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setAuthenticated(!!session)
      setToken(session?.access_token || null)
      setMyUserId(session?.user.id || null)
      setReady(true)

      const { data } = supabase.auth.onAuthStateChange((_event, updated) => {
        setAuthenticated(!!updated)
        setToken(updated?.access_token || null)
        setMyUserId(updated?.user.id || null)
      })
      unsubscribe = () => data.subscription.unsubscribe()
    }

    void init()

    return () => {
      unsubscribe?.()
    }
  }, [supabaseReady])

  const fetchConversations = async (accessToken: string) => {
    setLoadingConversations(true)
    try {
      const response = await fetch('/api/marketplace/conversations', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao carregar conversas.')
      }

      setConversations(payload)
      if (!selectedId && payload.length > 0) {
        setSelectedId(payload[0].id)
      }
    } catch (conversationError) {
      setError(conversationError instanceof Error ? conversationError.message : 'Falha ao carregar conversas.')
    } finally {
      setLoadingConversations(false)
    }
  }

  const fetchMessages = async (accessToken: string, conversationId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/marketplace/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao carregar mensagens.')
      }

      setMessages(payload)

      await fetch(`/api/marketplace/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : 'Falha ao carregar mensagens.')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (!token) return
    void fetchConversations(token)
  }, [token])

  useEffect(() => {
    if (!token || !selectedId) return
    void fetchMessages(token, selectedId)

    const interval = window.setInterval(() => {
      void fetchMessages(token, selectedId)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [token, selectedId])

  const sendMessage = async () => {
    if (!token || !selectedId || !messageText.trim()) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao enviar mensagem.')
      }

      setMessageText('')
      setMessages((prev) => [...prev, payload])
      await fetchConversations(token)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Falha ao enviar mensagem.')
    } finally {
      setSending(false)
    }
  }

  if (!ready) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    return <AuthCard />
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-border bg-white p-3">
        <h3 className="px-2 py-1 text-sm font-black uppercase tracking-wider text-dark">Conversas</h3>
        {loadingConversations ? <p className="p-2 text-sm text-text-secondary">Carregando...</p> : null}

        <div className="mt-2 space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`w-full rounded-2xl border px-3 py-2 text-left ${selectedId === conversation.id ? 'border-dark bg-surface' : 'border-border bg-white'}`}
            >
              <p className="line-clamp-1 text-sm font-bold text-dark">{conversation.vehicle_listings_public.title}</p>
              <p className="text-xs font-semibold text-text-secondary">{formatBRL(Number(conversation.vehicle_listings_public.price))}</p>
              <p className="line-clamp-1 text-xs text-text-tertiary">{conversation.last_message_preview || 'Conversa iniciada.'}</p>
            </button>
          ))}

          {conversations.length === 0 && !loadingConversations ? (
            <p className="p-2 text-sm text-text-secondary">Você ainda não possui conversas.</p>
          ) : null}
        </div>
      </aside>

      <section className="rounded-3xl border border-border bg-white p-4">
        {!selectedConversation ? (
          <p className="text-sm text-text-secondary">Selecione uma conversa para começar.</p>
        ) : (
          <>
            <div className="mb-3 border-b border-border pb-3">
              <p className="font-black text-dark">{selectedConversation.vehicle_listings_public.title}</p>
              <p className="text-xs font-semibold text-text-secondary">
                {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} • {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
              </p>
            </div>

            <div className="h-[360px] space-y-2 overflow-y-auto rounded-2xl bg-surface p-3">
              {loadingMessages ? <p className="text-sm text-text-secondary">Carregando mensagens...</p> : null}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.sender_user_id === myUserId ? 'ml-auto bg-dark text-white' : 'bg-white border border-border text-dark'}`}
                >
                  <p>{message.message}</p>
                  <p className="mt-1 text-[10px] opacity-70">{new Date(message.created_at).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder="Digite sua mensagem"
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm"
              />
              <button
                type="button"
                disabled={sending || !messageText.trim()}
                onClick={() => void sendMessage()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-dark text-white disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}

        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      </section>
    </div>
  )
}
