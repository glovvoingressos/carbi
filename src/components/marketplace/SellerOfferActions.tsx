'use client'

import { useState } from 'react'
import { Check, X, ArrowLeftRight, Loader2 } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { PAYMENT_METHOD_LABELS, OFFER_STATUS_LABELS, OFFER_STATUS_COLORS, OfferRow, CounterOfferPayload } from '@/lib/offers'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

interface SellerOfferActionsProps {
  offer: OfferRow
  accessToken: string
  onUpdate: () => void
}

type ActionType = 'accept' | 'reject' | 'counter' | null

export default function SellerOfferActions({ offer, accessToken, onUpdate }: SellerOfferActionsProps) {
  const [action, setAction] = useState<ActionType>(null)
  const [counterAmount, setCounterAmount] = useState('')
  const [sellerMessage, setSellerMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAct = offer.status === 'pending'

  const handleAction = async (type: 'accept' | 'reject' | 'counter') => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const response = await fetch(`/api/marketplace/offers/${offer.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: type,
          counter_amount: type === 'counter' ? parseFloat(counterAmount.replace(',', '.')) : undefined,
          seller_message: type === 'counter' ? sellerMessage.trim() || undefined : undefined,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao processar.')
      }

      setAction(null)
      setCounterAmount('')
      setSellerMessage('')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar.')
    } finally {
      setLoading(false)
    }
  }

  if (offer.status !== 'pending') {
    return (
      <div className={`rounded-xl border px-4 py-3 ${OFFER_STATUS_COLORS[offer.status]}`}>
        <span className="text-[13px] font-semibold">{OFFER_STATUS_LABELS[offer.status]}</span>
        {offer.resolved_at && (
          <span className="text-[11px] ml-2 opacity-70">
            {new Date(offer.resolved_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    )
  }

  if (action === 'counter') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="counter-amount" className="label text-[#A3A3A3] mb-2">Sua contraproposta</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3] font-medium">R$</span>
            <input
              id="counter-amount"
              className="input pl-10 text-[15px] font-semibold"
              placeholder="0,00"
              value={counterAmount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9,]/g, '')
                const parts = raw.split(',')
                if (parts.length > 2) return
                if (parts.length === 2 && parts[1].length > 2) return
                setCounterAmount(raw)
              }}
              aria-label="Valor da contraproposta em reais"
            />
          </div>
        </div>
        <div>
          <label htmlFor="seller-message" className="label text-[#A3A3A3] mb-2">Mensagem <span className="text-[#A3A3A3]/50">(opcional)</span></label>
          <textarea
            id="seller-message"
            className="input min-h-[60px] resize-none py-3 text-[14px] leading-relaxed"
            placeholder="Ex: O valor mais baixo que posso fazer é este."
            value={sellerMessage}
            onChange={(e) => setSellerMessage(e.target.value.slice(0, 500))}
            aria-label="Mensagem para o comprador"
          />
        </div>
        {error && <p className="text-[13px] text-[#DC2626]">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setAction(null); setCounterAmount(''); setSellerMessage(''); setError(null) }}
            className="btn btn-secondary flex-1"
            disabled={loading}
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => handleAction('counter')}
            disabled={loading || !counterAmount}
            className="btn btn-primary flex-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enviar contraproposta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-[13px] text-[#DC2626] bg-[#FEF2F2] rounded-xl p-3 border border-[#FECACA]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAction('accept')}
          disabled={loading || !canAct}
          className="btn btn-primary flex-1 text-[13px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2} />}
          Aceitar
        </button>
        <button
          type="button"
          onClick={() => setAction('counter')}
          disabled={loading || !canAct}
          className="btn btn-secondary flex-1 text-[13px]"
        >
          <ArrowLeftRight className="w-4 h-4" strokeWidth={1.75} />
          Contrapropor
        </button>
        <button
          type="button"
          onClick={() => handleAction('reject')}
          disabled={loading || !canAct}
          className="btn-icon bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626]"
          aria-label="Recusar oferta"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
