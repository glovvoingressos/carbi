'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ArrowRight, DollarSign, Wallet, Repeat, MessageSquareText, CheckCircle2 } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'
import { formatBRL } from '@/data/cars'
import { PAYMENT_METHOD_LABELS, PaymentMethod, type OfferRow } from '@/lib/offers'

interface OfferModalProps {
  listingId: string
  listingPrice: number
  listingTitle: string
  isOpen: boolean
  onClose: () => void
}

export default function OfferModal({ listingId, listingPrice, listingTitle, isOpen, onClose }: OfferModalProps) {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [step, setStep] = useState<'form' | 'auth' | 'success' | 'error'>('form')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdOffer, setCreatedOffer] = useState<OfferRow | null>(null)

  const handleClose = () => {
    setStep('form')
    setAmount('')
    setPaymentMethod('')
    setMessage('')
    setLoading(false)
    setError(null)
    setCreatedOffer(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!supabaseReady) {
      setError('Serviço indisponível.')
      return
    }

    if (!amount || !paymentMethod) {
      setError('Preencha o valor e a forma de pagamento.')
      return
    }

    const numericAmount = parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.').replace(/\.(?=.*\.)/g, ''))
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Valor inválido.')
      return
    }

    if (numericAmount > 99999999.99) {
      setError('Valor muito alto.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setStep('auth')
        setLoading(false)
        return
      }

      const response = await fetch('/api/marketplace/offers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          amount: numericAmount,
          payment_method: paymentMethod,
          message: message.trim() || undefined,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao enviar oferta.')
      }

      setCreatedOffer(payload)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar oferta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between p-6 pb-0">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-black uppercase tracking-normal text-[#A3A3A3]">
                  Anúncio
                </p>
                <p className="truncate text-[13px] font-semibold text-[#525252]">
                  {listingTitle}
                </p>
                <h3 className="mt-2 text-[17px] font-bold tracking-normal text-[#0A0A0A]">
                  Fazer Oferta
                </h3>
              </div>
              <button onClick={handleClose} className="btn-icon bg-[#FAFAF9] hover:bg-[#EAEAE8] transition-colors" aria-label="Fechar modal de oferta">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === 'auth' && (
              <div className="p-6">
                <p className="text-sm text-[#525252] mb-4">Faça login para enviar uma oferta.</p>
                <AuthCard compact onAuthenticated={() => setStep('form')} />
              </div>
            )}

            {step === 'success' && createdOffer && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981]" strokeWidth={1.5} />
                </div>
                <h4 className="text-lg font-bold text-[#0A0A0A] mb-2">Oferta enviada!</h4>
                <p className="text-sm text-[#525252] mb-6">
                  Sua oferta de <strong>{formatBRL(createdOffer.amount)}</strong> via <strong>{PAYMENT_METHOD_LABELS[createdOffer.payment_method]}</strong> foi enviada ao vendedor.
                  {createdOffer.message && (
                    <span className="block mt-2 text-[#A3A3A3] italic">"{createdOffer.message}"</span>
                  )}
                </p>
                <p className="text-xs text-[#A3A3A3] mb-6">
                  O vendedor pode aceitar, recusar ou fazer uma contraproposta. Você será notificado.
                </p>
                <button onClick={handleClose} className="btn btn-primary w-full">
                  Entendi
                </button>
              </div>
            )}

            {(step === 'form') && (
              <div className="p-6 space-y-5">
                <div>
                  <label htmlFor="offer-amount" className="label text-[#A3A3A3] mb-2">Valor da oferta</label>
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-[#17170F] bg-white px-4 py-3 shadow-sm focus-within:border-[#17170F]">
                    <span className="shrink-0 text-[15px] font-semibold text-[#525252]">R$</span>
                    <input
                      id="offer-amount"
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] font-semibold tracking-normal outline-none placeholder:text-[#A3A3A3] max-[330px]:text-[15px]"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9,]/g, '')
                        const parts = raw.split(',')
                        if (parts.length > 2) return
                        if (parts.length === 2 && parts[1].length > 2) return
                        setAmount(raw)
                      }}
                      aria-label="Valor da oferta em reais"
                    />
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] mt-1.5">
                    Preço do anúncio: {formatBRL(listingPrice)}
                  </p>
                </div>

                <div>
                  <p className="label text-[#A3A3A3] mb-2">Forma de pagamento</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(['cash', 'financing', 'trade_in'] as PaymentMethod[]).map((method) => {
                      const Icon = method === 'cash' ? DollarSign : method === 'financing' ? Wallet : Repeat
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            paymentMethod === method
                              ? 'border-[#17170F] bg-[#17170F]/5'
                              : 'border-[#EAEAE8] hover:border-[#17170F]/30'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-[#17170F]" strokeWidth={1.5} />
                          <span className="text-[14px] font-medium text-[#0A0A0A]">{PAYMENT_METHOD_LABELS[method]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="offer-message" className="label text-[#A3A3A3] mb-2">Observação <span className="text-[#A3A3A3]/50">(opcional)</span></label>
                  <textarea
                    id="offer-message"
                    className="input min-h-[80px] resize-none py-3 text-[14px] leading-relaxed"
                    placeholder="Ex: Posso fechar esta semana. Pagamento à vista."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                    aria-label="Observação sobre a oferta"
                  />
                  <p className="text-[11px] text-[#A3A3A3] mt-1 text-right">{message.length}/500</p>
                </div>

                {error && (
                  <p className="text-[13px] text-[#DC2626] bg-[#FEF2F2] rounded-xl p-3 border border-[#FECACA]">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !amount || !paymentMethod}
                  className="btn btn-primary w-full shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" strokeWidth={1.75} />}
                  Enviar oferta
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
