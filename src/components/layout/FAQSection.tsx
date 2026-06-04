'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

const faqs = [
  { q: "O que é o carbi?", a: "O carbi é uma plataforma premium de inteligência automotiva. Você compara valor de mercado, dados técnicos e avaliações para tomar decisões mais seguras na compra e venda." },
  { q: "Qual o melhor carro para Uber/Aplicativo em 2026?", a: "Para 2026, modelos como o BYD Dolphin Mini e o Renault Kwid E-Tech lideram o ranking de aplicativos pela economia de energia. Se busca combustão, o Fiat Mobi e o Chevrolet Onix continuam sendo os reis do custo-benefício e manutenção barata." },
  { q: "Vale a pena comprar carro elétrico para trabalhar?", a: "Sim, se você roda mais de 100km por dia. Em 2026, o custo por km rodado de um elétrico é cerca de 1/4 do valor de um carro a gasolina, o que gera uma economia de até R$ 2.000 mensais para motoristas de aplicativo." },
  { q: "Os valores são atualizados automaticamente?", a: "Sim. A plataforma consulta referência mensal oficial por API e atualiza o valor conforme marca, modelo, ano e versão selecionados, garantindo precisão nos dados." },
  { q: "Qual o SUV mais econômico de 2026?", a: "O Toyota Corolla Cross Hybrid e o GWM Haval H6 lideram nossa lista de SUVs com melhor eficiência energética, equilibrando luxo com um consumo urbano impressionante." },
  { q: "Como funciona o 'Ranking carbi'?", a: "Nosso algoritmo pondera 12 critérios: da desvalorização média anual à nota de segurança do Latin NCAP. Só os carros que realmente entregam o que prometem chegam ao topo da lista." }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">Suporte</p>
          <h2 className="text-balance">Perguntas frequentes</h2>
        </div>

        <div className="bg-white border border-[#EAEAE8] rounded-2xl overflow-hidden divide-y divide-[#EAEAE8]">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i

            return (
              <div key={i}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4 hover:bg-[#FAFAF9] transition-colors"
                >
                  <span className="text-[15px] font-medium text-[#0A0A0A] tracking-tight">
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isOpen ? 'bg-[#0A0A0A] text-white rotate-45' : 'bg-[#FAFAF9] text-[#0A0A0A]'
                  }`}>
                    <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                      <p className="text-[14px] leading-relaxed text-[#525252]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
