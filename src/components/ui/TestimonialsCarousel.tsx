'use client'

import { useEffect, useRef } from 'react'
import { Star } from 'lucide-react'

const testimonials = [
  {
    text: 'Comprei meu HB20 2023 12% abaixo da FIPE. O vendedor era de BH e o chat interno facilitou muito a negociação.',
    author: 'Marcos S.',
    city: 'Belo Horizonte',
    stars: 5,
  },
  {
    text: 'Anunciei meu Onix 0km e vendi em 3 dias. O tráfego grátis no Google fez aparecer pra gente que não fazia ideia.',
    author: 'Ana Clara R.',
    city: 'Contagem',
    stars: 5,
  },
  {
    text: 'Tava em dúvida entre um Corolla e um Sentra. A comparação com a FIPE me mostrou que o Sentra tava mais em conta. Fechei no mesmo dia.',
    author: 'Pedro H.',
    city: 'Uberlândia',
    stars: 5,
  },
  {
    text: 'Vendi meu Creta 2022 por R$ 10k acima do que um me ofereceu. A plataforma trouxe compradores de verdade.',
    author: 'Luciana M.',
    city: 'São Paulo',
    stars: 4,
  },
  {
    text: 'Primeira vez que comprei carro online. O histórico do veículo me deu a confiança que faltava. Tudo certo, sem surpresa.',
    author: 'Rafael O.',
    city: 'Campinas',
    stars: 5,
  },
  {
    text: 'Coloquei meu Tracker pra venda e em 1 semana tinha 3 interessados. O chat interno é muito prático, não precisei dar meu WhatsApp.',
    author: 'Fernanda L.',
    city: 'Rio de Janeiro',
    stars: 5,
  },
  {
    text: 'Comparava carros toda semana e sempre desconfiava dos preços. Aqui vi o valor real pela FIPE e comprei meu T-Cross 8% abaixo do mercado.',
    author: 'Thiago B.',
    city: 'Curitiba',
    stars: 5,
  },
  {
    text: 'Anunciei meu Onix Plus e o tráfego gratuito me trouxe 500 visualizações em 2 dias. Vendi rápido e sem comissão.',
    author: 'Camila D.',
    city: 'Goiânia',
    stars: 5,
  },
]

export default function TestimonialsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    let index = 0
    let paused = false

    const scroll = () => {
      if (paused || !el) return
      const card = el.querySelector('.fingen-testimonial-card') as HTMLElement
      if (!card) return

      const cardWidth = card.offsetWidth + 16 // gap
      const maxScroll = el.scrollWidth - el.clientWidth

      index++
      if (el.scrollLeft >= maxScroll - 10) {
        index = 0
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: index * cardWidth, behavior: 'smooth' })
      }
    }

    const interval = setInterval(scroll, 3000)

    const onEnter = () => { paused = true }
    const onLeave = () => { paused = false }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('touchstart', onEnter, { passive: true })
    el.addEventListener('touchend', onLeave)

    return () => {
      clearInterval(interval)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('touchstart', onEnter)
      el.removeEventListener('touchend', onLeave)
    }
  }, [])

  return (
    <div className="fingen-testimonials-track" ref={trackRef}>
      {testimonials.map((t, i) => (
        <div key={i} className="fingen-testimonial-card">
          <div className="fingen-testimonial-stars">
            {[...Array(t.stars)].map((_, j) => (
              <Star key={j} size={14} fill="currentColor" />
            ))}
          </div>
          <p>&ldquo;{t.text}&rdquo;</p>
          <div className="fingen-testimonial-author">
            <strong>{t.author}</strong>
            <span>{t.city}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
