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
  },
  {
    title: 'FIPE no fluxo',
    text: 'Compare seu preço com a referência FIPE antes de publicar o carro.',
    icon: LineChart,
  },
  {
    title: 'Contato protegido',
    text: 'Negociação por chat interno, sem expor telefone ou e-mail publicamente.',
    icon: MessageCircle,
  },
]

export default function AnunciarCarroPage() {
  return (
    <main className="fingen-shell">
      {/* Hero */}
      <section className="fingen-dark-hero text-center">
        <div className="fingen-shell-content relative z-1">
          <nav className="fingen-breadcrumb justify-center text-white/50" aria-label="Breadcrumb">
            <Link href="/" className="text-white/50">Home</Link>
            <span aria-hidden="true" className="text-white/30">/</span>
            <span aria-current="page" className="text-white">Anunciar carro</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(212,245,118,0.12)] border border-[rgba(212,245,118,0.2)] rounded-full text-xs font-semibold text-[var(--color-accent)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            100% grátis para anunciar
          </div>

          <h1 className="text-balance">
            Anuncie seu carro com visual de marketplace premium
          </h1>

          <p className="max-w-lg mx-auto text-white/70">
            Publique seu veículo em poucos minutos com fotos, FIPE, dados estruturados e negociação segura pela Carbi.
          </p>

          <div className="flex justify-center gap-3 mt-7 flex-wrap">
            <Link href="/anunciar-carro/fluxo" className="btn btn-primary">
              Começar anúncio grátis <ArrowRight size={16} />
            </Link>
            <Link href="/carros-a-venda" className="btn border border-white/20 text-white hover:bg-white/10">
              Ver marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Fluxo simples</div>
              <h2 className="fingen-section-title">Do veículo publicado sem atrito</h2>
            </div>
            <Link href="/anunciar-carro/fluxo" className="fingen-section-link">
              Anunciar grátis <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={step} className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
                <div className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Recursos</div>
              <h2 className="fingen-section-title">A mesma identidade visual em todo o fluxo</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Link href="/anunciar-carro/fluxo" key={card.title} className="bg-white border border-[var(--color-border)] rounded-2xl p-7 flex flex-col gap-5 no-underline hover:border-[var(--color-border-strong)] transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-text-primary)]">
                    <Icon size={28} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{card.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{card.text}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="bg-[var(--color-bg-inverse)] rounded-3xl p-10 grid md:grid-cols-2 gap-10">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Segurança</div>
              <h2 className="text-3xl font-bold text-[var(--color-accent)] leading-tight mb-3">
                Seu contato direto não fica exposto
              </h2>
              <p className="text-[15px] text-white/70 leading-relaxed mb-6">
                O comprador inicia conversa pelo chat interno. A experiência mantém a negociação organizada e protege dados sensíveis.
              </p>
              <Link href="/anunciar-carro/fluxo" className="btn btn-primary">
                Publicar anúncio grátis <ArrowRight size={16} />
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-5 bg-white/[0.06] border border-white/[0.08] rounded-2xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <ShieldCheck size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-[15px] font-semibold text-white">Chat interno</h3>
                </div>
                <p className="text-[13px] text-white/60 leading-relaxed">Sem telefone público. Sem e-mail público. Conversa vinculada ao anúncio.</p>
              </div>
              <div className="p-5 bg-white/[0.06] border border-white/[0.08] rounded-2xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <BadgeCheck size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-[15px] font-semibold text-white">Permissões reais</h3>
                </div>
                <p className="text-[13px] text-white/60 leading-relaxed">Acesso controlado para anunciante e interessado autenticados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
