'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, CarFront, Loader2, MessageSquare, Search, Send, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import { getCarImageCandidates } from '@/lib/car-image-fallback'

interface ConversationItem {
  id: string
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
  sender_name: string
  message: string
  created_at: string
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function ConversationThumb({ images, title, className }: { images?: Array<{ url: string }> | null; title: string; className?: string }) {
  const url = getCarImageCandidates([images?.[0]?.url || null])[0]
  return (
    <div className={`overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 ${className ?? 'w-12 h-12 rounded-2xl'}`}>
      {url ? (
        <img src={url} alt={title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <CarFront className="w-5 h-5 text-gray-400" strokeWidth={1.6} />
      )}
    </div>
  )
}

function MessageBubble({ message, isMine, showName }: { message: MessageItem; isMine: boolean; showName: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isMine
            ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)]'
            : 'bg-gray-100 text-[var(--color-text-primary)]'
        }`}
      >
        {!isMine && showName && (
          <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-1">{message.sender_name}</p>
        )}
        <p className="text-sm leading-relaxed break-words font-sans">{message.message}</p>
        <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <time className={`text-[10px] font-semibold ${isMine ? 'text-[var(--color-text-secondary)]' : 'text-gray-400'}`}>
            {formatTime(message.created_at)}
          </time>
          {isMine && (
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none" className="text-[var(--color-text-secondary)]">
              <path d="M1 4.5L4 7.5L8.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 4.5L8 7.5L12.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function ConversationInbox() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const searchParams = useSearchParams()
  const selectedFromQuery = searchParams.get('conversation')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        c.vehicle_listings_public.title.toLowerCase().includes(q) ||
        (c.last_message_preview || '').toLowerCase().includes(q),
    )
  }, [conversations, search])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!supabaseReady) { setReady(true); setError('Chat indisponível.'); return }
    let unsub: (() => void) | null = null
    const init = async () => {
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      setAuthenticated(!!session); setToken(session?.access_token || null); setMyUserId(session?.user.id || null); setReady(true)
      const { data } = sb.auth.onAuthStateChange((_e: string, u: { access_token?: string; user?: { id?: string } } | null) => {
        setAuthenticated(!!u); setToken(u?.access_token || null); setMyUserId(u?.user?.id || null)
      })
      unsub = () => data.subscription.unsubscribe()
    }
    void init()
    return () => { unsub?.() }
  }, [supabaseReady])

  const fetchConversations = async (accessToken: string) => {
    setLoadingConversations(true)
    try {
      const res = await fetch('/api/marketplace/conversations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar conversas.')
      setConversations(data)
      if (!selectedId && data.length > 0) setSelectedId(data[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar conversas.')
    } finally {
      setLoadingConversations(false)
    }
  }

  const fetchMessages = async (accessToken: string, conversationId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/marketplace/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar mensagens.')
      setMessages(data)
      await fetch(`/api/marketplace/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar mensagens.')
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
    const ch = supabase
      .channel(`messages:${selectedId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.${selectedId}` },
        () => { void fetchMessages(token, selectedId) })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [token, myUserId, selectedId, supabaseReady])

  useEffect(() => {
    if (!token || !myUserId || !supabaseReady) return
    const supabase = getSupabaseBrowserClient()
    const sellerCh = supabase
      .channel(`conversations:seller:${myUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `seller_user_id=eq.${myUserId}` },
        () => { void fetchConversations(token) })
      .subscribe()
    const buyerCh = supabase
      .channel(`conversations:buyer:${myUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `buyer_user_id=eq.${myUserId}` },
        () => { void fetchConversations(token) })
      .subscribe()
    return () => {
      void supabase.removeChannel(sellerCh)
      void supabase.removeChannel(buyerCh)
    }
  }, [token, myUserId, supabaseReady])

  const sendMessage = async () => {
    if (!token || !selectedId || !messageText.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/marketplace/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar mensagem.')
      setMessageText('')
      await fetchMessages(token, selectedId)
      await fetchConversations(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao enviar mensagem.')
    } finally {
      setSending(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-primary)]" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AuthCard redirectTo="/minha-conta/conversas" />
      </div>
    )
  }

  const listPanel = (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] font-[var(--font-heading)]">Minhas conversas</h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar conversas..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loadingConversations && filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">Carregando...</p>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setSelectedId(c.id); setMobileView('chat') }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-1 ${
              selectedId === c.id ? 'bg-[var(--color-accent)]/15' : 'hover:bg-gray-50'
            }`}
          >
            <ConversationThumb
              images={c.vehicle_listings_public.images}
              title={c.vehicle_listings_public.title}
              className="w-12 h-12 rounded-2xl"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                {c.vehicle_listings_public.title}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                {formatBRL(Number(c.vehicle_listings_public.price))} · {c.vehicle_listings_public.city}/{c.vehicle_listings_public.state}
              </p>
              <p className="text-xs text-gray-400 truncate mt-1">
                {c.last_message_preview || 'Conversa iniciada.'}
              </p>
            </div>
            {c.is_unread && selectedId !== c.id && (
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] shrink-0" />
            )}
          </button>
        ))}
        {filtered.length === 0 && !loadingConversations && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Nenhuma conversa ainda</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Quando alguém chamar em um anúncio, a conversa aparece aqui.</p>
          </div>
        )}
      </div>
    </div>
  )

  const chatPanel = selectedConversation ? (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <button type="button" onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 rounded-2xl hover:bg-gray-100 transition-colors" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-primary)]" />
        </button>
        <ConversationThumb images={selectedConversation.vehicle_listings_public.images} title={selectedConversation.vehicle_listings_public.title} className="w-10 h-10 rounded-2xl" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{selectedConversation.vehicle_listings_public.title}</p>
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} · {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
          </p>
        </div>
        <Link href={`/anuncios/${selectedConversation.vehicle_listings_public.slug}`} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-text-primary)] text-[var(--color-accent)] rounded-2xl text-xs font-bold shrink-0 hover:opacity-90 transition-opacity">
          Ver anúncio <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
      <div className="mx-4 mt-3 px-3 py-2 flex items-center gap-2 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-text-primary)] text-xs font-bold shrink-0">
        <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.8} />
        <span>Negociação protegida: evite compartilhar telefone, e-mail ou dados bancários no chat.</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMessages && messages.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Carregando mensagens...</p>}
        <div className="grid gap-3">
          {messages.map((msg, i) => {
            const isMine = msg.sender_user_id === myUserId
            const prev = messages[i - 1]
            const showName = !isMine && (!prev || prev.sender_user_id !== msg.sender_user_id)
            return <MessageBubble key={msg.id} message={msg} isMine={isMine} showName={showName} />
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-2xl focus-within:border-[var(--color-accent)] transition-colors">
          <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
            placeholder="Digite sua mensagem..." className="flex-1 px-3 py-2 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none font-sans" aria-label="Digite sua mensagem" />
          <button type="button" disabled={sending || !messageText.trim()} onClick={() => void sendMessage()}
            className="p-2.5 bg-[var(--color-text-primary)] text-[var(--color-accent)] rounded-2xl disabled:opacity-40 hover:opacity-90 transition-opacity" aria-label="Enviar mensagem">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full bg-white border border-gray-200 rounded-2xl text-center px-8">
      <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center mb-4">
        <MessageSquare className="w-7 h-7 text-[var(--color-text-primary)]" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">Selecione uma conversa</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-[300px]">O histórico e as novas mensagens aparecem em tempo real.</p>
    </div>
  )

  return (
    <div className="max-w-[1240px] mx-auto h-[calc(100vh-260px)] min-h-[640px]">
      <div className="md:hidden h-full">
        <AnimatePresence mode="wait">
          {mobileView === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              {listPanel}
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full">
              {chatPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="hidden md:grid grid-cols-[minmax(300px,390px)_minmax(0,1fr)] gap-4 h-full">
        {listPanel}
        {chatPanel}
      </div>
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-[var(--color-text-primary)] text-white text-sm font-bold rounded-2xl shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  )
}
