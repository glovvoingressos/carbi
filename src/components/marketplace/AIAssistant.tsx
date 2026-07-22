'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Upload, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { analyzeCarImages } from '@/lib/integrations/nvidia/client'
import type { CarImageAnalysis, FormAssistance } from '@/lib/integrations/nvidia/types'

interface AIAssistantProps {
  onApply: (data: {
    title: string
    description: string
    brand: string
    model: string
    year: number
    features: string[]
  }) => void
}

export default function AIAssistant({ onApply }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ analysis: CarImageAnalysis; listing: FormAssistance } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return
    const capped = Array.from(files).slice(0, 5)
    const readers = capped.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(file)
      })
    })
    const previewReaders = capped.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    })
    Promise.all([Promise.all(readers), Promise.all(previewReaders)]).then(([b64, prev]) => {
      setImages(b64)
      setPreviews(prev)
      setResult(null)
      setError(null)
    })
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!images.length) return
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeCarImages(images)
      setResult(data)
    } catch {
      setError('Erro ao analisar imagens. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [images])

  const handleApply = useCallback(() => {
    if (!result) return
    onApply({
      title: result.listing.suggestedTitle,
      description: result.listing.suggestedDescription,
      brand: result.analysis.brand || '',
      model: result.analysis.model || '',
      year: result.analysis.year || new Date().getFullYear(),
      features: result.listing.detectedFeatures,
    })
    setIsOpen(false)
    setResult(null)
    setImages([])
    setPreviews([])
  }, [result, onApply])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        title="Assistente IA"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Assistente IA</h3>
                    <p className="text-[10px] text-white/40">Analise fotos do veículo</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {!result ? (
                  <>
                    {/* Upload area */}
                    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center transition-colors hover:border-violet-500/50 hover:bg-violet-500/5">
                      {previews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {previews.map((src, i) => (
                            <img key={i} src={src} alt="" className="aspect-square rounded-lg object-cover" />
                          ))}
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto mb-2 h-8 w-8 text-white/20" />
                          <p className="text-xs font-bold text-white/60">Fotos do veículo</p>
                          <p className="text-[10px] text-white/30 mt-1">Até 5 imagens · JPG, PNG</p>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                    </label>

                    {error && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-xs text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                      </div>
                    )}

                    <button
                      onClick={handleAnalyze}
                      disabled={!images.length || loading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {loading ? 'Analisando…' : 'Analisar com IA'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Results */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-xs text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Veículo identificado
                      </div>

                      <div className="rounded-xl bg-white/5 p-4 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-white">
                            {result.analysis.brand} {result.analysis.model}
                          </span>
                          <span className="text-sm text-white/40">{result.analysis.year}</span>
                        </div>
                        <p className="text-xs text-white/50">{result.analysis.color} · {result.analysis.bodyStyle} · {result.analysis.condition}</p>
                      </div>

                      <div className="rounded-xl bg-white/5 p-4 space-y-1.5">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Título sugerido</p>
                        <p className="text-sm font-bold text-white">{result.listing.suggestedTitle}</p>
                      </div>

                      <div className="rounded-xl bg-white/5 p-4 space-y-1.5">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Descrição</p>
                        <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{result.listing.suggestedDescription}</p>
                      </div>

                      {result.listing.detectedFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.listing.detectedFeatures.map((f) => (
                            <span key={f} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-300 border border-violet-500/20">{f}</span>
                          ))}
                        </div>
                      )}

                      {result.listing.warnings.length > 0 && (
                        <div className="rounded-lg bg-amber-500/10 p-3">
                          {result.listing.warnings.map((w) => (
                            <p key={w} className="text-[10px] text-amber-400">⚠ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setResult(null); setImages([]); setPreviews([]) }}
                        className="flex-1 h-11 rounded-xl bg-white/5 text-white/60 text-sm font-bold hover:bg-white/10 transition-colors"
                      >
                        Outras fotos
                      </button>
                      <button
                        onClick={handleApply}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
                      >
                        <Check className="w-4 h-4" /> Aplicar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
