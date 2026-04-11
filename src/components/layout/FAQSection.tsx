'use client'

import { useState } from 'react'
import { ArrowDown } from 'lucide-react'

const faqs = [
  { q: "O que é o carbi?", a: "O carbi é uma plataforma de inteligência automotiva. Você compara valor de mercado, dados técnicos e avaliações para tomar decisões mais seguras na compra e venda." },
  { q: "Qual o melhor carro para Uber/Aplicativo em 2026?", a: "Para 2026, modelos como o BYD Dolphin Mini e o Renault Kwid E-Tech lideram o ranking de aplicativos pela economia de energia. Se busca combustão, o Fiat Mobi e o Chevrolet Onix continuam sendo os reis do custo-benefício e manutenção barata." },
  { q: "Vale a pena comprar carro elétrico para trabalhar?", a: "Sim, se você roda mais de 100km por dia. Em 2026, o custo por km rodado de um elétrico é cerca de 1/4 do valor de um carro a gasolina, o que gera uma economia de até R$ 2.000 mensais para motoristas de aplicativo." },
  { q: "Os valores são atualizados automaticamente?", a: "Sim. A plataforma consulta referência mensal oficial por API e atualiza o valor conforme marca, modelo, ano e versão selecionados." },
  { q: "Qual o SUV mais econômico de 2026?", a: "O Toyota Corolla Cross Hybrid e o GWM Haval H6 lideram nossa lista de SUVs com melhor eficiência energética, equilibrando luxo com um consumo urbano impressionante." },
  { q: "Como funciona o 'Ranking carbi'?", a: "Nosso algoritmo pondera 12 critérios: da desvalorização média anual à nota de segurança do Latin NCAP. Só os carros que realmente entregam o que prometem chegam ao topo da lista." }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="w-full bg-[#fff8f1] py-16 md:py-20">
      <div className="container" style={{ maxWidth: 900 }}>
        <h2 className="text-center text-4xl md:text-5xl font-black text-dark mb-8 md:mb-10 tracking-tighter">
          Perguntas Frequentes
        </h2>
        
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            const baseBg = i % 2 === 0 ? '#fff0e2' : '#ffe8d5'
            const answerBg = i % 2 === 0 ? '#fff6ee' : '#fff1e5'
            
            return (
              <div key={i} className="flex flex-col">
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 md:px-7 py-4 md:py-[18px] rounded-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: baseBg }}
                >
                  <span className="text-dark font-black text-base md:text-lg tracking-wide uppercase">{faq.q}</span>
                  <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ArrowDown className="w-7 h-7 md:w-8 md:h-8 text-dark stroke-[2.75px]" />
                  </div>
                </button>
                {isOpen && (
                  <div
                    className="mt-2 rounded-[22px] px-6 md:px-7 py-4 md:py-5 text-dark font-medium text-base md:text-lg leading-relaxed animate-in slide-in-from-top-4 fade-in duration-300"
                    style={{ backgroundColor: answerBg }}
                  >
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
