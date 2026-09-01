'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { MessageCircle, X, Send, ShieldCheck, LogIn, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = getSupabaseBrowserClient()
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      setUserEmail(session?.user?.email ?? null)
    }
    check()
    const { data } = supabase.auth.onAuthStateChange((_e, updated) => {
      setIsAuth(!!updated)
      setUserEmail(updated?.user?.email ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (open && isAuth) {
      setTimeout(() => inputRef.current?.focus(), 220)
    }
  }, [open, isAuth])

  const handleSend = async () => {
    const text = message.trim()
    if (!text || !isAuth) return
    setStatus('sending')
    setErrorMsg(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setStatus('error')
        setErrorMsg('Sua sessão expirou. Entre novamente.')
        setIsAuth(false)
        return
      }
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data?.error || 'Não conseguimos enviar agora.')
        return
      }
      setStatus('sent')
      setMessage('')
      setTimeout(() => setStatus('idle'), 2400)
    } catch (err) {
      setStatus('error')
      setErrorMsg('Sem conexão. Tente de novo.')
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        type="button"
        className={`cb-support-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar suporte' : 'Abrir suporte'}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X size={22} strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle size={22} strokeWidth={1.8} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="cb-support-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Suporte Carbi"
          >
            <div className="cb-support-head">
              <div className="cb-support-head-info">
                <div className="cb-support-avatar" aria-hidden="true">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <strong>Suporte Carbi</strong>
                  <span><span className="cb-support-dot" /> Online · resposta em até 1 dia útil</span>
                </div>
              </div>
              <button
                type="button"
                className="cb-support-close"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cb-support-body">
              <div className="cb-support-bubble">
                <p>
                  Oi! 👋 Como podemos ajudar? Conta com a gente para dúvidas sobre
                  anúncios, pagamentos, FIPE ou qualquer problema na plataforma.
                </p>
                <span className="cb-support-time">agora</span>
              </div>

              {!isAuth ? (
                <div className="cb-support-locked">
                  <div className="cb-support-locked-icon">
                    <LogIn size={20} />
                  </div>
                  <p>Entre na sua conta para enviar uma mensagem.</p>
                  <Link href="/entrar?redirect=/" className="cb-btn cb-btn-lime cb-support-cta" onClick={() => setOpen(false)}>
                    Entrar na conta
                  </Link>
                  <p className="cb-support-locked-note">
                    Ainda não tem conta?{' '}
                    <Link href="/cadastro" onClick={() => setOpen(false)}>Criar agora</Link>
                  </p>
                </div>
              ) : (
                <div className="cb-support-form">
                  {userEmail && (
                    <p className="cb-support-form-as">Enviando como <strong>{userEmail}</strong></p>
                  )}
                  <textarea
                    ref={inputRef}
                    className="cb-support-input"
                    placeholder="Escreva sua mensagem…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={3}
                    maxLength={2000}
                    disabled={status === 'sending'}
                  />
                  <div className="cb-support-form-row">
                    <span className="cb-support-form-meta">
                      <ShieldCheck size={12} /> Resposta por e-mail · máx 2000 caracteres
                    </span>
                    <button
                      type="button"
                      className="cb-support-send"
                      onClick={handleSend}
                      disabled={status === 'sending' || !message.trim()}
                    >
                      {status === 'sending' ? <Loader2 size={16} className="cb-support-spin" /> : <Send size={16} />}
                      {status === 'sending' ? 'Enviando' : status === 'sent' ? 'Enviado ✓' : 'Enviar'}
                    </button>
                  </div>
                  {status === 'error' && errorMsg && (
                    <p className="cb-support-error">{errorMsg}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}