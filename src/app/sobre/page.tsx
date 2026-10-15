import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, MessageCircle, BarChart3, Heart, ArrowRight, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre o Carbi',
  description: 'O Carbi é um marketplace automotivo brasileiro feito para vender e comprar carros com dados reais, comparação FIPE e chat interno.',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'Sobre o Carbi',
    description: 'Marketplace automotivo brasileiro com referência FIPE quando disponível, chat interno e anúncios sem custo.',
    url: '/sobre',
    type: 'website',
  },
}

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Mais informação',
    desc: 'Use os dados disponíveis no anúncio e confirme documentos, estado e histórico antes de negociar.',
  },
  {
    icon: BarChart3,
    title: 'Referência FIPE quando disponível',
    desc: 'Quando a combinação exata de modelo, ano e versão é encontrada, mostramos a referência e o mês consultado.',
  },
  {
    icon: MessageCircle,
    title: 'Contato pela plataforma',
    desc: 'O chat permite iniciar uma conversa entre comprador e vendedor sem publicar o telefone no anúncio.',
  },
  {
    icon: Heart,
    title: 'Anúncio sem custo',
    desc: 'Cada conta pode manter até 5 anúncios ativos, com até 10 fotos em cada publicação.',
  },
] as const

const NUMBERS = [
  { value: '5', label: 'anúncios ativos por conta' },
  { value: '10', label: 'fotos por anúncio' },
  { value: 'FIPE', label: 'quando a versão é confirmada' },
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
            A plataforma reúne anúncios, dados disponíveis dos veículos e ferramentas para iniciar uma negociação.
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
              com limites e fontes apresentados de forma clara.
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
                <li><Check size={16} /> Até 5 anúncios ativos por conta</li>
                <li><Check size={16} /> Até 10 fotos por anúncio</li>
                <li><Check size={16} /> Referência FIPE quando a versão é encontrada</li>
                <li><Check size={16} /> Chat interno para contato</li>
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
                O cadastro permite até 5 anúncios ativos por conta. Cada anúncio aceita até 10 fotos.
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
