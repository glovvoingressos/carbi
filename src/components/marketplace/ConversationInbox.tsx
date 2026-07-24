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
    <div className={`overflow-hidden bg-blue-50 flex items-center justify-center shrink-0 ${className ?? 'w-12 h-12 rounded-xl'}`}>
      {url ? (
            <img src={url} alt={title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <CarFront className="w-5 h-5 text-blue-400" strokeWidth={1.6} />
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
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isMine
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        {!isMine && showName && (
          <p className="text-xs font-semibold text-gray-500 mb-1">{message.sender_name}</p>
        )}
        <p className="text-sm leading-relaxed break-words">{message.message}</p>
        <div className={`flex items-center gap-1.5 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <time className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
            {formatTime(message.created_at)}
          </time>
          {isMine && (
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none" className="text-white/70">
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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Minhas conversas</h2>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar conversas..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingConversations && filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-12">Carregando conversas...</p>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setSelectedId(c.id); setMobileView('chat') }}
            className={`w-full flex items-center gap-4 p-4 transition-all text-left border-b border-gray-100 ${
              selectedId === c.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <ConversationThumb
              images={c.vehicle_listings_public.images}
              title={c.vehicle_listings_public.title}
              className="w-12 h-12 rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {c.vehicle_listings_public.title}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {formatBRL(Number(c.vehicle_listings_public.price))} · {c.vehicle_listings_public.city}/{c.vehicle_listings_public.state}
              </p>
              <p className="text-xs text-gray-400 truncate mt-1">
                {c.last_message_preview || 'Conversa iniciada'}
              </p>
            </div>
            {c.is_unread && selectedId !== c.id && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            )}
          </button>
        ))}
        {filtered.length === 0 && !loadingConversations && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
            </div>
            <p className="text-base font-semibold text-gray-900">Nenhuma conversa</p>
            <p className="text-sm text-gray-500 mt-1 max-w-[240px]">Conversas com vendedores aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  )

  const chatPanel = selectedConversation ? (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-200 shrink-0">
        <button type="button" onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <ConversationThumb images={selectedConversation.vehicle_listings_public.images} title={selectedConversation.vehicle_listings_public.title} className="w-11 h-11 rounded-xl" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{selectedConversation.vehicle_listings_public.title}</p>
          <p className="text-xs text-gray-500 truncate">
            {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} · {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
          </p>
        </div>
        <Link href={`/anuncios/${selectedConversation.vehicle_listings_public.slug}`} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium shrink-0 hover:bg-gray-200 transition-colors">
          Ver anúncio <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
      <div className="mx-4 mt-4 px-4 py-3 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs shrink-0">
        <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.8} />
        <span className="font-medium">Negociação segura: evite compartilhar telefone ou dados bancários no chat.</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loadingMessages && messages.length === 0 && <p className="text-center text-sm text-gray-400 py-12">Carregando mensagens...</p>}
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
      <div className="px-4 pb-4 pt-3 shrink-0 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
            placeholder="Digite sua mensagem..." className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none" aria-label="Mensagem" />
          <button type="button" disabled={sending || !messageText.trim()} onClick={() => void sendMessage()}
            className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors" aria-label="Enviar">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-gray-200 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
        <MessageSquare className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-semibold text-gray-900">Selecione uma conversa</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-[280px]">O histórico de mensagens aparecerá aqui em tempo real.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1A1A1A]">Mensagens</h1>
          <p className="text-sm text-gray-400 mt-0.5">{conversations.length} conversa{conversations.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-[1240px] min-h-[500px] lg:h-[calc(100vh-280px)]">
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
        <div className="hidden md:grid grid-cols-[minmax(320px,400px)_minmax(0,1fr)] gap-5 h-full">
          {listPanel}
          {chatPanel}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-red-600 text-white text-xs font-semibold rounded-full shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  )
}
