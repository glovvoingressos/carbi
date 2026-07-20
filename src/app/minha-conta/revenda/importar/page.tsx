'use client'

import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import SpreadsheetUpload from '@/components/revenda/SpreadsheetUpload'
import ColumnMapper from '@/components/revenda/ColumnMapper'
import { autoMapColumns } from '@/lib/revenda/adapters/spreadsheet'

export default function ImportarPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload')
  const [columns, setColumns] = useState<{ index: number; header: string; mappedTo?: string }[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  const handleFile = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return

    const delimiter = file.name.endsWith('.csv') ? ',' : '\t'
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/["\']/g, ''))
    const mapped = autoMapColumns(headers)
    setColumns(mapped)

    const rows = lines.slice(1, 6).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/["\']/g, ''))
      const row: Record<string, string> = {}
      mapped.forEach((col, i) => {
        if (col.mappedTo) row[col.mappedTo] = values[i] || ''
      })
      return row
    })
    setPreviewData(rows)
    setStep('mapping')
  }

  const handleImport = async () => {
    setImporting(true)
    // TODO: Call API to start import
    await new Promise(r => setTimeout(r, 2000))
    setStep('done')
    setImporting(false)
  }

  return (
    <div className="fingen-page">
      <main className="fingen-main">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
          <Link href="/minha-conta/revenda" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '24px' }}>
            <ArrowLeft size={16} /> Voltar ao dashboard
          </Link>

          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Importar veículos</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Faça upload de uma planilha XLSX ou CSV com seus veículos.</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {['upload', 'mapping', 'preview', 'done'].map((s, i) => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: ['upload', 'mapping', 'preview', 'done'].indexOf(step) >= i ? '#D4F576' : 'var(--color-bg-muted)' }} />
            ))}
          </div>

          {step === 'upload' && <SpreadsheetUpload onFileSelected={handleFile} />}

          {step === 'mapping' && (
            <>
              <ColumnMapper columns={columns} onChange={setColumns} />
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button onClick={() => setStep('preview')} style={{ padding: '12px 24px', background: '#D4F576', color: '#1A1A1A', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Próximo
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {columns.filter(c => c.mappedTo).map(c => (
                        <th key={c.index} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{c.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        {columns.filter(c => c.mappedTo).map(c => (
                          <td key={c.index} style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>{row[c.mappedTo!]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep('mapping')} style={{ padding: '12px 24px', background: 'var(--color-bg-muted)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Voltar
                </button>
                <button onClick={handleImport} disabled={importing} style={{ padding: '12px 24px', background: '#D4F576', color: '#1A1A1A', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: importing ? 0.6 : 1 }}>
                  {importing ? 'Importando...' : 'Importar veículos'}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D4F576', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={32} color="#1A1A1A" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Importação iniciada!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Seus veículos estão sendo processados. Você receberá uma notificação quando finalizar.</p>
              <Link href="/minha-conta/revenda" style={{ padding: '12px 24px', background: '#D4F576', color: '#1A1A1A', border: 'none', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                Voltar ao dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
