'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel()
      }
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className={`ref-confirm-overlay ${isVisible ? 'visible' : ''}`} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={`ref-confirm-modal ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="ref-confirm-close" onClick={onCancel} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className={`ref-confirm-icon ${variant}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="ref-confirm-actions">
          <button className="ref-btn ref-btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`ref-btn ${variant === 'danger' ? 'ref-btn-danger' : 'ref-btn-chartreuse'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
