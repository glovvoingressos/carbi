'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Check, AlertTriangle, X, Camera, Plus, Loader2 } from 'lucide-react'

interface Review {
  id: string
  userName: string
  rating: number
  pros: string[]
  cons: string[]
  comment: string
  photos: string[]
  date: string
}

export default function ReviewSection({ carId: _carId }: { carId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 0,
    pros: [''],
    cons: [''],
    comment: '',
    photos: ''
  })

  const handleClose = useCallback(() => {
    setIsFormOpen(false)
  }, [])

  useEffect(() => {
    if (!isFormOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFormOpen, handleClose])

  const addField = (type: 'pros' | 'cons') => {
    setNewReview(prev => ({ ...prev, [type]: [...prev[type], ''] }))
  }

  const updateField = (type: 'pros' | 'cons', index: number, value: string) => {
    const list = [...newReview[type]]
    list[index] = value
    setNewReview(prev => ({ ...prev, [type]: list }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newReview.rating === 0) return alert('Por favor, selecione uma nota!')

    setIsSubmitting(true)

    const review: Review = {
      id: Math.random().toString(),
      userName: newReview.userName || 'Anônimo',
      rating: newReview.rating,
      pros: newReview.pros.filter(p => p.trim()),
      cons: newReview.cons.filter(c => c.trim()),
      comment: newReview.comment,
      photos: newReview.photos ? [newReview.photos] : [],
      date: 'Agora'
    }

    setReviews([review, ...reviews])
    setIsFormOpen(false)
    setNewReview({ userName: '', rating: 0, pros: [''], cons: [''], comment: '', photos: '' })
    setIsSubmitting(false)
  }

  return (
    <section className="py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="eyebrow mb-2">Voz do dono</p>
          <h2 className="text-balance">Quem dirige todo dia sabe o que o carro entrega.</h2>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary">
          Dar minha opinião
        </button>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map(review => (
            <article key={review.id} className="bg-white border border-[#EAEAE8] rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight">{review.userName}</p>
                  <p className="text-[11px] text-[#6F6F6F] tracking-tight">{review.date}</p>
                </div>
                <div className="flex gap-0.5" role="img" aria-label={`Nota ${review.rating} de 5 estrelas`}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-[#FACC15] text-[#FACC15]' : 'text-[#EAEAE8]'}`} strokeWidth={1.5} />
                  ))}
                </div>
              </div>

              <p className="text-[15px] text-[#525252] mb-6 leading-relaxed">
                <span className="text-[#A3A3A3]">"</span>{review.comment}<span className="text-[#A3A3A3]">"</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {review.pros.length > 0 && (
                  <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#BBF7D0]">
                    <p className="text-[11px] font-semibold text-[#16A34A] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <ThumbsUp className="w-3 h-3" /> Prós
                    </p>
                    <ul className="space-y-2">
                      {review.pros.map((p, i) => (
                        <li key={i} className="text-[13px] text-[#1A1A1A] flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[#16A34A] mt-0.5 flex-shrink-0" strokeWidth={2.5} /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {review.cons.length > 0 && (
                  <div className="bg-[#FEF2F2] p-4 rounded-xl border border-[#FECACA]">
                    <p className="text-[11px] font-semibold text-[#DC2626] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <ThumbsDown className="w-3 h-3" /> Contras
                    </p>
                    <ul className="space-y-2">
                      {review.cons.map((c, i) => (
                        <li key={i} className="text-[13px] text-[#1A1A1A] flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] mt-0.5 flex-shrink-0" strokeWidth={2} /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {review.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {review.photos.map((p, i) => (
                    <img key={i} src={p} alt={`Foto da avaliação de ${review.userName}`} className="w-24 h-20 object-cover rounded-xl border border-[#EAEAE8] flex-shrink-0" />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="w-full bg-white border-2 border-dashed border-[#EAEAE8] rounded-2xl p-12 text-center cursor-pointer hover:bg-[#FAFAF9] hover:border-[#D1D5DB] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1]"
          onClick={() => setIsFormOpen(true)}
        >
          <div className="w-14 h-14 bg-[#F5F5F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-[#6F6F6F]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1A1A1A] tracking-tight mb-2">Faça a primeira avaliação</h3>
          <p className="text-[14px] text-[#525252] max-w-sm mx-auto">
            Você é dono deste carro ou já dirigiu muito? Compartilhe sua experiência real.
          </p>
        </button>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="review-form-title">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={handleClose} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#EAEAE8] flex items-center justify-between">
              <h3 id="review-form-title" className="text-[18px] font-semibold text-[#1A1A1A] tracking-tight">Sua opinião vale muito</h3>
              <button onClick={handleClose} className="btn-icon" aria-label="Fechar formulário de avaliação">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <label className="block text-[12px] font-semibold text-[#525252] mb-2 tracking-tight uppercase">Nota geral</label>
                <div className="flex gap-1" role="radiogroup" aria-label="Nota geral">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewReview(prev => ({ ...prev, rating: s }))}
                      role="radio"
                      aria-checked={s <= newReview.rating}
                      aria-label={`${s} estrela${s > 1 ? 's' : ''}`}
                      className="p-1 rounded-lg transition-all hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1]"
                    >
                      <Star className={`w-8 h-8 transition-colors ${s <= newReview.rating ? 'fill-[#FACC15] text-[#FACC15]' : 'text-[#E5E7EB] hover:text-[#FDE68A]'}`} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="review-name" className="block text-[12px] font-semibold text-[#525252] mb-1.5 tracking-tight uppercase">Seu nome</label>
                  <input
                    id="review-name"
                    type="text"
                    value={newReview.userName}
                    onChange={e => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Ex: João Silva"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="review-photo" className="block text-[12px] font-semibold text-[#525252] mb-1.5 tracking-tight uppercase">Link da foto (URL)</label>
                  <div className="relative">
                    <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
                    <input
                      id="review-photo"
                      type="text"
                      value={newReview.photos}
                      onChange={e => setNewReview(prev => ({ ...prev, photos: e.target.value }))}
                      placeholder="https://..."
                      className="input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="review-comment" className="block text-[12px] font-semibold text-[#525252] mb-1.5 tracking-tight uppercase">Experiência geral</label>
                <textarea
                  id="review-comment"
                  value={newReview.comment}
                  onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Conte como é dirigir esse carro no dia a dia..."
                  rows={4}
                  className="input py-3 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-semibold text-[#16A34A] tracking-tight uppercase">O que você amou?</label>
                    <button type="button" onClick={() => addField('pros')} className="w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] hover:bg-[#DCFCE7] transition-colors" aria-label="Adicionar ponto positivo">
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newReview.pros.map((p, i) => (
                      <input
                        key={i}
                        type="text"
                        value={p}
                        onChange={e => updateField('pros', i, e.target.value)}
                        placeholder="Ex: Baixo consumo"
                        className="input"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-semibold text-[#525252] tracking-tight uppercase">O que te incomodou?</label>
                    <button type="button" onClick={() => addField('cons')} className="w-8 h-8 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] hover:bg-[#FEE2E2] transition-colors" aria-label="Adicionar ponto negativo">
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newReview.cons.map((c, i) => (
                      <input
                        key={i}
                        type="text"
                        value={c}
                        onChange={e => updateField('cons', i, e.target.value)}
                        placeholder="Ex: Porta-luvas pequeno"
                        className="input"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar avaliação'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
