import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { heroFont } from '@/components/home/home-font'
import PlateBannerLookup from '@/components/marketplace/PlateBannerLookup'
import './announcement-landing.css'

const benefits = [
  {
    title: 'Grátis',
    description: 'para anunciar seu carro',
  },
  {
    title: 'Até 10 fotos',
    description: 'para mostrar os detalhes',
  },
  {
    title: 'Você revisa',
    description: 'antes de enviar',
  },
]

const steps = [
  {
    number: '01',
    title: 'Comece pela placa',
    description: 'Consulte os dados disponíveis do veículo para iniciar seu anúncio.',
  },
  {
    number: '02',
    title: 'Conte os detalhes',
    description: 'Complete as informações do carro, adicione fotos e informe como falar com você.',
  },
  {
    number: '03',
    title: 'Revise e envie',
    description: 'Confira o anúncio com calma antes de enviar para publicação.',
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
    <div className={`announce-page ${heroFont.variable}`}>
      <div className="announce-page__frame">
        <section className="announce-hero" aria-labelledby="announce-title">
          <div className="announce-hero__image" aria-hidden="true">
            <Image
              src="/assets/cars/anunciar-carro-hero-user-provided.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 760px) 100vw, 96vw"
            />
          </div>

          <div className="announce-hero__copy">
            <h1 id="announce-title">Seu carro, pronto para chegar a novas mãos.</h1>
            <p>Comece pela placa, complete os detalhes e revise tudo antes de publicar.</p>
            <Link className="announce-hero__link" href="#plate-premium-input">
              Começar anúncio <ArrowDown aria-hidden="true" size={18} />
            </Link>
          </div>

          <div className="announce-hero__lookup" id="consulta">
            <PlateBannerLookup variant="landing" />
          </div>
        </section>

        <section className="announce-benefits" aria-label="Benefícios para anunciar">
          {benefits.map(({ title, description }, index) => (
            <article className={`announce-benefit announce-benefit--${index + 1}`} key={title}>
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="announce-process" id="etapas" aria-labelledby="announce-process-title">
          <div className="announce-section-heading">
            <h2 id="announce-process-title">O caminho para anunciar.</h2>
            <p>Você acompanha cada etapa e confere as informações antes de publicar.</p>
          </div>

          <ol className="announce-process__grid">
            {steps.map(({ number, title, description }) => (
              <li className="announce-process-card" key={number}>
                <span className="announce-process-card__number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="announce-faq" aria-labelledby="announce-faq-title">
          <div className="announce-faq__intro">
            <h2 id="announce-faq-title">Dúvidas frequentes.</h2>
          </div>
          <div className="announce-faq__list">
            {questions.map((item) => (
              <details className="announce-faq__item" key={item.question}>
                <summary>{item.question}<span aria-hidden="true" /></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="announce-endcap" aria-labelledby="announce-endcap-title">
          <div>
            <h2 id="announce-endcap-title">Vamos nessa?</h2>
            <p>Pesquise a placa e prepare seu anúncio no seu ritmo.</p>
          </div>
          <Link href="#plate-premium-input" className="announce-endcap__button">
            Consultar placa <ArrowRight aria-hidden="true" size={19} />
          </Link>
        </section>
      </div>
    </div>
  )
}
