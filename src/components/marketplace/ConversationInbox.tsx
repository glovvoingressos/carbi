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
  }, [token, selectedId])

  useEffect(() => {
    if (!token || !myUserId || !selectedId || !supabaseReady) return
    const supabase = getSupabaseBrowserClient()

    const messageChannel = supabase
      .channel(`messages:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${selectedId}`,
        },
        () => {
          void fetchMessages(token, selectedId)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(messageChannel)
    }
  }, [token, myUserId, selectedId, supabaseReady])

  useEffect(() => {
    if (!token || !myUserId || !supabaseReady) return
    const supabase = getSupabaseBrowserClient()

    const sellerChannel = supabase
      .channel(`conversations:seller:${myUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_user_id=eq.${myUserId}`,
        },
        () => {
          void fetchConversations(token)
        },
      )
      .subscribe()

    const buyerChannel = supabase
      .channel(`conversations:buyer:${myUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_user_id=eq.${myUserId}`,
        },
        () => {
          void fetchConversations(token)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(sellerChannel)
      void supabase.removeChannel(buyerChannel)
    }
  }, [token, myUserId, supabaseReady])

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
      await fetchMessages(token, selectedId)
      await fetchConversations(token)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Falha ao enviar mensagem.')
    } finally {
      setSending(false)
    }
  }

  if (!ready) {
    return (
      <div className="bg-white rounded-[32px] border border-border p-20 text-center shadow-sm">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!authenticated) {
    return <AuthCard />
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr] h-[calc(100vh-180px)] min-h-[600px]">
      <aside className="bg-white rounded-[32px] border border-border p-6 shadow-sm flex flex-col h-full overflow-hidden">
        <h3 className="text-2xl font-heading font-black text-text-primary tracking-tight mb-6">Conversas</h3>
        {loadingConversations ? <p className="text-sm font-bold text-text-tertiary mb-4">Carregando...</p> : null}

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`w-full rounded-[24px] p-4 text-left transition-all border ${
                selectedId === conversation.id ? 'bg-accent border-accent text-white shadow-sm' : 'bg-bg-alt border-transparent hover:border-accent hover:bg-bg-alt/80'
              }`}
            >
              <p className={`line-clamp-1 text-base font-heading font-black tracking-tight ${selectedId === conversation.id ? 'text-white' : 'text-text-primary'}`}>{conversation.vehicle_listings_public.title}</p>
              <p className={`text-sm font-bold mt-1 ${selectedId === conversation.id ? 'text-white/80' : 'text-text-secondary'}`}>{formatBRL(Number(conversation.vehicle_listings_public.price))}</p>
              <p className={`line-clamp-1 text-xs font-medium mt-3 ${selectedId === conversation.id ? 'text-white/70' : 'text-text-tertiary'}`}>{conversation.last_message_preview || 'Conversa iniciada.'}</p>
            </button>
          ))}

          {conversations.length === 0 && !loadingConversations ? (
            <div className="text-center p-8 bg-bg-alt rounded-[24px] border border-border">
              <p className="text-sm font-bold text-text-tertiary">Você ainda não possui conversas.</p>
            </div>
          ) : null}
        </div>
      </aside>

      <section className="bg-white rounded-[32px] border border-border shadow-sm flex flex-col h-full overflow-hidden relative">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center bg-bg-alt m-4 rounded-[24px]">
            <p className="text-lg font-bold text-text-tertiary">Selecione uma conversa para começar.</p>
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-border bg-white z-10">
              <p className="text-2xl font-heading font-black text-text-primary tracking-tight">{selectedConversation.vehicle_listings_public.title}</p>
              <p className="text-sm font-bold text-text-secondary mt-1">
                {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} • {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-bg-alt custom-scrollbar">
              {loadingMessages ? <p className="text-sm font-bold text-text-tertiary text-center">Carregando mensagens...</p> : null}
              {messages.map((message) => {
                const isMine = message.sender_user_id === myUserId
                return (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-[24px] px-6 py-4 text-base font-medium shadow-sm ${
                      isMine
                        ? 'ml-auto bg-accent text-white rounded-br-none shadow-sm'
                        : 'bg-white text-text-primary rounded-bl-none border border-border'
                    }`}
                  >
                    <p className="leading-relaxed">{message.message}</p>
                    <p className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${isMine ? 'text-white/60' : 'text-text-tertiary'}`}>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )
              })}
            </div>

            <div className="p-6 bg-white border-t border-border">
              <div className="flex items-center gap-4 bg-bg-alt rounded-[24px] p-2 border border-border focus-within:border-accent focus-within:bg-white transition-all shadow-sm">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-text-primary outline-none placeholder:text-text-tertiary"
                />
                <button
                  type="button"
                  disabled={sending || !messageText.trim()}
                  onClick={() => void sendMessage()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white hover:bg-black disabled:opacity-50 disabled:hover:bg-accent transition-colors shadow-sm mr-1"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </>
        )}

        {error && <p className="absolute top-4 right-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-xs font-bold z-50 shadow-sm">{error}</p>}
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(15, 23, 42, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(15, 23, 42, 0.2);
        }
      `}</style>
    </div>
  )
}
