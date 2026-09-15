'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MessageCircle, X } from 'lucide-react'

import SupportConversation from './SupportConversation'

export function getSupportWidgetTransition(reduceMotion: boolean) {
  return { duration: reduceMotion ? 0 : 0.18 }
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const wasOpenRef = useRef(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open && wasOpenRef.current) triggerRef.current?.focus()
    wasOpenRef.current = open
  }, [open])

  const transition = getSupportWidgetTransition(Boolean(reduceMotion))

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`cb-support-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Fechar suporte' : 'Precisa de ajuda?'}
        aria-expanded={open}
        aria-controls="carbi-support-panel"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: reduceMotion ? 0 : -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: reduceMotion ? 0 : 90, opacity: 0 }} transition={transition}>
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: reduceMotion ? 0 : 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: reduceMotion ? 0 : -90, opacity: 0 }} transition={transition}>
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
        <span>Precisa de ajuda?</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="carbi-support-panel"
            className="cb-support-panel"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.97 }}
            transition={transition}
            role="dialog"
            aria-modal="false"
            aria-labelledby="carbi-support-title"
          >
            <header className="cb-support-head">
              <div className="cb-support-head-info">
                <div className="cb-support-avatar" aria-hidden="true"><MessageCircle size={16} /></div>
                <div>
                  <strong id="carbi-support-title">Suporte Carbi</strong>
                  <span><span className="cb-support-dot" /> Online · resposta em até 1 dia útil</span>
                </div>
              </div>
              <button type="button" className="cb-support-close" onClick={() => setOpen(false)} aria-label="Fechar suporte">
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <SupportConversation isOpen={open} />
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
