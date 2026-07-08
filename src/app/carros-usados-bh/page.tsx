import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react'
import { LocalBusinessBHTicketsSchema } from '@/components/seo/JSONLD'
import ListingCard from '@/components/marketplace/ListingCard'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'

export const metadata: Metadata = {
  title: 'Carros Usados em BH (Belo Horizonte) | Compra e Venda | Carbi',
  description: 'Procurando carros usados e seminovos em Belo Horizonte (BH)? Encontre anúncios reais, compare valores atualizados e faça um negócio seguro.',
  keywords: ['carros usados bh', 'comprar carro belo horizonte', 'seminovos bh', 'loja de carros bh', 'veículos usados'],
  alternates: {
    canonical: '/carros-usados-bh',
  },
  openGraph: {
    title: 'Carros Usados e Seminovos em BH - As Melhores Ofertas',
    description: 'Encontre o seu próximo carro em Belo Horizonte com a confiança da Carbi.',
    locale: 'pt_BR',
    type: 'website',
    url: '/carros-usados-bh',
  },
}

export default async function CarrosUsadosBHPage() {
  const { items } = await fetchPublicListingsPage({ city: '%Belo Horizonte%', state: 'MG', page: 1, pageSize: 12, sort: 'recent' })

  return (
    <div className="fingen-shell">
      <LocalBusinessBHTicketsSchema />

      <section className="fingen-dark-hero">
        <div className="fingen-shell-content" style={{ textAlign: 'center' }}>
          <div className="fingen-breadcrumb" style={{ justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#fff' }}>Carros usados BH</span>
          </div>
          <h1 className="text-balance">
            Carros usados em BH
          </h1>
          <p style={{ maxWidth: '500px', margin: '0 auto' }}>
            Compare anúncios reais, confira valores atualizados e avance com mais confiança.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link href="/anunciar-carro-bh" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', textDecoration: 'none', transition: 'all 0.15s ease' }}>
              Quero Vender Meu Carro <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
        </div>
      </section>

      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="fingen-grid-3">
            {[
              { title: 'Valor atualizado ao vivo', desc: 'Negociação apoiada por dados reais.' },
              { title: 'Atendimento local', desc: 'Compradores ativos em BH e região.' },
              { title: 'Venda em 24h', desc: 'Foco em oferta e resposta rápida.' },
            ].map((item) => (
              <div key={item.title} className="fingen-card-white" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CheckCircle2 style={{ width: '24px', height: '24px', color: 'var(--color-trust)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{item.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">BH e região</div>
              <h2 className="fingen-section-title">Veículos em destaque</h2>
            </div>
            <Link href="/carros-a-venda?city=Belo%20Horizonte&state=MG" className="fingen-section-link">
              Ver todos <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>

          {items.length > 0 ? (
            <div className="fingen-grid-4">
              {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="fingen-card-white" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
              Nenhum anúncio ativo encontrado em Belo Horizonte no momento.
            </div>
          )}
        </div>
      </section>

      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="fingen-card-white">
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>Comprar carro usado em Belo Horizonte</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                O mercado de <strong style={{ color: 'var(--color-text-primary)' }}>carros usados em BH</strong> é um dos mais aquecidos do Brasil. A página agora mostra anúncios reais da cidade, em vez de um catálogo auxiliar.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                Se você quer vender, use o botão acima para publicar seu carro e aparecer para compradores na região.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
