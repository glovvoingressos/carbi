export type PaymentMethod = 'cash' | 'financing' | 'trade_in'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'negotiating' | 'completed'

export type OfferRow = {
  id: string
  listing_id: string
  buyer_user_id: string
  seller_user_id: string
  amount: number
  payment_method: PaymentMethod
  message: string | null
  status: OfferStatus
  parent_offer_id: string | null
  counter_amount: number | null
  seller_message: string | null
  accepted_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type OfferThread = {
  id: string
  amount: number
  payment_method: PaymentMethod
  message: string | null
  status: OfferStatus
  counter_amount: number | null
  seller_message: string | null
  created_at: string
  is_buyer_initiated: boolean
  responses: OfferThread[]
}

export type CreateOfferPayload = {
  listing_id: string
  amount: number
  payment_method: PaymentMethod
  message?: string
}

export type CounterOfferPayload = {
  offer_id: string
  counter_amount: number
  seller_message?: string
}

export type NegotiableLevel = 'open' | 'low' | 'firm'

export type NegotiationSettings = {
  accepts_offers: boolean
  negotiable: NegotiableLevel
  accepts_counter: boolean
  accepts_trade: boolean
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'À vista',
  financing: 'Financiamento',
  trade_in: 'Troca + volta',
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
  countered: 'Contraproposta',
  negotiating: 'Em negociação',
  completed: 'Negociação concluída',
}

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  pending: 'text-[#F59E0B] bg-[#FFF8DF] border-[#FDE68A]',
  accepted: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]',
  rejected: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
  countered: 'text-[#3B82F6] bg-[#EFF6FF] border-[#BFDBFE]',
  negotiating: 'text-[#8B5CF6] bg-[#F5F3FF] border-[#DDD6FE]',
  completed: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]',
}

export const NEGOTIABLE_LABELS: Record<NegotiableLevel, string> = {
  open: 'Aceita ofertas',
  low: 'Pouco negociável',
  firm: 'Valor firme',
}

export function validateOfferPayload(payload: CreateOfferPayload): string[] {
  const errors: string[] = []

  if (!payload.listing_id) errors.push('Anúncio é obrigatório.')
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    errors.push('Valor da oferta deve ser maior que zero.')
  }
  if (payload.amount > 99999999.99) {
    errors.push('Valor da oferta muito alto.')
  }
  if (!['cash', 'financing', 'trade_in'].includes(payload.payment_method)) {
    errors.push('Forma de pagamento inválida.')
  }
  if (payload.message && payload.message.length > 500) {
    errors.push('Observação deve ter no máximo 500 caracteres.')
  }

  return errors
}

export function validateCounterPayload(payload: CounterOfferPayload): string[] {
  const errors: string[] = []

  if (!payload.offer_id) errors.push('Oferta é obrigatória.')
  if (!Number.isFinite(payload.counter_amount) || payload.counter_amount <= 0) {
    errors.push('Valor da contraproposta deve ser maior que zero.')
  }
  if (payload.counter_amount > 99999999.99) {
    errors.push('Valor da contraproposta muito alto.')
  }
  if (payload.seller_message && payload.seller_message.length > 500) {
    errors.push('Mensagem deve ter no máximo 500 caracteres.')
  }

  return errors
}
