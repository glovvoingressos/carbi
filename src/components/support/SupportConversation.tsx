'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Loader2, Send, ShieldCheck } from 'lucide-react'

type ConversationStatus = 'open' | 'waiting_visitor' | 'closed'

type SupportMessage = {
  id: string
  conversation_id: string
  sender_type: 'visitor' | 'admin'
  sender_name: string | null
  body: string
  created_at: string
}

type SupportConversationData = {
  id: string
  visitor_name: string | null
  visitor_email: string | null
  status: ConversationStatus
  last_message_at: string
  created_at: string
  updated_at: string
  messages: SupportMessage[]
}

type SupportConversationSummary = Omit<SupportConversationData, 'messages'> & {
  messages?: SupportMessage[]
}

type ConversationResponse = { conversation: SupportConversationSummary | null }
type MessageResponse = { message: SupportMessage }
type SendStatus = 'idle' | 'sending' | 'sent' | 'error'

const POLL_INTERVAL_MS = 4_000
const GENERIC_ERROR = 'Não conseguimos enviar agora. Tente novamente.'

export default function SupportConversation({ isOpen }: { isOpen: boolean }) {
  const [conversation, setConversation] = useState<SupportConversationData | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<SendStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messageRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const controller = new AbortController()
    let active = true
    let inFlight = false

    const refreshConversation = async () => {
      if (inFlight) return
      inFlight = true
      setIsLoading(true)

      try {
        const response = await fetch('/api/support/conversations', { signal: controller.signal })
        const data = await readJson<ConversationResponse>(response)
        if (!response.ok) throw new Error(readError(data, 'Não foi possível carregar sua conversa agora.'))

        if (active) {
          setConversation(normalizeConversation(data.conversation))
          setError(null)
        }
      } catch (requestError) {
        if (active && !isAbortError(requestError)) {
          setError(readThrownError(requestError, 'Não foi possível carregar sua conversa agora.'))
        }
      } finally {
        inFlight = false
        if (active) setIsLoading(false)
      }
    }

    void refreshConversation()
    const interval = window.setInterval(() => void refreshConversation(), POLL_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(interval)
      controller.abort()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const timeout = window.setTimeout(() => messageRef.current?.focus(), 0)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  const sendMessage = async () => {
    const text = message.trim()
    if (!text || status === 'sending') return

    setStatus('sending')
    setError(null)

    const payload = { name: name.trim(), email: email.trim(), message: text }
    const isExistingConversation = Boolean(conversation)
    const endpoint = isExistingConversation
      ? '/api/support/conversations/messages'
      : '/api/support/conversations'
    const body = isExistingConversation
      ? { conversationId: conversation?.id, ...payload }
      : payload

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await readJson<ConversationResponse | MessageResponse>(response)
      if (!response.ok) throw new Error(readError(data, GENERIC_ERROR))

      if ('conversation' in data && data.conversation) {
        setConversation(normalizeConversation(data.conversation, {
          id: `pending-${Date.now()}`,
          conversation_id: data.conversation.id,
          sender_type: 'visitor',
          sender_name: payload.name || null,
          body: text,
          created_at: new Date().toISOString(),
        }))
      } else if ('message' in data && data.message) {
        setConversation((current) => current
          ? {
              ...current,
              status: 'open',
              messages: current.messages.some((item) => item.id === data.message.id)
                ? current.messages
                : [...current.messages, data.message],
            }
          : current)
      }

      setMessage('')
      setStatus('sent')
    } catch (requestError) {
      setStatus('error')
      setError(readThrownError(requestError, GENERIC_ERROR))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="cb-support-body" aria-busy={isLoading}>
      <div className="cb-support-bubble">
        <p>Oi! 👋 Como podemos ajudar? Conte com a gente para dúvidas sobre anúncios, pagamentos, FIPE ou a plataforma.</p>
        <span className="cb-support-time">agora</span>
      </div>

      {isLoading && !conversation && (
        <p className="cb-support-status" role="status">Carregando sua conversa…</p>
      )}

      {conversation && (
        <div className="cb-support-history" aria-label="Histórico da conversa">
          {conversation.messages.map((item) => (
            <article className={`cb-support-message cb-support-message--${item.sender_type}`} key={item.id}>
              <strong>{item.sender_type === 'admin' ? item.sender_name || 'Equipe Carbi' : 'Você'}</strong>
              <p>{item.body}</p>
              <span className="cb-support-time">{formatMessageTime(item.created_at)}</span>
            </article>
          ))}
        </div>
      )}

      {conversation?.status === 'waiting_visitor' && (
        <p className="cb-support-status" role="status">Aguardando sua resposta</p>
      )}
      {conversation?.status === 'closed' && (
        <p className="cb-support-status" role="status">Esta conversa foi encerrada. Envie uma nova mensagem para reabri-la.</p>
      )}

      <form className="cb-support-form" onSubmit={handleSubmit} noValidate>
        {!conversation && (
          <div className="cb-support-details">
            <label>
              <span>Seu nome (opcional)</span>
              <input className="cb-support-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" />
            </label>
            <label>
              <span>Seu e-mail (opcional)</span>
              <input className="cb-support-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" />
            </label>
            <p className="cb-support-form-as">Você não precisa entrar. O e-mail é opcional e ajuda o suporte a retornar depois.</p>
          </div>
        )}

        <label className="cb-support-message-field">
          <span>Sua mensagem</span>
          <textarea ref={messageRef} className="cb-support-input" placeholder="Escreva sua mensagem…" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={handleMessageKeyDown} rows={3} maxLength={2_000} disabled={status === 'sending'} required />
        </label>
        <div className="cb-support-form-row">
          <span className="cb-support-form-meta"><ShieldCheck size={12} aria-hidden="true" /> Resposta por e-mail · máx. 2000 caracteres</span>
          <button type="submit" className="cb-support-send" disabled={status === 'sending' || !message.trim()}>
            {status === 'sending' ? <Loader2 size={16} className="cb-support-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            {status === 'sending' ? 'Enviando' : 'Enviar mensagem'}
          </button>
        </div>
        <p className="cb-support-live" role="status" aria-live="polite">{status === 'sent' ? 'Mensagem enviada. Nossa equipe responderá por aqui.' : ''}</p>
        {error && <p className="cb-support-error" role="alert">{error}</p>}
      </form>
    </div>
  )
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({})) as Promise<T>
}

function readError(data: ConversationResponse | MessageResponse | Record<string, unknown>, fallback: string): string {
  return typeof data === 'object' && data && 'error' in data && typeof data.error === 'string' ? data.error : fallback
}

function readThrownError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function normalizeConversation(
  conversation: SupportConversationSummary | null,
  optimisticMessage?: SupportMessage,
): SupportConversationData | null {
  if (!conversation) return null
  return {
    ...conversation,
    messages: optimisticMessage
      ? [...(conversation.messages ?? []), optimisticMessage]
      : conversation.messages ?? [],
  }
}

function formatMessageTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)
}
