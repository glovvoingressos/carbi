'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, CarFront, Loader2, MessageSquare, Send, ShieldCheck } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import { getCarImageCandidates } from '@/lib/car-image-fallback'

interface ConversationItem {
  id: string
  listing_id: string
  last_message_at: string | null
  last_message_preview: string | null
  is_unread: boolean
  vehicle_listings_public: {
    slug: string
    title: string
    brand: string
    model: string
    version: string | null
    year: number
    year_model: number
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
  const [thumbStages, setThumbStages] = useState<Record<string, 'preferred' | 'fallback' | 'broken'>>({})

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId],
  )

  const markThumbBroken = (key: string) => {
    setThumbStages((current) => (current[key] === 'broken' ? current : { ...current, [key]: 'broken' }))
  }

  const getConversationThumb = (
    conversation: ConversationItem['vehicle_listings_public'],
    key: string,
  ) => {
    const candidates = getCarImageCandidates([conversation.images?.[0]?.url || null])
    const preferred = candidates[0] || null
    const fallback = candidates[1] || null

    const stage = thumbStages[key] || (preferred ? 'preferred' : fallback ? 'fallback' : 'broken')
    const src = stage === 'preferred' ? preferred : fallback

    return { src, stage, fallback }
  }

  useEffect(() => {
    if (!supabaseReady) {
      setReady(true)
      setAuthenticated(false)
      setError('Chat indisponível.')
      return
    }

    let unsubscribe: (() => void) | null = null

    const init = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

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
    return () => { unsubscribe?.() }
  }, [supabaseReady])

  const fetchConversations = async (accessToken: string) => {
    setLoadingConversations(true)
    try {
      const response = await fetch('/api/marketplace/conversations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar conversas.')
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
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar mensagens.')
      setMessages(payload)

      await fetch(`/api/marketplace/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.${selectedId}` },
        () => { void fetchMessages(token, selectedId) })
      .subscribe()
    return () => { void supabase.removeChannel(messageChannel) }
  }, [token, myUserId, selectedId, supabaseReady])

  useEffect(() => {
    if (!token || !myUserId || !supabaseReady) return
    const supabase = getSupabaseBrowserClient()
    const sellerChannel = supabase
      .channel(`conversations:seller:${myUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `seller_user_id=eq.${myUserId}` },
        () => { void fetchConversations(token) })
      .subscribe()
    const buyerChannel = supabase
      .channel(`conversations:buyer:${myUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `buyer_user_id=eq.${myUserId}` },
        () => { void fetchConversations(token) })
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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Falha ao enviar mensagem.')
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
      <div className="conversation-loading-card">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A0A0A]" />
        <p>Carregando conversas...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="conversation-auth-wrap">
        <AuthCard redirectTo="/minha-conta/conversas" />
      </div>
    )
  }

  return (
    <div className="conversation-workspace">
      <aside className="conversation-list-panel">
        <div className="conversation-list-head">
          <div>
            <span>Inbox</span>
            <h2>Minhas conversas</h2>
          </div>
          {loadingConversations ? <Loader2 className="h-4 w-4 animate-spin text-[#8A95A8]" /> : null}
        </div>

        <div className="conversation-thread-scroll custom-scrollbar">
          {loadingConversations && conversations.length === 0 ? (
            <div className="conversation-list-muted">Carregando...</div>
          ) : null}

          <div className="conversation-thread-stack">
            {conversations.map((conversation) => {
              const isActive = selectedId === conversation.id
              const thumbKey = `list-${conversation.id}`
              const thumb = getConversationThumb(conversation.vehicle_listings_public, thumbKey)
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`conversation-thread-card ${isActive ? 'is-active' : ''}`}
                >
                  <span className="conversation-thread-thumb">
                    {thumb.src ? (
                      <img
                        src={thumb.src}
                        alt={conversation.vehicle_listings_public.title}
                        loading="lazy"
                        decoding="async"
                        onError={() => {
                          if (thumb.stage === 'preferred' && thumb.fallback) {
                            setThumbStages((current) => ({ ...current, [thumbKey]: 'fallback' }))
                            return
                          }
                          markThumbBroken(thumbKey)
                        }}
                      />
                    ) : (
                      <CarFront className="h-5 w-5" strokeWidth={1.6} />
                    )}
                  </span>
                  <span className="conversation-thread-content">
                    <span className="conversation-thread-title">{conversation.vehicle_listings_public.title}</span>
                    <span className="conversation-thread-meta">
                      {formatBRL(Number(conversation.vehicle_listings_public.price))} · {conversation.vehicle_listings_public.city}/{conversation.vehicle_listings_public.state}
                    </span>
                    <span className="conversation-thread-preview">
                      {conversation.last_message_preview || 'Conversa iniciada.'}
                    </span>
                  </span>
                  {conversation.is_unread && !isActive ? <span className="conversation-unread-dot" /> : null}
                </button>
              )
            })}
          </div>

          {conversations.length === 0 && !loadingConversations ? (
            <div className="conversation-empty-state">
              <MessageSquare className="h-8 w-8" strokeWidth={1.5} />
              <strong>Nenhuma conversa ainda</strong>
              <p>Quando alguém chamar em um anúncio, a conversa aparece aqui.</p>
            </div>
          ) : null}
        </div>
      </aside>

      <section className="conversation-chat-panel">
        {!selectedConversation ? (
          <div className="conversation-select-empty">
            <div className="conversation-select-icon">
              <MessageSquare className="h-9 w-9" strokeWidth={1.5} />
            </div>
            <h2>Selecione uma conversa</h2>
            <p>O histórico e as novas mensagens aparecem em tempo real.</p>
          </div>
        ) : (
          <>
            <div className="conversation-chat-head">
              <div className="conversation-chat-car">
                <span className="conversation-chat-thumb">
                  {getConversationThumb(selectedConversation.vehicle_listings_public, `chat-${selectedConversation.id}`).src ? (
                    <img
                      src={getConversationThumb(selectedConversation.vehicle_listings_public, `chat-${selectedConversation.id}`).src || ''}
                      alt={selectedConversation.vehicle_listings_public.title}
                      loading="lazy"
                      decoding="async"
                      onError={() => {
                        const key = `chat-${selectedConversation.id}`
                        const thumb = getConversationThumb(selectedConversation.vehicle_listings_public, key)
                        if (thumb.stage === 'preferred' && thumb.fallback) {
                          setThumbStages((current) => ({ ...current, [key]: 'fallback' }))
                          return
                        }
                        markThumbBroken(key)
                      }}
                    />
                  ) : (
                    <CarFront className="h-5 w-5" strokeWidth={1.6} />
                  )}
                </span>
                <div>
                  <p>{selectedConversation.vehicle_listings_public.title}</p>
                  <span>
                    {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} · {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
                  </span>
                </div>
              </div>
              <Link href={`/anuncios/${selectedConversation.vehicle_listings_public.slug}`} className="conversation-open-listing">
                Ver anúncio
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>

            <div className="conversation-safety-strip">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
              <span>Negociação protegida: evite compartilhar telefone, e-mail ou dados bancários no chat.</span>
            </div>

            <div className="conversation-message-scroll custom-scrollbar">
              {loadingMessages && messages.length === 0 ? (
                <p className="conversation-list-muted">Carregando mensagens...</p>
              ) : null}
              <div className="conversation-message-stack">
                {messages.map((message) => {
                  const isMine = message.sender_user_id === myUserId
                  return (
                    <div
                      key={message.id}
                      className={`conversation-message-row ${isMine ? 'is-mine' : ''}`}
                    >
                      <div className={`conversation-bubble ${isMine ? 'is-mine' : ''}`}>
                        <p>{message.message}</p>
                        <time>
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="conversation-composer-wrap">
              <div className="conversation-composer">
                <label htmlFor="chat-message" className="sr-only">Mensagem</label>
                <input
                  id="chat-message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="conversation-composer-input"
                  aria-label="Digite sua mensagem"
                />
                <button
                  type="button"
                  disabled={sending || !messageText.trim()}
                  onClick={() => void sendMessage()}
                  className="conversation-send-btn"
                  aria-label="Enviar mensagem"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="conversation-error-toast">
            {error}
          </div>
        )}
      </section>
    </div>
  )
}
