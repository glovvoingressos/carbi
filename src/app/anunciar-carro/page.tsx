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
    <main className="min-h-screen bg-[#F5F5F5]">
      {/* Hero - Minimalista */}
      <section className="bg-[#1A1A1A] py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center justify-center gap-2 mb-8 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link>
            <span aria-hidden="true" className="text-white/30">/</span>
            <span aria-current="page" className="text-white font-medium">Anunciar carro</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4F576]/10 border border-[#D4F576]/20 rounded-full text-xs font-semibold text-[#D4F576] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#D4F576] animate-pulse" />
            100% grátis para anunciar
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Anuncie seu carro
          </h1>

          <p className="text-lg text-white/70 mb-8 max-w-md mx-auto">
            Marketplace premium com FIPE, fotos e chat seguro.
          </p>

          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/anunciar-carro/fluxo" className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D4F576] text-[#1A1A1A] font-semibold rounded-full hover:bg-[#C8E64E] transition-colors">
              Começar agora <ArrowRight size={16} />
            </Link>
            <Link href="/carros-a-venda" className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-colors">
              Ver anúncios
            </Link>
          </div>
        </div>
      </section>

      {/* Steps - Limpo */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#6F6F6F] uppercase tracking-wider mb-2">Fluxo simples</p>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Do veículo publicado sem atrito</h2>
            </div>
            <Link href="/anunciar-carro/fluxo" className="hidden md:flex items-center gap-1 text-sm font-medium text-[#1A1A1A] hover:text-[#5A47D1] transition-colors">
              Anunciar grátis <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((step, index) => (
              <div key={step} className="bg-white border border-[#E5E5E5] rounded-xl p-5">
                <div className="text-xs font-bold text-[#D4F576] mb-3">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] leading-snug">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Minimalista */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#6F6F6F] uppercase tracking-wider mb-2">Recursos</p>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Identidade visual em todo o fluxo</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Link href="/anunciar-carro/fluxo" key={card.title} className="p-6 rounded-xl border border-[#E5E5E5] no-underline hover:border-[#D4F576] transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-[#D4F576]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4F576]/20 transition-colors">
                    <Icon size={24} className="text-[#1A1A1A]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">{card.title}</h3>
                  <p className="text-sm text-[#6F6F6F] leading-relaxed">{card.text}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Security - Contraste Corrigido */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 md:p-10 grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-[#D4F576] uppercase tracking-wider mb-3">Segurança</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
                Seu contato direto não fica exposto
              </h2>
              <p className="text-[15px] text-white/80 leading-relaxed mb-6">
                O comprador inicia conversa pelo chat interno. Negociação organizada e dados protegidos.
              </p>
              <Link href="/anunciar-carro/fluxo" className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D4F576] text-[#1A1A1A] font-semibold rounded-full hover:bg-[#C8E64E] transition-colors">
                Publicar grátis <ArrowRight size={16} />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-5 bg-white/[0.08] border border-white/[0.1] rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={20} className="text-[#D4F576]" />
                  <h3 className="text-[15px] font-semibold text-white">Chat interno</h3>
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed">Sem telefone público. Conversa vinculada ao anúncio.</p>
              </div>
              <div className="p-5 bg-white/[0.08] border border-white/[0.1] rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <BadgeCheck size={20} className="text-[#D4F576]" />
                  <h3 className="text-[15px] font-semibold text-white">Permissões reais</h3>
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed">Acesso controlado para anunciante e interessado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
