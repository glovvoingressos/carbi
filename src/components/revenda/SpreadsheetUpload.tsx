'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'

interface SpreadsheetUploadProps {
  onFileSelected: (file: File) => void
}

export default function SpreadsheetUpload({ onFileSelected }: SpreadsheetUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'csv') {
      alert('Formato não suportado. Use XLSX ou CSV.')
      return
    }
    setSelectedFile(file)
    onFileSelected(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="revenda-upload-area">
      {selectedFile ? (
        <div className="revenda-upload-selected">
          <FileSpreadsheet size={24} />
          <span>{selectedFile.name}</span>
          <button onClick={() => { setSelectedFile(null) }} className="revenda-upload-remove">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`revenda-upload-dropzone ${dragOver ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={32} className="revenda-upload-icon" />
          <p className="revenda-upload-text">Arraste um arquivo XLSX ou CSV</p>
          <p className="revenda-upload-hint">ou clique para selecionar</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}
