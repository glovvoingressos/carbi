'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageSquare, DollarSign, ArrowLeftRight, Check, X, Clock, History } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { OfferRow, PAYMENT_METHOD_LABELS, OFFER_STATUS_LABELS, OFFER_STATUS_COLORS } from '@/lib/offers'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import SellerOfferActions from './SellerOfferActions'

interface OfferHistoryProps {
  listingId: string
  isSeller: boolean
  accessToken: string | null
}

function groupOffersIntoThreads(offers: OfferRow[]): OfferRow[][] {
  const threadMap = new Map<string, OfferRow[]>()
  const rootOffers = offers.filter(o => !o.parent_offer_id)

  for (const root of rootOffers) {
    const thread = [root]
    const children = offers.filter(o => o.parent_offer_id === root.id)
    thread.push(...children.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    threadMap.set(root.id, thread)
  }

  return Array.from(threadMap.values())
    .sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime())
}

export default function OfferHistory({ listingId, isSeller, accessToken }: OfferHistoryProps) {
  const [offers, setOffers] = useState<OfferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const token = accessToken
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/marketplace/offers?listingId=${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) return
      const data = await response.json()
      setOffers(data || [])
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [listingId, accessToken])

  const threads = groupOffersIntoThreads(offers)

  if (!accessToken) return null
  if (loading && offers.length === 0) return null
  if (offers.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="container py-12 border-t border-white/70"
    >
      <div className="flex items-center gap-2 mb-8">
        <History className="w-5 h-5 text-[#17170F]" strokeWidth={1.5} />
        <h2 className="text-balance">Histórico de ofertas</h2>
      </div>

      <div className="space-y-4 max-w-2xl">
        {threads.map((thread) => (
          <div key={thread[0].id} className="surface overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(expanded === thread[0].id ? null : thread[0].id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-bold text-[#0A0A0A]">{formatBRL(thread[0].amount)}</span>
                  <span className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold ${OFFER_STATUS_COLORS[thread[0].status]}`}>
                    {OFFER_STATUS_LABELS[thread[0].status]}
                  </span>
                </div>
                <p className="text-[12px] text-[#A3A3A3] mt-1">
                  {PAYMENT_METHOD_LABELS[thread[0].payment_method]} · {new Date(thread[0].created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 text-[#A3A3A3] transition-transform ${expanded === thread[0].id ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            </button>

            <AnimatePresence>
              {expanded === thread[0].id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4 border-t border-[#EAEAE8] pt-4">
                    {thread[0].message && (
                      <div className="bg-[#FAFAF9] rounded-xl p-4">
                        <p className="text-[11px] font-semibold text-[#A3A3A3] uppercase tracking-wider mb-1">Mensagem do comprador</p>
                        <p className="text-[14px] text-[#525252]">{thread[0].message}</p>
                      </div>
                    )}

                    {thread.slice(1).map((response) => (
                      <div key={response.id} className="bg-[#FAFAF9] rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.5} />
                          <span className="text-[13px] font-semibold text-[#525252]">Contraproposta do vendedor</span>
                          <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${OFFER_STATUS_COLORS[response.status]}`}>
                            {OFFER_STATUS_LABELS[response.status]}
                          </span>
                        </div>
                        {response.counter_amount && (
                          <p className="text-[15px] font-bold text-[#0A0A0A]">{formatBRL(response.counter_amount)}</p>
                        )}
                        {response.seller_message && (
                          <p className="text-[13px] text-[#525252]">{response.seller_message}</p>
                        )}
                        {response.status === 'accepted' && (
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#10B981]">
                            <Check className="w-4 h-4" strokeWidth={2} /> Aceita pelo comprador
                          </div>
                        )}
                        {response.status === 'rejected' && (
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#DC2626]">
                            <X className="w-4 h-4" strokeWidth={2} /> Recusada pelo comprador
                          </div>
                        )}
                      </div>
                    ))}

                    {isSeller && thread[0].status === 'pending' && accessToken && (
                      <SellerOfferActions
                        offer={thread[0]}
                        accessToken={accessToken}
                        onUpdate={fetchOffers}
                      />
                    )}

                    {thread[0].status === 'countered' && !isSeller && (
                      <div className="space-y-2">
                        <p className="text-[13px] text-[#525252]">O vendedor fez uma contraproposta. Acesse suas ofertas para responder.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
