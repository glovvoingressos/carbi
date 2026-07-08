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
      <section className="fingen-dark-hero" style={{ textAlign: 'center' }}>
        <div className="fingen-shell-content" style={{ position: 'relative', zIndex: 1 }}>
          <div className="fingen-breadcrumb" style={{ justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#fff' }}>Anunciar carro</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(212,245,118,0.12)', border: '1px solid rgba(212,245,118,0.2)', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '20px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} />
            100% grátis para anunciar
          </div>
          <h1 className="text-balance">
            Anuncie seu carro com visual de marketplace premium
          </h1>
          <p style={{ maxWidth: '520px', margin: '0 auto' }}>
            Publique seu veículo em poucos minutos com fotos, FIPE, dados estruturados e negociação segura pela Carbi.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
            <Link href="/anunciar-carro/fluxo" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s ease' }}>
              Começar anúncio grátis <ArrowRight size={16} />
            </Link>
            <Link href="/carros-a-venda" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.2)', transition: 'all 0.2s ease' }}>
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
          <div className="fingen-grid-4">
            {steps.map((step, index) => (
              <div key={step} className="fingen-card-white" style={{ padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{step}</h3>
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
          <div className="fingen-grid-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Link href="/anunciar-carro/fluxo" key={card.title} className="fingen-card-white" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px', textDecoration: 'none', transition: 'all 0.25s ease' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>
                    <Icon size={28} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>{card.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{card.text}</p>
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
          <div className="fingen-card-dark" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', padding: '40px' }}>
            <div>
              <div className="fingen-section-label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Segurança</div>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '12px' }}>
                Seu contato direto não fica exposto
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '24px' }}>
                O comprador inicia conversa pelo chat interno. A experiência mantém a negociação organizada e protege dados sensíveis.
              </p>
              <Link href="/anunciar-carro/fluxo" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s ease' }}>
                Publicar anúncio grátis <ArrowRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-accent)' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Chat interno</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Sem telefone público. Sem e-mail público. Conversa vinculada ao anúncio.</p>
              </div>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <BadgeCheck size={20} style={{ color: 'var(--color-accent)' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Permissões reais</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Acesso controlado para anunciante e interessado autenticados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
