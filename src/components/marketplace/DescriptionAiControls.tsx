'use client'

import { useState } from 'react'
import { Sparkles, RotateCcw, Loader2 } from 'lucide-react'

type Props = {
  value: string
  onApply: (next: string) => void
}

export default function DescriptionAiControls({ value, onApply }: Props) {
  const [formatted, setFormatted] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = value.trim()
  const canSubmit = trimmed.length >= 20 && !loading

  async function handleFormat() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/marketplace/format-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Não foi possível formatar agora.')
        setFormatted(null)
        return
      }
      const next = typeof data?.formatted === 'string' ? data.formatted.trim() : ''
      if (!next) {
        setError('A IA não retornou um texto válido.')
        return
      }
      setFormatted(next)
    } catch (err) {
      setError('Falha de conexão com a IA. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    if (formatted == null) return
    onApply(formatted)
    setFormatted(null)
    setError(null)
  }

  function handleDiscard() {
    setFormatted(null)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#7B7466]">
          {trimmed.length < 20
            ? 'Digite pelo menos 20 caracteres para usar a IA.'
            : 'A IA só reorganiza o que você escreveu — sem inventar nada.'}
        </p>
        <button
          type="button"
          onClick={handleFormat}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-[#111] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#D6D2C7] disabled:text-[#7B7466]"
          aria-label="Formatar descrição com IA"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Formatando…' : 'Formatar com IA'}
        </button>
      </div>

      {error ? (
        <p className="text-xs font-medium text-[#B23B3B]">{error}</p>
      ) : null}

      {formatted != null ? (
        <div className="rounded-2xl border border-[#E9E3D6] bg-[#FAF7EF] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7B7466]">
              <Sparkles className="h-3.5 w-3.5" />
              Sugestão da IA
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center gap-1 rounded-full border border-[#E0DACA] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4F4A3E] transition hover:bg-[#F4EFE3]"
              >
                <RotateCcw className="h-3 w-3" />
                Descartar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1 rounded-full bg-[#111] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-black"
              >
                Aplicar
              </button>
            </div>
          </div>
          <pre className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1A1A1A] font-sans">
{formatted}
          </pre>
        </div>
      ) : null}
    </div>
  )
}