'use client'

import { useState } from 'react'
import { ArrowDown } from 'lucide-react'

const faqs = [
  { q: "O Que é o Carbi?", a: "Somos a ferramenta definitiva para você comparar carros, ler avaliações reais e encontrar o preço exato da tabela FIPE antes de comprar." },
  { q: "A Tabela FIPE é atualizada automaticamente?", a: "Sim! Puxamos os dados em tempo real da API oficial para garantir o melhor preço para você." },
  { q: "Posso comparar modelos elétricos e a combustão?", a: "Com certeza, nossa plataforma tem os cálculos exatos para avaliar custo de energia versus combustível fóssil." },
  { q: "Não encontrei o que procurava? Cheque os Rankings.", a: "Temos uma página inteira dedicada a listar os melhores carros por categoria." }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="w-full bg-white py-24 md:py-32">
      <div className="container" style={{ maxWidth: 900 }}>
        <h2 className="text-center text-5xl md:text-6xl font-black text-dark mb-12 tracking-tighter">
          Perguntas Frequentes
        </h2>
        
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            // The last item has a green color in Cash App reference
            const isLast = i === faqs.length - 1
            const baseBg = isLast ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bento-red)]'
            
            return (
              <div key={i} className="flex flex-col">
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className={`w-full flex items-center justify-between px-8 py-5 md:py-6 rounded-full text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${baseBg} shadow-sm border border-dark`}
                >
                  <span className="text-dark font-black text-lg md:text-xl tracking-widest uppercase">{faq.q}</span>
                  <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ArrowDown className="w-8 h-8 md:w-10 md:h-10 text-dark stroke-[3px]" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-8 py-6 text-dark font-medium text-lg leading-relaxed animate-in slide-in-from-top-4 fade-in duration-300">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
