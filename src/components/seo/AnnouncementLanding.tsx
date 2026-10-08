import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import './announcement-landing.css'

const steps = [
  {
    number: '01',
    title: 'Pesquise pela placa',
    description: 'Confira os dados disponíveis do veículo antes de começar o anúncio.',
  },
  {
    number: '02',
    title: 'Complete as informações',
    description: 'Conte os detalhes do carro, adicione fotos e informe como falar com você.',
  },
  {
    number: '03',
    title: 'Revise e envie',
    description: 'Confira tudo com calma antes de enviar seu anúncio para publicação.',
  },
]

const questions = [
  {
    question: 'Anunciar meu carro tem algum custo?',
    answer: 'Não. Criar e enviar seu anúncio na Carbi é grátis.',
  },
  {
    question: 'Quantas fotos posso adicionar?',
    answer: 'Você pode adicionar até 10 imagens. É necessário incluir ao menos uma foto para publicar.',
  },
  {
    question: 'Preciso entrar na minha conta antes de pesquisar a placa?',
    answer: 'Não. Você pode pesquisar a placa e preencher o anúncio sem entrar. Só pedimos sua conta na última etapa, antes de publicar.',
  },
]

export default function AnnouncementLanding() {
  return (
    <div className="seller-landing">
      <div className="seller-landing__frame">
        <section className="seller-hero" aria-labelledby="seller-title">
          <div className="seller-hero__copy">
            <h1 id="seller-title">Seu carro, pronto para anunciar.</h1>
            <p>
              Pesquise pela placa, complete as informações e revise seu anúncio antes de enviar.
            </p>
            <div className="seller-hero__actions">
              <Link className="seller-button" href="/anunciar-carro/fluxo">
                <span>Começar anúncio</span>
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
              <span className="seller-hero__note">Grátis para anunciar · Até 10 fotos</span>
            </div>
            <a className="seller-secondary-link" href="#etapas">
              Conheça as etapas <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>
          <figure className="seller-hero__photo">
            <Image
              src="/hero-car.png"
              alt="Audi escuro visto de frente em uma área aberta sob céu nublado, imagem ilustrativa"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 56vw"
            />
          </figure>
        </section>

        <section className="seller-facts" aria-label="Informações do anúncio">
          <p><strong>Grátis</strong><span>para anunciar</span></p>
          <p><strong>Até 10</strong><span>fotos do seu carro</span></p>
          <p><strong>Você revisa</strong><span>antes de enviar</span></p>
        </section>

        <section className="seller-steps" id="etapas" aria-labelledby="seller-steps-title">
          <div className="seller-section-heading">
            <h2 id="seller-steps-title">Três passos, sem complicação.</h2>
            <p>Você acompanha o cadastro e confere as informações antes de publicar.</p>
          </div>
          <ol className="seller-steps__list">
            {steps.map((step) => (
              <li className="seller-step" key={step.number}>
                <span className="seller-step__number" aria-hidden="true">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="seller-faq" aria-labelledby="seller-faq-title">
          <div className="seller-section-heading">
            <h2 id="seller-faq-title">Dúvidas frequentes</h2>
          </div>
          <div className="seller-faq__list">
            {questions.map((item) => (
              <details className="seller-faq__item" key={item.question}>
                <summary>{item.question}<span aria-hidden="true" /></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="seller-last-call" aria-labelledby="seller-last-call-title">
          <div>
            <h2 id="seller-last-call-title">Vamos começar?</h2>
            <p>Pesquise a placa e prepare seu anúncio no seu ritmo.</p>
          </div>
          <Link className="seller-button seller-button--dark" href="/anunciar-carro/fluxo">
            <span>Anunciar meu carro</span>
            <ArrowRight aria-hidden="true" size={19} />
          </Link>
        </section>
      </div>
    </div>
  )
}
