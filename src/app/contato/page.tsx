import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, ShieldCheck, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contato | Carbi',
  description: 'Fale com a equipe Carbi. Atendimento para compradores e vendedores, suporte, parcerias e imprensa.',
  alternates: { canonical: '/contato' },
  openGraph: {
    title: 'Contato | Carbi',
    description: 'Fale com a equipe Carbi.',
    url: '/contato',
    type: 'website',
  },
}

const CHANNELS = [
  {
    icon: Mail,
    title: 'E-mail',
    label: 'Atendimento geral',
    value: 'contato@carbi.com.br',
    href: 'mailto:contato@carbi.com.br',
    note: 'Respondemos em até 1 dia útil.',
  },
  {
    icon: MessageCircle,
    title: 'Suporte da sua conta',
    label: 'Já é anunciante?',
    value: 'Abrir conversa no app',
    href: '/minha-conta/conversas',
    note: 'Resposta mais rápida para dúvidas sobre anúncios.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança e denúncia',
    label: 'Reportar um problema',
    value: 'seguranca@carbi.com.br',
    href: 'mailto:seguranca@carbi.com.br',
    note: 'Para golpes, perfis falsos ou anúncios suspeitos.',
  },
] as const

const FAQS = [
  {
    q: 'Como anuncio meu carro na Carbi?',
    a: 'Crie sua conta, clique em "Anunciar grátis" e siga o passo a passo. Em menos de 2 minutos seu anúncio está no ar.',
  },
  {
    q: 'A Carbi cobra para anunciar?',
    a: 'Não. O plano gratuito permite anunciar sem custo. Há planos Pro com selo de verificação e destaque nas buscas.',
  },
  {
    q: 'Como entro em contato com um vendedor?',
    a: 'Dentro de cada anúncio há um botão para iniciar uma conversa pelo chat interno da plataforma. Recomendamos nunca compartilhar telefone ou dados bancários antes de fechar negócio.',
  },
  {
    q: 'Vocês intermediam o pagamento?',
    a: 'Não. A negociação é direta entre comprador e vendedor. Fornecemos ferramentas de chat, comparação FIPE e histórico do veículo para você decidir com segurança.',
  },
]

export default function ContatoPage() {
  return (
    <main className="cb-page">
      <section className="cb-section-pad">
        <div className="cb-wrap">
          <p className="cb-eyebrow">Contato</p>
          <h1 style={{ maxWidth: '18ch' }}>Fale com a gente</h1>
          <p className="cb-lead" style={{ maxWidth: '52ch' }}>
            Tem uma dúvida, sugestão ou precisa de ajuda com um anúncio?
            Escolha o canal abaixo — respondemos rápido.
          </p>

          <div className="cb-contact-grid">
            {CHANNELS.map((c) => {
              const Icon = c.icon
              return (
                <a key={c.title} href={c.href} className="cb-contact-card">
                  <div className="cb-contact-card-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <span className="cb-contact-card-label">{c.label}</span>
                  <strong className="cb-contact-card-title">{c.title}</strong>
                  <span className="cb-contact-card-value">{c.value}</span>
                  <span className="cb-contact-card-note">{c.note}</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="cb-section-pad cb-section-alt">
        <div className="cb-wrap">
          <div className="cb-head">
            <div>
              <p className="cb-eyebrow">Perguntas frequentes</p>
              <h2 style={{ maxWidth: '24ch' }}>Talvez já tenhamos a resposta</h2>
            </div>
          </div>

          <div className="cb-faq-list">
            {FAQS.map((f, i) => (
              <details key={i} className="cb-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cb-section-pad">
        <div className="cb-wrap">
          <div className="cb-cta-block">
            <div>
              <p className="cb-eyebrow">Imprensa e parcerias</p>
              <h2 style={{ maxWidth: '20ch' }}>Quer falar com a gente sobre algo maior?</h2>
              <p style={{ maxWidth: '48ch' }}>
                Atendimento dedicado para jornalistas, parcerias comerciais, montadoras
                e integrações com a plataforma.
              </p>
            </div>
            <Link href="mailto:parcerias@carbi.com.br" className="cb-btn cb-btn-lime cb-btn-arrow">
              parcerias@carbi.com.br
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}