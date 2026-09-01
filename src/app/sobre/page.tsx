import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, MessageCircle, BarChart3, Heart, ArrowRight, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre o Carbi | Carbi',
  description: 'O Carbi é um marketplace automotivo brasileiro feito para vender e comprar carros com dados reais, comparação FIPE e chat interno.',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'Sobre o Carbi',
    description: 'Marketplace automotivo brasileiro com FIPE verificada, chat interno e anúncios grátis.',
    url: '/sobre',
    type: 'website',
  },
}

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Negociação segura',
    desc: 'Chat interno, perfis verificados e histórico do veículo para você decidir sem medo.',
  },
  {
    icon: BarChart3,
    title: 'FIPE em todo lugar',
    desc: 'Compare o preço pedido com a tabela FIPE e veja se a oferta está acima, abaixo ou na média.',
  },
  {
    icon: MessageCircle,
    title: 'Sem intermediários',
    desc: 'Conversa direta entre comprador e vendedor. Sem markup, sem ligação, sem espera.',
  },
  {
    icon: Heart,
    title: 'Grátis para começar',
    desc: 'Anunciar é gratuito. Planos Pro existem só para quem quer mais destaque e selo de verificado.',
  },
] as const

const NUMBERS = [
  { value: '100%', label: 'Grátis para anunciar' },
  { value: '24/7', label: 'Anúncios no ar' },
  { value: 'FIPE', label: 'Integrada em todo anúncio' },
  { value: '0', label: 'Taxa sobre a venda' },
] as const

export default function SobrePage() {
  return (
    <main className="cb-page">
      <section className="cb-section-pad">
        <div className="cb-wrap">
          <p className="cb-eyebrow">Sobre o Carbi</p>
          <h1 style={{ maxWidth: '20ch' }}>
            Um marketplace de carros feito pra quem <u>decide</u>, não pra quem sofre.
          </h1>
          <p className="cb-lead" style={{ maxWidth: '60ch' }}>
            O Carbi nasceu para tirar a dor de comprar e vender carro no Brasil.
            Sem ligação chata, sem leads repetidos, sem anúncio invisível.
            Dados reais, FIPE verificada e conversa direta.
          </p>

          <div className="cb-stats-row">
            {NUMBERS.map((n) => (
              <div key={n.label} className="cb-stat-block">
                <strong>{n.value}</strong>
                <span>{n.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cb-section-pad cb-section-alt">
        <div className="cb-wrap">
          <div className="cb-head">
            <div>
              <p className="cb-eyebrow">O que a gente acredita</p>
              <h2 style={{ maxWidth: '24ch' }}>Quatro princípios que guiam tudo</h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--cb-ink-soft)' }}>
              Decisões boas precisam de informação boa. Por isso construímos um produto
              com dados abertos, sem letras miúdas e sem truques.
            </p>
          </div>

          <div className="cb-pillars-grid">
            {PILLARS.map((p) => {
              const Icon = p.icon
              return (
                <article key={p.title} className="cb-pillar-card">
                  <div className="cb-pillar-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="cb-section-pad">
        <div className="cb-wrap">
          <div className="cb-about-story">
            <div>
              <p className="cb-eyebrow">Nossa história</p>
              <h2 style={{ maxWidth: '20ch' }}>Começou de um problema simples</h2>
            </div>
            <div className="cb-about-story-body">
              <p>
                Vender carro no Brasil ainda é uma experiência confusa: anúncios
                duplicados, leads de olheiros, valores sem referência, e o medo
                constante de cair em golpe.
              </p>
              <p>
                O Carbi foi criado por pessoas que passaram por isso. A plataforma
                centraliza o que importa — FIPE, histórico, conversa e verdade sobre
                o estado do veículo — para comprador e vendedor fecharem negócio
                com a mesma confiança.
              </p>
              <ul className="cb-about-checklist">
                <li><Check size={16} /> Anúncio grátis e ilimitado</li>
                <li><Check size={16} /> Comparação FIPE em todo anúncio</li>
                <li><Check size={16} /> Chat interno com moderação</li>
                <li><Check size={16} /> Perfis verificados para vendedores</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cb-section-pad">
        <div className="cb-wrap">
          <div className="cb-cta-block">
            <div>
              <p className="cb-eyebrow">Pronto pra começar?</p>
              <h2 style={{ maxWidth: '20ch' }}>Anuncie grátis ou encontre seu próximo carro</h2>
              <p style={{ maxWidth: '48ch' }}>
                Sem custo pra começar, sem assinatura, sem pegadinha. Você coloca
                o carro no ar em poucos minutos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/anunciar-carro" className="cb-btn cb-btn-lime cb-btn-arrow">
                Anunciar grátis <ArrowRight size={18} />
              </Link>
              <Link href="/carros-a-venda" className="cb-btn cb-btn-ghost">
                Ver estoque
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}