'use client'

import { useState } from 'react'
import { Star, Plus, X, MessageSquare, ThumbsUp, ThumbsDown, Camera, Check, AlertTriangle } from 'lucide-react'
import Badge from '@/components/ui/Badge'

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

export default function ReviewSection({ carId }: { carId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 0,
    pros: [''],
    cons: [''],
    comment: '',
    photos: ''
  })

  const addField = (type: 'pros' | 'cons') => {
    setNewReview(prev => ({ ...prev, [type]: [...prev[type], ''] }))
  }

  const updateField = (type: 'pros' | 'cons', index: number, value: string) => {
    const list = [...newReview[type]]
    list[index] = value
    setNewReview(prev => ({ ...prev, [type]: list }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newReview.rating === 0) return alert('Por favor, selecione uma nota!')
    
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
  }

  return (
    <section className="mt-20 mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-dark tracking-tighter uppercase mb-2">Voz do Dono</h2>
          <p className="text-lg text-dark/50 font-medium">Quem dirige todo dia sabe o que o carro entrega.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="px-8 py-4 bg-dark text-white rounded-full font-black uppercase tracking-widest shadow-[6px_6px_0_#94E2CD] hover:-translate-y-1 transition-all active:translate-y-0"
        >
          Dar minha opinião
        </button>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border-2 border-dark rounded-[40px] p-8 shadow-[8px_8px_0_#0A0A0A] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-black text-xl uppercase tracking-tight">{review.userName}</p>
                  <p className="text-xs font-bold text-dark/30 uppercase tracking-widest">{review.date}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= review.rating ? 'fill-dark text-dark' : 'text-dark/10'}`} />
                  ))}
                </div>
              </div>

              <p className="text-dark/70 font-medium mb-8 leading-relaxed italic">"{review.comment}"</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-[var(--color-bg)-alt] p-5 rounded-3xl border border-dark/5">
                  <p className="text-[10px] font-black text-[#00D632] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <ThumbsUp className="w-3 h-3" /> Prós
                  </p>
                  <ul className="space-y-2">
                    {review.pros.map((p, i) => (
                      <li key={i} className="text-sm font-bold text-dark flex items-start gap-2">
                         <Check className="w-4 h-4 text-[#00D632] mt-0.5 flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[var(--color-bg)-alt] p-5 rounded-3xl border border-dark/5">
                  <p className="text-[10px] font-semibold text-dark/50 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                     <ThumbsDown className="w-3 h-3" /> Contras
                  </p>
                  <ul className="space-y-2">
                    {review.cons.map((c, i) => (
                      <li key={i} className="text-sm font-bold text-dark flex items-start gap-2">
                         <AlertTriangle className="w-4 h-4 text-dark/40 mt-0.5 flex-shrink-0" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {review.photos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {review.photos.map((p, i) => (
                    <img key={i} src={p} alt="Review" className="w-32 h-24 object-cover rounded-2xl border-2 border-dark shadow-sm flex-shrink-0" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dark border-dashed rounded-[40px] p-12 text-center group cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setIsFormOpen(true)}>
          <div className="w-20 h-20 bg-neutral-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-10 h-10 text-dark/20" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Faça a primeira avaliação!</h3>
          <p className="text-dark/50 font-medium max-w-sm mx-auto">Você é dono deste carro ou já dirigiu muito? Compartilhe sua experiência real com a comunidade.</p>
        </div>
      )}

      {/* Modal de Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-md animate-in fade-in" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl border-4 border-dark overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-dark p-8 flex items-center justify-between text-white">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Sua Opinião Vale Muito</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Rating */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-dark/40 mb-4">Nota Geral</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button 
                      type="button"
                      key={s} 
                      onClick={() => setNewReview(prev => ({ ...prev, rating: s }))}
                      className="transition-transform active:scale-95"
                    >
                      <Star className={`w-10 h-10 ${s <= newReview.rating ? 'fill-dark text-dark' : 'text-dark/10'}`} strokeWidth={1} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-dark/40 mb-4">Seu Nome</label>
                  <input 
                    type="text" 
                    value={newReview.userName}
                    onChange={e => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Ex: João Silva"
                    className="w-full h-14 bg-neutral-100 rounded-2xl px-6 font-bold outline-none border-2 border-transparent focus:border-dark transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-dark/40 mb-4">Link da Foto (URL)</label>
                  <div className="relative">
                     <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark/30" />
                     <input 
                       type="text" 
                       value={newReview.photos}
                       onChange={e => setNewReview(prev => ({ ...prev, photos: e.target.value }))}
                       placeholder="https://..."
                       className="w-full h-14 bg-neutral-100 rounded-2xl pl-12 pr-6 font-bold outline-none border-2 border-transparent focus:border-dark transition-all"
                     />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-dark/40 mb-4">Experiência Geral</label>
                <textarea 
                  value={newReview.comment}
                  onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Conte-nos como é dirigir esse carro no dia a dia..."
                  rows={4}
                  className="w-full bg-neutral-100 rounded-3xl p-6 font-bold outline-none border-2 border-transparent focus:border-dark transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-[#00D632]">O que você amou?</label>
                    <button type="button" onClick={() => addField('pros')} className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200"><Plus className="w-4 h-4 text-dark" /></button>
                  </div>
                  <div className="space-y-3">
                    {newReview.pros.map((p, i) => (
                      <input 
                        key={i}
                        type="text"
                        value={p}
                        onChange={e => updateField('pros', i, e.target.value)}
                        placeholder="Ex: Baixo consumo"
                        className="w-full h-12 bg-neutral-50 rounded-xl px-4 font-bold outline-none border border-dark/5 focus:border-[#00D632] transition-all"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.15em] text-dark/50">O que te incomodou?</label>
                    <button type="button" onClick={() => addField('cons')} className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200"><Plus className="w-4 h-4 text-dark" /></button>
                  </div>
                  <div className="space-y-3">
                    {newReview.cons.map((c, i) => (
                      <input 
                        key={i}
                        type="text"
                        value={c}
                        onChange={e => updateField('cons', i, e.target.value)}
                        placeholder="Ex: Porta-luvas pequeno"
                        className="w-full h-12 bg-neutral-50 rounded-xl px-4 font-bold outline-none border border-dark/5 focus:border-dark/30 transition-all"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-6 bg-dark text-white rounded-full font-black uppercase tracking-[0.3em] shadow-[8px_8px_0_#94E2CD] hover:translate-x-1 hover:-translate-y-1 transition-all active:translate-y-0 active:translate-x-0 active:shadow-none"
              >
                Publicar Avaliação
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
