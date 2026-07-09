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
      <section style={{ background: '#1A1A1A', padding: '96px 24px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: '#D4F576', color: '#1A1A1A', fontSize: '12px', fontWeight: 700, marginBottom: '32px' }}>
            Grátis para sempre
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 700, color: '#FFFFFF', marginBottom: '24px', lineHeight: 1.1 }}>
            Anuncie seu carro
          </h1>

          <p style={{ fontSize: '20px', color: '#FFFFFF', marginBottom: '40px', lineHeight: 1.6 }}>
            Marketplace premium com FIPE integrado, fotos de qualidade e chat seguro.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/anunciar-carro/fluxo" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#D4F576', color: '#1A1A1A', fontSize: '18px', fontWeight: 600, borderRadius: '9999px', textDecoration: 'none' }}>
              Começar agora <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', textAlign: 'center', marginBottom: '64px' }}>
            Como funciona
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px' }}>
            {[
              { icon: Camera, step: '01', title: 'Adicione fotos', desc: 'Fotos de qualidade vendem mais. Até 10 imagens gratuitamente.' },
              { icon: LineChart, step: '02', title: 'Defina o preço', desc: 'Compare com a FIPE em tempo real e escolha o melhor valor.' },
              { icon: MessageCircle, step: '03', title: 'Receba contatos', desc: 'Chat seguro integrado. Sem expor telefone ou WhatsApp.' },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', borderRadius: '16px', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={28} color="#1A1A1A" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#D4F576', marginBottom: '8px' }}>{item.step}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ fontSize: '16px', color: '#6F6F6F', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1A1A1A', padding: '80px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#FFFFFF', marginBottom: '24px' }}>
            Comece a vender hoje
          </h2>
          <p style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '40px' }}>
            Crie seu anúncio em menos de 5 minutos. É 100% grátis.
          </p>
          <Link href="/anunciar-carro/fluxo" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#D4F576', color: '#1A1A1A', fontSize: '18px', fontWeight: 600, borderRadius: '9999px', textDecoration: 'none' }}>
            Criar anúncio grátis <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </main>
  )
}
