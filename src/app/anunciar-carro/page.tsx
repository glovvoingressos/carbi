import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Camera, LineChart, MessageCircle, ShieldCheck } from 'lucide-react'
import { SEO_DATA } from '@/data/seo-content'

const data = SEO_DATA.anunciar

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  keywords: ['anunciar carro grátis', 'anunciar carro', 'vender carro', 'seminovos à venda', 'carros usados'],
  alternates: {
    canonical: '/anunciar-carro',
  },
  openGraph: {
    title: data.title,
    description: data.description,
    type: 'website',
    url: '/anunciar-carro',
  },
  twitter: {
    card: 'summary_large_image',
    title: data.title,
    description: data.description,
  },
}

const steps = [
  'Marca, modelo e versão',
  'Preço com referência FIPE',
  'Fotos em formato premium',
  'Chat interno seguro',
]

const cards = [
  {
    title: 'Anúncio guiado',
    text: 'Campos organizados em etapas curtas, sem formulário pesado e com validação clara.',
    icon: Camera,
    className: 'ref-card-lavender',
  },
  {
    title: 'FIPE no fluxo',
    text: 'Compare seu preço com a referência FIPE antes de publicar o carro.',
    icon: LineChart,
    className: 'ref-card-lime',
  },
  {
    title: 'Contato protegido',
    text: 'Negociação por chat interno, sem expor telefone ou e-mail publicamente.',
    icon: MessageCircle,
    className: 'ref-card-iris',
  },
]

export default function AnunciarCarroPage() {
  return (
    <main className="ref-sell-page">
      <section className="ref-sell-hero">
        <div className="ref-sell-hero-bg">gratis</div>
        <div className="ref-sell-hero-inner">
          <div className="ref-sell-hero-copy">
            <span className="ref-hero-badge"><span className="ref-dot" /> 100% grátis para anunciar</span>
            <h1>Anuncie seu carro com visual de marketplace premium.</h1>
            <p>
              Publique seu veículo em poucos minutos com fotos, FIPE, dados estruturados e negociação segura pela Carbi.
            </p>
            <div className="ref-hero-ctas">
              <Link href="/anunciar-carro/fluxo" className="ref-btn ref-btn-chartreuse ref-btn-wide">
                Começar anúncio grátis <ArrowRight size={18} />
              </Link>
              <Link href="/carros-a-venda" className="ref-btn ref-btn-ghost ref-btn-wide">
                Ver marketplace
              </Link>
            </div>
          </div>

          <div className="ref-sell-preview-card" aria-label="Prévia do fluxo de anúncio">
            <div className="ref-sell-preview-top">
              <span>CARBI STUDIO</span>
              <strong>Publicação</strong>
            </div>
            <div className="ref-sell-preview-photo">
              <Camera size={48} />
            </div>
            <div className="ref-sell-preview-lines">
              <span />
              <span />
              <span />
            </div>
            <div className="ref-sell-preview-price">
              <small>FIPE encontrada</small>
              <strong>R$ 136.575</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ref-sec-price-bands ref-sell-steps-section">
        <div className="ref-container">
          <div className="ref-price-bands-header">
            <div>
              <span className="ref-sec-label">Fluxo simples</span>
              <h2>Do veículo publicado sem atrito.</h2>
            </div>
            <Link href="/anunciar-carro/fluxo" className="ref-btn ref-btn-forest">
              Anunciar grátis <ArrowRight size={16} />
            </Link>
          </div>
          <div className="ref-sell-steps-grid">
            {steps.map((step, index) => (
              <div className="ref-sell-step-card" key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ref-sec-marble ref-pad">
        <div className="ref-container">
          <div className="ref-trusted-heading">
            <span className="ref-sec-label">Design da home</span>
            <h2>A mesma identidade visual em todo o fluxo.</h2>
          </div>
          <div className="ref-cards-grid">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Link href="/anunciar-carro/fluxo" className={`ref-card-block ${card.className}`} key={card.title}>
                  <div className="ref-card-img-area"><Icon size={62} strokeWidth={1.6} /></div>
                  <div>
                    <h3>{card.title}</h3>
                    <p className="ref-sell-card-copy">{card.text}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="ref-sec-hydrangea ref-pad">
        <div className="ref-container ref-flex-h">
          <div className="ref-content-half">
            <span className="ref-sec-label">Segurança</span>
            <h2 className="ref-section-h2">Seu contato direto não fica exposto.</h2>
            <p className="ref-section-p">
              O comprador inicia conversa pelo chat interno. A experiência mantém a negociação organizada e protege dados sensíveis.
            </p>
            <Link href="/anunciar-carro/fluxo" className="ref-btn ref-btn-chartreuse ref-btn-wide">
              Publicar anúncio grátis <ArrowRight size={18} />
            </Link>
          </div>
          <div className="ref-img-half">
            <div className="ref-dashboard-mock ref-sell-security-mock">
              <ShieldCheck size={42} />
              <h3>Chat interno</h3>
              <p>Sem telefone público. Sem e-mail público. Conversa vinculada ao anúncio.</p>
              <div className="ref-feature-item">
                <h3><BadgeCheck size={16} /> Permissões reais</h3>
                <p>Acesso controlado para anunciante e interessado autenticados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
