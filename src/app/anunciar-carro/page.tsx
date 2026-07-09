import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Camera, LineChart, MessageCircle } from 'lucide-react'
import { SEO_DATA } from '@/data/seo-content'

const data = SEO_DATA.anunciar

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  keywords: ['anunciar carro grátis', 'anunciar carro', 'vender carro', 'seminovos à venda', 'carros usados'],
  alternates: { canonical: '/anunciar-carro' },
  openGraph: { title: data.title, description: data.description, type: 'website', url: '/anunciar-carro' },
  twitter: { card: 'summary_large_image', title: data.title, description: data.description },
}

export default function AnunciarCarroPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-[#1A1A1A] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4F576] text-[#1A1A1A] text-xs font-bold mb-8">
            Grátis para sempre
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.1]">
            Anuncie seu carro
          </h1>

          <p className="text-xl text-white mb-10 leading-relaxed">
            Marketplace premium com FIPE integrado, fotos de qualidade e chat seguro.
          </p>

          <div className="flex justify-center">
            <Link href="/anunciar-carro/fluxo" className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4F576] text-[#1A1A1A] text-lg font-semibold rounded-full hover:bg-[#C8E64E] transition-colors">
              Começar agora <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A1A] text-center mb-16">
            Como funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Camera, step: '01', title: 'Adicione fotos', desc: 'Fotos de qualidade vendem mais. Até 10 imagens gratuitamente.' },
              { icon: LineChart, step: '02', title: 'Defina o preço', desc: 'Compare com a FIPE em tempo real e escolha o melhor valor.' },
              { icon: MessageCircle, step: '03', title: 'Receba contatos', desc: 'Chat seguro integrado. Sem expor telefone ou WhatsApp.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#F5F5F5] flex items-center justify-center">
                  <item.icon size={28} className="text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <div className="text-sm font-bold text-[#D4F576] mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                <p className="text-[#6F6F6F] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A1A1A] py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Comece a vender hoje
          </h2>
          <p className="text-lg text-white mb-10">
            Crie seu anúncio em menos de 5 minutos. É 100% grátis.
          </p>
          <Link href="/anunciar-carro/fluxo" className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4F576] text-[#1A1A1A] text-lg font-semibold rounded-full hover:bg-[#C8E64E] transition-colors">
            Criar anúncio grátis <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </main>
  )
}
