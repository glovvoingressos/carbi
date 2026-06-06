'use client'

import { useState } from 'react'
import { FAQSchema } from '@/components/seo/JSONLD'

const faqs = [
  { q: 'O que é o Carbi?', a: 'O Carbi é uma plataforma premium de marketplace automotivo no Brasil. Você compara valor de mercado com FIPE, dados técnicos e encontra anúncios reais para comprar ou vender seu seminovo com mais confiança e menos esforço.' },
  { q: 'Os valores FIPE são atualizados automaticamente?', a: 'Sim. A plataforma consulta referência mensal oficial por API e atualiza o valor conforme marca, modelo, ano e versão selecionados, garantindo precisão total nos dados.' },
  { q: 'Qual o melhor carro para aplicativo em 2026?', a: 'Para 2026, modelos como o BYD Dolphin Mini e o Renault Kwid E-Tech lideram pela economia. Em combustão, Fiat Mobi e Chevrolet Onix continuam sendo campeões de custo-benefício.' },
  { q: 'Posso anunciar de graça para sempre?', a: 'O fluxo principal permite anunciar grátis com fotos, dados e comparativo FIPE. Recursos adicionais podem ser organizados em planos futuros conforme necessidade do produto.' },
  { q: 'Vale a pena comprar carro elétrico para trabalhar?', a: 'Se você roda mais de 100km por dia, sim. O custo por km de um elétrico tende a ser menor que o de um carro a combustão, dependendo da tarifa e rotina de recarga.' },
  { q: 'Como funciona o chat com compradores?', a: 'O chat interno conecta vendedor e comprador diretamente na plataforma, sem expor números de telefone. Todo o histórico fica salvo e acessível pelo painel do usuário.' },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="ref-sec-faq">
      <FAQSchema items={faqs} />
      <div className="ref-container">
        <h2>Perguntas? Respondidas.</h2>
        <div className="ref-faq-list">
          {faqs.map((faq, index) => {
            const open = openIndex === index
            return (
              <div key={faq.q} className={`ref-faq-item ${open ? 'open' : ''}`}>
                <button className="ref-faq-q" onClick={() => setOpenIndex(open ? -1 : index)}>
                  <h4>{faq.q}</h4>
                  <span className="ref-faq-icon">+</span>
                </button>
                <div className="ref-faq-ans">{faq.a}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
