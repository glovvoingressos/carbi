import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Camera, ShieldCheck, Zap, ArrowRight, MessageSquareCode } from 'lucide-react'
import { LocalBusinessBHTicketsSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Anunciar Carro em BH | Venda Rápido e Seguro | Carbi',
  description: 'Quer vender seu carro em Belo Horizonte? Anuncie na Carbi e conecte-se com milhares de compradores e lojistas de BH. Avaliação FIPE em tempo real.',
  keywords: ['anunciar carro bh', 'vender carro belo horizonte', 'venda de carros bh', 'onde anunciar carro bh'],
  openGraph: {
    title: 'Venda seu carro em Belo Horizonte - Rápido e Seguro',
    description: 'Anuncie seu veículo na plataforma que mais cresce em Minas Gerais.',
    locale: 'pt_BR',
    type: 'website',
  }
}

export default function AnunciarCarroBHPage() {
  return (
    <div className="bg-surface min-h-screen pb-20">
      <LocalBusinessBHTicketsSchema />
      
      {/* Hero Section */}
      <section className="bg-dark text-white pt-20 pb-24 border-b-8 border-[var(--color-bento-red)] relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <div className="container max-w-4xl mx-auto px-4 relative z-10">
          <Badge text="🔥 Mais de 10.000 Vendas em MG" />
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mt-6 mb-6 leading-[1.1]">
            Venda seu carro <br />
            em <span className="text-[var(--color-bento-yellow)]">Belo Horizonte</span>.
          </h1>
          <p className="text-xl md:text-2xl text-white/70 font-medium max-w-2xl leading-relaxed mb-10">
            A forma mais rápida, inteligente e segura de anunciar seu veículo para compradores reais e lojistas na capital mineira.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Fake Form/Button for conversion demo */}
             <button className="w-full sm:w-auto bg-[var(--color-bento-yellow)] text-dark font-black text-lg px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                Começar meu Anúncio <ArrowRight className="w-5 h-5" />
             </button>
             <p className="text-sm font-medium text-white/50">* Leva menos de 2 minutos.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-[4px_4px_0_#0A0A0A] border-2 border-dark">
            <div className="bg-[#b4d2ff] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 border-dark shadow-sm">
              <Zap className="text-dark w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-dark mb-3">Venda Expressa</h3>
            <p className="text-text-secondary font-medium leading-relaxed">Mostramos seu carro primeiro para quem busca exatamente o seu modelo em BH na busca avançada.</p>
          </div>
          
          <div className="bg-[#E8D4FF] p-8 rounded-[32px] shadow-[4px_4px_0_#0A0A0A] border-2 border-dark">
            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 border-dark shadow-sm">
              <ShieldCheck className="text-[#00D632] w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-dark mb-3">Conexão Segura</h3>
            <p className="text-dark/80 font-medium leading-relaxed">Você só passa o telefone se o negócio fizer sentido. Cuidamos do anonimato inicial da sua negociação.</p>
          </div>

          <div className="bg-[#fff9d4] p-8 rounded-[32px] shadow-[4px_4px_0_#0A0A0A] border-2 border-dark">
            <div className="bg-[var(--color-bento-yellow)] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 border-dark shadow-sm">
              <MessageSquareCode className="text-dark w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-dark mb-3">IA para Ficha</h3>
            <p className="text-dark/80 font-medium leading-relaxed">Só precisa da placa. Nossa Inteligência Artificial preenche toda a ficha técnica baseado na versão exata.</p>
          </div>
        </div>
      </section>

      {/* SEO Text Core */}
      <section className="py-20">
         <div className="container max-w-4xl mx-auto px-4">
             <div className="bg-white border border-border rounded-[40px] p-8 md:p-12">
                 <h2 className="text-3xl font-black text-dark mb-6">Como anunciar carro em BH de forma eficiente?</h2>
                 <div className="prose prose-lg text-text-secondary">
                     <p>Vender um veículo em <strong>Belo Horizonte</strong> exige estratégia. Devido à grande oferta na região da Pampulha, Contagem e área central de BH, seu anúncio precisa de destaque técnico.</p>
                     
                     <h3 className="text-xl font-bold text-dark mt-8 mb-4">1. Use a Tabela FIPE a seu favor</h3>
                     <p>Na hora de anunciar na Carbi, nós trazemos o preço oficial da <Link href="/" className="text-[var(--color-bento-red)] hover:underline">Tabela Fipe</Link> do mês atual. Carros anunciados a 5% ou 10% abaixo da tabela têm pico de conversão com lojistas locais nas primeiras 48 horas.</p>

                     <h3 className="text-xl font-bold text-dark mt-8 mb-4">2. Carros mais procurados na capital Mineira</h3>
                     <p>O mercado local valoriza muito hatches e SUVs com suspensão resistente devido ao asfalto e topografia única da cidade. Se você está anunciando modelos como <strong>Toyota Yaris, Fiat Pulse, Jeep Renegade ou Chevrolet Tracker</strong>, seu carro já sai com vantagem de visibilidade orgânica.</p>
                 </div>
             </div>
         </div>
      </section>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#fff9d4] px-4 py-2 text-sm font-black text-dark uppercase tracking-widest border border-dark">
      {text}
    </span>
  )
}
