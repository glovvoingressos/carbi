'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, MessageCircle } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  listingSlug?: string
  listingTitle?: string
  onClose?: () => void
}

export default function SuccessModal({ isOpen, listingSlug, listingTitle, onClose }: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={`ref-success-overlay ${isVisible ? 'visible' : ''}`} onClick={onClose} role="dialog" aria-modal="true" aria-label="Anúncio publicado com sucesso">
      <div className={`ref-success-modal ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="ref-success-icon">
          <CheckCircle2 size={48} />
        </div>
        <h2>Anúncio publicado!</h2>
        <p>Seu {listingTitle || 'carro'} já está disponível no marketplace.</p>
        <div className="ref-success-actions">
          <Link href={`/anuncios/${listingSlug || ''}`} className="ref-btn ref-btn-chartreuse ref-btn-wide">
            <ExternalLink size={16} /> Ver anúncio
          </Link>
          <Link href="/minha-conta/anuncios" className="ref-btn ref-btn-ghost ref-btn-wide">
            Meus anúncios
          </Link>
        </div>
        <div className="ref-success-tip">
          <MessageCircle size={14} />
          <span>Responda rapidamente pelo chat para vender mais rápido</span>
        </div>
      </div>
    </div>
  )
}
