'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, CarFront, Loader2, MessageSquare, Search, Send, ShieldCheck, Phone, MoreVertical, Check, CheckCheck } from 'lucide-react'
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

const ease = [0.23, 1, 0.32, 1] as const

function ConversationThumb({ images, title, className }: { images?: Array<{ url: string }> | null; title: string; className?: string }) {
  const url = getCarImageCandidates([images?.[0]?.url || null])[0]
  return (
    <div className={`overflow-hidden bg-[#1A1A1A] flex items-center justify-center shrink-0 ${className ?? 'w-14 h-14 rounded-2xl'}`}>
      {url ? (
        <img src={url} alt={title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <CarFront className="w-6 h-6 text-[#D4F576]" strokeWidth={1.6} />
      )}
    </div>
  )
}

function MessageBubble({ message, isMine, showName }: { message: MessageItem; isMine: boolean; showName: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isMine
            ? 'bg-[#1A1A1A] text-white rounded-br-md'
            : 'bg-[#F8F9FA] text-[#1A1A1A] rounded-bl-md border border-gray-100'
        }`}
      >
        {!isMine && showName && (
          <p className="text-[11px] font-semibold text-gray-500! mb-1.5">{message.sender_name}</p>
        )}
        <p className={`text-sm leading-relaxed break-words ${isMine ? 'text-white!' : 'text-[#1A1A1A]!'}`}>{message.message}</p>
        <div className={`flex items-center gap-1.5 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <time className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
            {formatTime(message.created_at)}
          </time>
          {isMine && (
            <CheckCheck className="w-3.5 h-3.5 text-white/70" />
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
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 rounded-2xl animate-pulse w-48" />
        <div className="h-[500px] bg-gray-100 rounded-2xl animate-pulse" />
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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Minhas conversas</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar conversas..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingConversations && filtered.length === 0 && (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setSelectedId(c.id); setMobileView('chat') }}
            className={`w-full flex items-center gap-4 p-5 transition-all text-left border-b border-gray-100 ${
              selectedId === c.id ? 'bg-[#1A1A1A]' : 'hover:bg-[#F8F9FA]'
            }`}
          >
            <ConversationThumb
              images={c.vehicle_listings_public.images}
              title={c.vehicle_listings_public.title}
              className="w-14 h-14 rounded-2xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-bold truncate ${selectedId === c.id ? 'text-white!' : 'text-[#1A1A1A]!'}`}>
                  {c.vehicle_listings_public.title}
                </p>
                {c.is_unread && selectedId !== c.id && (
                  <span className="w-3 h-3 rounded-full bg-[#D4F576] shrink-0" />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-gray-400!' : 'text-gray-500!'}`}>
                {formatBRL(Number(c.vehicle_listings_public.price))} · {c.vehicle_listings_public.city}/{c.vehicle_listings_public.state}
              </p>
              <p className="text-xs mt-1.5 truncate text-gray-400!">
                {c.last_message_preview || 'Conversa iniciada'}
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && !loadingConversations && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-[#F8F9FA] flex items-center justify-center mb-5">
              <MessageSquare className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-[#1A1A1A]!">Nenhuma conversa</p>
            <p className="text-sm text-gray-500! mt-2 max-w-[280px]">Conversas com vendedores aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  )

  const chatPanel = selectedConversation ? (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 shrink-0">
        <button type="button" onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </button>
        <ConversationThumb images={selectedConversation.vehicle_listings_public.images} title={selectedConversation.vehicle_listings_public.title} className="w-12 h-12 rounded-2xl" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[#1A1A1A]! truncate">{selectedConversation.vehicle_listings_public.title}</p>
          <p className="text-sm text-gray-500! truncate mt-0.5">
            {selectedConversation.vehicle_listings_public.city}/{selectedConversation.vehicle_listings_public.state} · {formatBRL(Number(selectedConversation.vehicle_listings_public.price))}
          </p>
        </div>
        <Link href={`/anuncios/${selectedConversation.vehicle_listings_public.slug}`} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#F8F9FA] text-[#1A1A1A] rounded-xl text-sm font-semibold shrink-0 hover:bg-gray-200 transition-colors border border-gray-200">
          Ver anúncio <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
        </Link>
      </div>

      {/* Security Notice */}
      <div className="mx-5 mt-5 px-5 py-4 flex items-center gap-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-sm shrink-0">
        <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={1.8} />
        <span className="font-medium">Negociação segura: evite compartilhar telefone ou dados bancários no chat.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            <p className="text-sm text-gray-400! mt-4">Carregando mensagens...</p>
          </div>
        )}
        <div className="grid gap-4">
          {messages.map((msg, i) => {
            const isMine = msg.sender_user_id === myUserId
            const prev = messages[i - 1]
            const showName = !isMine && (!prev || prev.sender_user_id !== msg.sender_user_id)
            return <MessageBubble key={msg.id} message={msg} isMine={isMine} showName={showName} />
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="px-5 pb-5 pt-4 shrink-0 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2.5 bg-[#F8F9FA] border border-gray-200 rounded-2xl focus-within:border-[#1A1A1A] focus-within:ring-2 focus:ring-[#1A1A1A]/10 transition-all">
          <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
            placeholder="Digite sua mensagem..." className="flex-1 px-4 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none" aria-label="Mensagem" />
          <button type="button" disabled={sending || !messageText.trim()} onClick={() => void sendMessage()}
            className="p-3 bg-[#1A1A1A] text-[#D4F576] rounded-xl disabled:opacity-40 hover:bg-[#2D2D2D] transition-colors" aria-label="Enviar">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-gray-100 text-center px-10">
      <div className="w-24 h-24 rounded-2xl bg-[#F8F9FA] flex items-center justify-center mb-6">
        <MessageSquare className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-[#1A1A1A]">Selecione uma conversa</h2>
      <p className="text-sm text-gray-500! mt-3 max-w-[300px]">O histórico de mensagens aparecerá aqui em tempo real.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Mensagens</h1>
        <p className="text-sm text-gray-500! mt-1">{conversations.length} conversa{conversations.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="min-h-[500px] lg:h-[calc(100vh-280px)]">
        {/* Mobile */}
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
        
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-[minmax(360px,440px)_minmax(0,1fr)] gap-6 h-full">
          {listPanel}
          {chatPanel}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-28 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 bg-[#DC2626] text-white text-sm font-semibold rounded-2xl shadow-xl">
          {error}
        </div>
      )}
    </div>
  )
}
