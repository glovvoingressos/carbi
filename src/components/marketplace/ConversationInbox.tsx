'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2, MessageSquare } from 'lucide-react'
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
      <div className="bg-white border border-[#EAEAE8] rounded-2xl p-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A0A0A]" />
      </div>
    )
  }

  if (!authenticated) {
    return <AuthCard />
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr] h-[calc(100vh-180px)] min-h-[600px]">
      {/* Sidebar */}
      <aside className="bg-white border border-[#EAEAE8] rounded-2xl flex flex-col h-full overflow-hidden">
        <div className="p-5 border-b border-[#EAEAE8]">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#0A0A0A]">Conversas</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingConversations && conversations.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#A3A3A3]">Carregando...</div>
          ) : null}

          <div className="p-2 space-y-1">
            {conversations.map((conversation) => {
              const isActive = selectedId === conversation.id
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full rounded-xl p-3 text-left transition-colors ${
                    isActive ? 'bg-[#FAFAF9]' : 'hover:bg-[#FAFAF9]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {conversation.is_unread && !isActive && (
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[#10B981] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#0A0A0A] tracking-tight line-clamp-1">
                        {conversation.vehicle_listings_public.title}
                      </p>
                      <p className="text-[12px] text-[#525252] mt-0.5 tracking-tight">
                        {formatBRL(Number(conversation.vehicle_listings_public.price))}
                      </p>
                      <p className="text-[12px] text-[#A3A3A3] mt-1.5 line-clamp-1 tracking-tight">
                        {conversation.last_message_preview || 'Conversa iniciada.'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {conversations.length === 0 && !loadingConversations ? (
            <div className="m-4 p-8 text-center bg-[#FAFAF9] rounded-xl">
              <MessageSquare className="w-8 h-8 text-[#A3A3A3] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[13px] text-[#525252]">Você ainda não possui conversas.</p>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Conversation panel */}
      <section className="bg-white border border-[#EAEAE8] rounded-2xl flex flex-col h-full overflow-hidden relative">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <MessageSquare className="w-10 h-10 text-[#A3A3A3] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[15px] text-[#525252]">Selecione uma conversa para começar.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-[#EAEAE8] bg-white">
              <p className="text-[16px] font-semibold text-[#0A0A0A] tracking-tight">
                {selectedConversation.vehicle_listings_public.title}
              </p>
              <p className="text-[12px] text-[#525252] mt-0.5 tracking-tight">
                {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} · {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {loadingMessages && messages.length === 0 ? (
                <p className="text-[13px] text-[#A3A3A3] text-center mt-8">Carregando mensagens...</p>
              ) : null}
              <div className="space-y-3">
                {messages.map((message) => {
                  const isMine = message.sender_user_id === myUserId
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? 'bg-[#0A0A0A] text-white rounded-br-md'
                          : 'bg-[#FAFAF9] text-[#0A0A0A] rounded-bl-md'
                      }`}>
                        <p className="text-[14px] leading-relaxed tracking-tight">{message.message}</p>
                        <p className={`mt-1 text-[10px] tracking-tight ${isMine ? 'text-white/50' : 'text-[#A3A3A3]'}`}>
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#EAEAE8]">
              <div className="flex items-center gap-2 bg-white border border-[#EAEAE8] rounded-full pl-5 pr-1.5 py-1.5 focus-within:border-[#0A0A0A] transition-colors">
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
                  className="flex-1 bg-transparent px-1 py-2 text-[14px] text-[#0A0A0A] outline-none placeholder:text-[#A3A3A3] tracking-tight"
                />
                <button
                  type="button"
                  disabled={sending || !messageText.trim()}
                  onClick={() => void sendMessage()}
                  className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white hover:bg-[#1F1F1F] disabled:opacity-30 transition-colors flex items-center justify-center"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="absolute top-4 right-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] px-3 py-2 rounded-lg text-[12px] tracking-tight z-50">
            {error}
          </div>
        )}
      </section>
    </div>
  )
}
