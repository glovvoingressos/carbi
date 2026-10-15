'use client'

import { useState } from 'react'

const faqs = [
  { q: 'O que é o Carbi?', a: 'O Carbi é uma plataforma premium de marketplace automotivo no Brasil. Você compara valor de mercado com FIPE, dados técnicos e encontra anúncios reais para comprar ou vender seu seminovo com mais confiança e menos esforço.' },
  { q: 'Os valores FIPE estão disponíveis para todos os veículos?', a: 'A plataforma consulta a referência FIPE quando consegue confirmar a combinação de marca, modelo, ano e versão. Se não houver correspondência confiável, o valor não é exibido.' },
  { q: 'Quantos anúncios posso manter?', a: 'A conta pode manter até 5 anúncios ativos. Cada anúncio aceita até 10 fotos.' },
  { q: 'Como escolher um carro para aplicativo?', a: 'Compare consumo, custo de manutenção, seguro, disponibilidade de peças e regras da plataforma em que você pretende trabalhar. O resultado depende da cidade, da rotina e do modelo.' },
  { q: 'Preciso criar uma conta para anunciar?', a: 'Você pode preencher os dados do veículo e adicionar fotos sem entrar na conta. Pediremos que você entre ou crie uma conta somente antes da publicação, para manter o anúncio vinculado ao vendedor.' },
  { q: 'Vale a pena comprar carro elétrico para trabalhar?', a: 'Se você roda mais de 100km por dia, sim. O custo por km de um elétrico tende a ser menor que o de um carro a combustão, dependendo da tarifa e rotina de recarga.' },
  { q: 'Como funciona o chat com compradores?', a: 'O chat interno conecta vendedor e comprador diretamente na plataforma, sem expor números de telefone. Todo o histórico fica salvo e acessível pelo painel do usuário.' },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="ref-sec-faq">
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
