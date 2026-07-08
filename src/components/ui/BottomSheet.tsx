'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <>
      <div 
        className={`bottom-sheet-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={`bottom-sheet ${isOpen ? 'active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="bottom-sheet-handle" />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          {title && <h3 className="bottom-sheet-title" style={{ margin: 0 }}>{title}</h3>}
          <button 
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-bg-muted)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        
        {children}
      </div>
    </>
  )
}
