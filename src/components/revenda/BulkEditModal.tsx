'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface BulkEditModalProps {
  selectedCount: number
  onConfirm: (updates: Record<string, any>) => void
  onClose: () => void
}

export default function BulkEditModal({ selectedCount, onConfirm, onClose }: BulkEditModalProps) {
  const [field, setField] = useState('price')
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    const updates: Record<string, any> = {}
    if (field === 'price' || field === 'mileage') {
      updates[field] = Number(value)
    } else {
      updates[field] = value
    }
    onConfirm(updates)
  }

  return (
    <div className="revenda-modal-overlay" onClick={onClose}>
      <div className="revenda-modal" onClick={e => e.stopPropagation()}>
        <div className="revenda-modal-header">
          <h3>Editar {selectedCount} veículo{selectedCount > 1 ? 's' : ''}</h3>
          <button onClick={onClose} className="revenda-modal-close"><X size={18} /></button>
        </div>
        <div className="revenda-modal-body">
          <label className="revenda-modal-label">Campo</label>
          <select className="revenda-modal-select" value={field} onChange={e => setField(e.target.value)}>
            <option value="price">Preço</option>
            <option value="city">Cidade</option>
            <option value="state">Estado</option>
            <option value="description">Descrição</option>
            <option value="status">Status</option>
          </select>
          <label className="revenda-modal-label">Novo valor</label>
          {field === 'status' ? (
            <select className="revenda-modal-select" value={value} onChange={e => setValue(e.target.value)}>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="sold">Vendido</option>
            </select>
          ) : field === 'description' ? (
            <textarea className="revenda-modal-textarea" value={value} onChange={e => setValue(e.target.value)} rows={3} />
          ) : (
            <input className="revenda-modal-input" type={field === 'price' || field === 'mileage' ? 'number' : 'text'} value={value} onChange={e => setValue(e.target.value)} placeholder="Novo valor..." />
          )}
        </div>
        <div className="revenda-modal-footer">
          <button onClick={onClose} className="revenda-modal-cancel">Cancelar</button>
          <button onClick={handleSubmit} className="revenda-modal-confirm">Aplicar</button>
        </div>
      </div>
    </div>
  )
}
