'use client'

import { Trash2, Pause, Play, RefreshCw, Edit, Star } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onAction: (action: string) => void
  onClear: () => void
}

export default function BulkActionsBar({ selectedCount, onAction, onClear }: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="revenda-bulk-bar">
      <div className="revenda-bulk-info">
        <span>{selectedCount} selecionado{selectedCount > 1 ? 's' : ''}</span>
        <button onClick={onClear} className="revenda-bulk-clear">Limpar</button>
      </div>
      <div className="revenda-bulk-actions">
        <button onClick={() => onAction('edit-price')} className="revenda-bulk-btn" title="Editar preço">
          <Edit size={16} /> Preço
        </button>
        <button onClick={() => onAction('pause')} className="revenda-bulk-btn" title="Pausar">
          <Pause size={16} /> Pausar
        </button>
        <button onClick={() => onAction('activate')} className="revenda-bulk-btn" title="Ativar">
          <Play size={16} /> Ativar
        </button>
        <button onClick={() => onAction('renew')} className="revenda-bulk-btn" title="Renovar">
          <RefreshCw size={16} /> Renovar
        </button>
        <button onClick={() => onAction('feature')} className="revenda-bulk-btn" title="Destacar">
          <Star size={16} /> Destacar
        </button>
        <button onClick={() => onAction('delete')} className="revenda-bulk-btn danger" title="Excluir">
          <Trash2 size={16} /> Excluir
        </button>
      </div>
    </div>
  )
}
