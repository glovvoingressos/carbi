'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CircleDot, Loader2, LockKeyhole, MessageCircle, Search, Send, UserRound, XCircle } from 'lucide-react'

import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '../../lib/supabase-browser'

type ConversationStatus = 'open' | 'waiting_visitor' | 'closed'

type SupportMessage = {
  id: string
  conversation_id: string
  sender_type: 'visitor' | 'admin'
  sender_name: string | null
  body: string
  created_at: string
}

type SupportConversation = {
  id: string
  visitor_name: string | null
  visitor_email: string | null
  status: ConversationStatus
  last_message_at: string
  created_at: string
  updated_at: string
}

type SupportConversationDetail = SupportConversation & { messages: SupportMessage[] }

const POLL_INTERVAL_MS = 4_000

export default function AdminSupportInbox() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<SupportConversationDetail | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ConversationStatus>('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      router.replace('/entrar?redirect=/admin/suporte')
      return
    }

    let active = true
    const loadSession = async () => {
      try {
        const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
        if (!active) return
        if (!session?.access_token) {
          router.replace('/entrar?redirect=/admin/suporte')
          return
        }
        setToken(session.access_token)
      } catch {
        if (active) router.replace('/entrar?redirect=/admin/suporte')
      } finally {
        if (active) setReady(true)
      }
    }

    void loadSession()
    return () => { active = false }
  }, [router])

  const markUnauthorized = useCallback(() => {
    setUnauthorized(true)
    setError(null)
  }, [])

  const fetchConversations = useCallback(async (accessToken: string) => {
    const response = await fetch('/api/admin/support/conversations', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await readJson<{ conversations?: SupportConversation[]; error?: string }>(response)
    if (response.status === 401) {
      markUnauthorized()
      return []
    }
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as conversas.')

    const nextConversations = sortByRecentActivity(data.conversations ?? [])
    setConversations(nextConversations)
    setSelectedId((current) => nextConversations.some((item) => item.id === current) ? current : nextConversations[0]?.id ?? null)
    return nextConversations
  }, [markUnauthorized])

  const fetchConversation = useCallback(async (accessToken: string, conversationId: string) => {
    const response = await fetch(`/api/admin/support/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await readJson<{ conversation?: SupportConversationDetail; error?: string }>(response)
    if (response.status === 401) {
      markUnauthorized()
      return
    }
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar esta conversa.')
    if (data.conversation) setSelectedConversation(data.conversation)
  }, [markUnauthorized])

  useEffect(() => {
    if (!token || unauthorized) return
    let active = true

    const refresh = async () => {
      setLoading(true)
      try {
        await fetchConversations(token)
        const conversationId = selectedIdRef.current
        if (conversationId) await fetchConversation(token, conversationId)
        if (active) setError(null)
      } catch (requestError) {
        if (active) setError(readError(requestError, 'Não foi possível carregar as conversas.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [fetchConversation, fetchConversations, token, unauthorized])

  useEffect(() => {
    if (!token || !selectedId || unauthorized) return
    void fetchConversation(token, selectedId).catch((requestError) => setError(readError(requestError, 'Não foi possível carregar esta conversa.')))
  }, [fetchConversation, selectedId, token, unauthorized])

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return conversations.filter((conversation) => {
      const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter
      const matchesSearch = !query || [conversation.visitor_name, conversation.visitor_email]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query))
      return matchesStatus && matchesSearch
    })
  }, [conversations, search, statusFilter])

  const updateConversationStatus = async () => {
    if (!token || !selectedConversation || sending) return
    const nextStatus: 'open' | 'closed' = selectedConversation.status === 'closed' ? 'open' : 'closed'
    setSending(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/support/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await readJson<{ conversation?: SupportConversation; error?: string }>(response)
      if (response.status === 401) return markUnauthorized()
      if (!response.ok || !data.conversation) throw new Error(data.error || 'Não foi possível atualizar esta conversa.')
      setSelectedConversation((current) => current ? { ...current, ...data.conversation } : current)
      setConversations((current) => current.map((item) => item.id === data.conversation?.id ? { ...item, ...data.conversation } : item))
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível atualizar esta conversa.'))
    } finally {
      setSending(false)
    }
  }

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = message.trim()
    if (!token || !selectedConversation || !body || sending) return
    setSending(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/support/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body }),
      })
      const data = await readJson<{ message?: SupportMessage; error?: string }>(response)
      if (response.status === 401) return markUnauthorized()
      if (!response.ok || !data.message) throw new Error(data.error || 'Não foi possível enviar a resposta.')
      const reply = data.message
      setSelectedConversation((current) => current ? {
        ...current,
        status: 'waiting_visitor',
        messages: [...current.messages, reply],
      } : current)
      setConversations((current) => current.map((item) => item.id === selectedConversation.id
        ? { ...item, status: 'waiting_visitor', last_message_at: reply.created_at }
        : item))
      setMessage('')
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível enviar a resposta.'))
    } finally {
      setSending(false)
    }
  }

  if (!ready) return <InboxLoading />
  if (unauthorized) return <UnauthorizedState />

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8A95A8]">Administração</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1A1A1A]">Inbox de suporte</h1>
          <p className="mt-1 text-sm text-[#697386]">Responda às conversas dos visitantes em um só lugar.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#1A1A1A] px-4 py-2 text-xs font-bold text-[#D4F576] sm:self-auto">
          <CircleDot size={14} aria-hidden="true" /> Atualização automática
        </span>
      </header>

      {error && <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">{error}</p>}

      <section className="grid min-h-[620px] gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-[#EAEAE8] bg-white shadow-sm">
          <div className="space-y-4 border-b border-[#EAEAE8] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black text-[#1A1A1A]">Conversas</h2>
              <span className="rounded-full bg-[#F3F4EF] px-2.5 py-1 text-xs font-bold text-[#697386]">{conversations.length}</span>
            </div>
            <label className="relative block">
              <span className="sr-only">Buscar conversas</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A95A8]" size={17} aria-hidden="true" />
              <input aria-label="Buscar conversas" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" className="w-full rounded-xl border border-[#E1E4DE] bg-[#FAFAF8] py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#1A1A1A]" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#697386]">
              Status
              <select aria-label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ConversationStatus)} className="mt-1.5 w-full rounded-xl border border-[#E1E4DE] bg-white px-3 py-2.5 text-sm font-semibold text-[#1A1A1A] outline-none focus:border-[#1A1A1A]">
                <option value="all">Todos os status</option>
                <option value="open">Aguardando equipe</option>
                <option value="waiting_visitor">Aguardando visitante</option>
                <option value="closed">Encerradas</option>
              </select>
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && conversations.length === 0 && <ListLoading />}
            {!loading && filteredConversations.length === 0 && <EmptyState />}
            {filteredConversations.map((conversation) => {
              const active = selectedId === conversation.id
              return (
                <button key={conversation.id} type="button" aria-label={`Abrir conversa de ${visitorName(conversation)}`} onClick={() => setSelectedId(conversation.id)} className={`w-full border-b border-[#F0F1EC] px-5 py-4 text-left transition ${active ? 'bg-[#1A1A1A]' : 'hover:bg-[#F7F8F4]'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#D4F576] text-[#1A1A1A]' : 'bg-[#F1F3ED] text-[#697386]'}`}><UserRound size={17} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm font-black ${active ? 'text-white' : 'text-[#1A1A1A]'}`}>{visitorName(conversation)}</span>
                        <StatusPill status={conversation.status} inverted={active} />
                      </span>
                      <span className={`mt-1 block truncate text-xs ${active ? 'text-white/65' : 'text-[#8A95A8]'}`}>{conversation.visitor_email || 'Sem e-mail informado'}</span>
                      <time className={`mt-2 block text-[11px] font-semibold ${active ? 'text-[#D4F576]' : 'text-[#697386]'}`}>{formatDateTime(conversation.last_message_at)}</time>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {selectedConversation ? <ConversationPanel conversation={selectedConversation} message={message} sending={sending} onMessageChange={setMessage} onSubmit={sendReply} onStatusChange={() => void updateConversationStatus()} /> : <SelectConversationState />}
      </section>
    </main>
  )
}

function ConversationPanel({ conversation, message, sending, onMessageChange, onSubmit, onStatusChange }: {
  conversation: SupportConversationDetail
  message: string
  sending: boolean
  onMessageChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStatusChange: () => void
}) {
  const closed = conversation.status === 'closed'
  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[#EAEAE8] bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#EAEAE8] bg-[#1A1A1A] px-5 py-4 text-white sm:px-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4F576] text-[#1A1A1A]"><UserRound size={19} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black">{visitorName(conversation)}</h2>
          <p className="truncate text-xs text-white/65">{conversation.visitor_email || 'Sem e-mail informado'}</p>
        </div>
        <button type="button" disabled={sending} onClick={onStatusChange} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50">
          {closed ? 'Reabrir conversa' : 'Encerrar conversa'}
        </button>
      </header>

      <div className="border-b border-[#EAEAE8] bg-[#FAFAF8] px-5 py-3 sm:px-6"><StatusPill status={conversation.status} /></div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#FCFCFA] px-5 py-6 sm:px-6" aria-label="Mensagens da conversa">
        {conversation.messages.map((item) => {
          const admin = item.sender_type === 'admin'
          return <article key={item.id} className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${admin ? 'rounded-br-md bg-[#1A1A1A] text-white' : 'rounded-bl-md border border-[#E6E8E2] bg-white text-[#1A1A1A]'}`}>
              <p className={`mb-1 text-[11px] font-black uppercase tracking-wide ${admin ? 'text-[#D4F576]' : 'text-[#697386]'}`}>{admin ? item.sender_name || 'Equipe Carbi' : item.sender_name || visitorName(conversation)}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.body}</p>
              <time className={`mt-2 block text-[10px] font-semibold ${admin ? 'text-white/60' : 'text-[#8A95A8]'}`}>{formatDateTime(item.created_at)}</time>
            </div>
          </article>
        })}
      </div>

      <form onSubmit={onSubmit} className="border-t border-[#EAEAE8] p-4 sm:p-5">
        <label className="block">
          <span className="sr-only">Resposta</span>
          <textarea aria-label="Resposta" value={message} onChange={(event) => onMessageChange(event.target.value)} rows={3} maxLength={2_000} disabled={sending} placeholder={closed ? 'Reabra a conversa para responder.' : 'Escreva uma resposta…'} className="w-full resize-none rounded-xl border border-[#E1E4DE] bg-[#FAFAF8] px-3 py-3 text-sm outline-none transition focus:border-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60" />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[#8A95A8]">Máximo de 2.000 caracteres</p>
          <button type="submit" disabled={closed || sending || !message.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#D4F576] px-4 py-2.5 text-sm font-black text-[#1A1A1A] transition hover:bg-[#C5E963] disabled:cursor-not-allowed disabled:opacity-45">
            {sending ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />} Enviar resposta
          </button>
        </div>
      </form>
    </section>
  )
}

function InboxLoading() {
  return <div className="flex min-h-[480px] items-center justify-center"><Loader2 className="animate-spin text-[#1A1A1A]" aria-label="Carregando inbox" /></div>
}

function ListLoading() {
  return <div className="space-y-3 p-5" aria-label="Carregando conversas">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-[#F3F4EF]" />)}</div>
}

function EmptyState() {
  return <div className="px-6 py-20 text-center"><MessageCircle className="mx-auto mb-4 text-[#B5BCAF]" size={36} aria-hidden="true" /><h3 className="font-black text-[#1A1A1A]">Nenhuma conversa encontrada</h3><p className="mt-2 text-sm text-[#697386]">Novas mensagens de suporte aparecerão aqui.</p></div>
}

function SelectConversationState() {
  return <section className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#EAEAE8] bg-[#1A1A1A] px-6 text-center text-white"><MessageCircle className="mb-4 text-[#D4F576]" size={42} aria-hidden="true" /><h2 className="text-xl font-black">Selecione uma conversa</h2><p className="mt-2 max-w-sm text-sm text-white/65">O histórico e as ações de atendimento aparecerão aqui.</p></section>
}

function UnauthorizedState() {
  return <main className="flex min-h-[520px] items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[#EAEAE8] bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto mb-4 text-[#1A1A1A]" size={34} aria-hidden="true" /><h1 className="text-2xl font-black text-[#1A1A1A]">Acesso não autorizado</h1><p className="mt-3 text-sm leading-relaxed text-[#697386]">Sua conta não tem permissão para acessar o inbox de suporte.</p></section></main>
}

function StatusPill({ status, inverted = false }: { status: ConversationStatus; inverted?: boolean }) {
  const labels = { open: 'Aguardando equipe', waiting_visitor: 'Aguardando visitante', closed: 'Encerrada' }
  const colors = inverted
    ? { open: 'bg-[#D4F576] text-[#1A1A1A]', waiting_visitor: 'bg-white/15 text-white', closed: 'bg-white/15 text-white' }
    : { open: 'bg-[#EFF9CB] text-[#51701A]', waiting_visitor: 'bg-[#EAF1FF] text-[#365C93]', closed: 'bg-[#EFF1EF] text-[#607064]' }
  const Icon = status === 'closed' ? XCircle : status === 'open' ? CircleDot : CheckCircle2
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${colors[status]}`}><Icon size={11} aria-hidden="true" />{labels[status]}</span>
}

function visitorName(conversation: Pick<SupportConversation, 'visitor_name' | 'visitor_email'>) {
  return conversation.visitor_name?.trim() || conversation.visitor_email?.trim() || 'Visitante'
}

function sortByRecentActivity(conversations: SupportConversation[]) {
  return [...conversations].sort((left, right) => Date.parse(right.last_message_at) - Date.parse(left.last_message_at) || right.id.localeCompare(left.id))
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({})) as Promise<T>
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
