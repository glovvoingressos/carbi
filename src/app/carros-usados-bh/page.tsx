import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ListingCard from '@/components/marketplace/ListingCard'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { MIN_INDEXABLE_INVENTORY } from '@/lib/marketplace-seo'

async function getInventory() {
  return fetchPublicListingsPage({ city: '%Belo Horizonte%', state: 'MG', vehicle_type: 'car', page: 1, pageSize: 12, sort: 'recent' })
}

export async function generateMetadata(): Promise<Metadata> {
  const inventory = await getInventory()
  const canIndex = inventory.total >= MIN_INDEXABLE_INVENTORY
  return {
    title: 'Carros à venda em Belo Horizonte | Carbi',
    description: 'Veja carros anunciados em Belo Horizonte. Preços e dados são informados pelos vendedores; confirme as condições diretamente antes da compra.',
    keywords: ['carros à venda em Belo Horizonte', 'comprar carro em BH', 'carros usados BH'],
    alternates: { canonical: '/carros-usados-bh' },
    robots: { index: canIndex, follow: true },
  }
}

export default async function CarrosUsadosBHPage() {
  const { items, total } = await getInventory()
  if (total < MIN_INDEXABLE_INVENTORY) notFound()

  return (
    <div className="fingen-shell">
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
          <p style={{ maxWidth: '560px', margin: '0 auto' }}>
            {total} carros anunciados em Belo Horizonte. Preço, quilometragem e estado do veículo são informados pelo vendedor; confirme os detalhes antes de negociar.
          </p>
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
                A lista reúne anúncios cadastrados na plataforma e pode mudar conforme os vendedores publicam, atualizam ou encerram ofertas. Verifique documentação, histórico, estado e preço antes de fechar negócio.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
