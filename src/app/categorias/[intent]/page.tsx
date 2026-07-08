import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import ListingCard from '@/components/marketplace/ListingCard'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { fetchPublicListingsPage, ListingSort } from '@/lib/marketplace-server'
import type { ListingPublic } from '@/lib/marketplace'

type IntentData = {
  title: string
  desc: string
  h1: string
  filter: (listing: ListingPublic) => boolean
  query?: {
    sort?: ListingSort
    priceMin?: number
    priceMax?: number
    bodyType?: string | string[]
    fuel?: string | string[]
  }
}

const INTENTS: Record<string, IntentData> = {
  'ate-50-mil': {
    title: 'Melhores Carros até 50 mil | Opções Baratas e Seguras',
    desc: 'Buscando um carro até 50 mil reais? Confira anúncios reais com preços atualizados, fotos e comparação FIPE.',
    h1: 'Melhores Carros até 50 mil reais',
    query: { priceMax: 50000, sort: 'price_asc' },
    filter: (listing) => listing.price <= 50000,
  },
  'ate-100-mil': {
    title: 'Melhores Carros até 100 mil | Custo Benefício',
    desc: 'Encontre carros até 100 mil reais na Carbi. Compare SUVs, sedans e hatches com valor atualizado de mercado.',
    h1: 'Melhores Carros até 100 mil reais',
    query: { priceMax: 100000, priceMin: 50000, sort: 'price_asc' },
    filter: (listing) => listing.price <= 100000 && listing.price > 50000,
  },
  'economicos': {
    title: 'Carros Mais Econômicos | Baixo Consumo de Combustível',
    desc: 'Descubra anúncios reais com foco em baixo consumo, manutenção acessível e melhor custo por uso.',
    h1: 'Carros Mais Econômicos do Brasil',
    query: { sort: 'mileage_asc' },
    filter: (listing) => {
      const fuel = `${listing.fuel} ${listing.engine || ''}`.toLowerCase()
      return listing.mileage <= 70000 || /flex|gasoline|hybrid|electric/.test(fuel)
    },
  },
  'para-familia': {
    title: 'Melhores Carros para Família | Espaço e Porta Malas Grande',
    desc: 'Para viajar com conforto e levar tudo. Veja anúncios reais com bom espaço interno e carrocerias familiares.',
    h1: 'Melhores Carros para Família',
    query: { bodyType: ['suv', 'sedan', 'pickup'], sort: 'recent' },
    filter: (listing) => /suv|sedan|pickup|van/.test((listing.body_type || '').toLowerCase()) || (listing.doors || 0) >= 4,
  },
  '7-lugares': {
    title: 'Carros de 7 Lugares | Melhores Opções para Grupos Grandes',
    desc: 'Precisa de mais espaço? Confira uma seleção de anúncios reais mais adequados para famílias grandes e viagens.',
    h1: 'Melhores Carros de 7 Lugares',
    query: { bodyType: ['suv', 'pickup'], sort: 'recent' },
    filter: (listing) => /suv|pickup|van/.test((listing.body_type || '').toLowerCase()) || (listing.doors || 0) >= 4,
  },
  'hibridos': {
    title: 'Carros Híbridos e Sustentáveis | Tecnologia e Economia',
    desc: 'O futuro chegou. Conheça os anúncios reais de híbridos no Brasil, unindo desempenho e economia.',
    h1: 'Melhores Carros Híbridos',
    query: { fuel: 'hybrid', sort: 'recent' },
    filter: (listing) => /hybrid|híbrido/.test(`${listing.fuel} ${listing.engine}`.toLowerCase()),
  },
  'off-road': {
    title: 'Melhores Carros Off-Road | Tração 4x4 e Aventura',
    desc: 'Para quem não tem medo de estrada ruim. Veja anúncios reais com foco em robustez e aventura.',
    h1: 'Carros Selecionados para Off-Road',
    query: { bodyType: ['pickup', 'suv'], sort: 'recent' },
    filter: (listing) => /pickup|suv|awd|4x4|4wd/.test(`${listing.body_type} ${listing.engine} ${listing.optional_items.join(' ')}`.toLowerCase()),
  },
  'esportivos': {
    title: 'Carros Esportivos de Alta Performance | Velocidade e Design',
    desc: 'Paixão por dirigir. Confira anúncios reais com foco em desempenho, potência e desenho agressivo.',
    h1: 'Carros Esportivos e de Performance',
    query: { sort: 'recent' },
    filter: (listing) => (listing.horsepower || 0) >= 200 || /turbo|sport|tsi|tfs/i.test(`${listing.engine} ${listing.optional_items.join(' ')}`),
  },
}

export async function generateStaticParams() {
  return Object.keys(INTENTS).map((intent) => ({ intent }))
}

export async function generateMetadata({ params }: { params: Promise<{ intent: string }> }): Promise<Metadata> {
  const resolved = await params
  const data = INTENTS[resolved.intent]
  if (!data) return { title: 'Não Encontrado' }

  return {
    title: `${data.title} | Carbi`,
    description: data.desc,
    keywords: [data.h1, 'carros à venda', 'seminovos à venda', 'carros usados'],
    alternates: {
      canonical: `/categorias/${resolved.intent}`,
    },
    openGraph: {
      title: data.title,
      description: data.desc,
      url: `/categorias/${resolved.intent}`,
      type: 'website',
    },
  }
}

export default async function IntentHubPage({ params }: { params: Promise<{ intent: string }> }) {
  const resolved = await params
  const data = INTENTS[resolved.intent]

  if (!data) {
    notFound()
  }

  const { items } = await fetchPublicListingsPage({
    ...(data.query || {}),
    page: 1,
    pageSize: 48,
  })

  const filteredListings = items.filter(data.filter).slice(0, 16)

  return (
    <main className="fingen-shell">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Categorias', url: '/categorias/ate-50-mil' },
        { name: data.h1, url: `/categorias/${resolved.intent}` },
      ]} />

      <section className="fingen-dark-hero">
        <div className="fingen-shell-content" style={{ textAlign: 'center' }}>
          <div className="fingen-breadcrumb" style={{ justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <Link href="/categorias/ate-50-mil" style={{ color: 'rgba(255,255,255,0.5)' }}>Categorias</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#fff' }}>{data.h1}</span>
          </div>
          <h1 className="text-balance">{data.h1}</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>
            {data.desc}
          </p>
        </div>
      </section>

      <section className="fingen-section">
        <div className="fingen-shell-content">
          {filteredListings.length > 0 ? (
            <div className="fingen-grid-4">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="fingen-card-white" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px' }}>Nenhum anúncio encontrado para este critério no momento.</p>
              <Link href="/carros-a-venda" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'underline' }}>
                Ver todos os anúncios
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="fingen-section">
        <div className="fingen-shell-content">
          <div className="fingen-card-white">
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>Por que confiar neste ranking?</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
              Esta lista de <strong>{data.h1.toLowerCase()}</strong> é construída automaticamente com anúncios reais,
              usando filtros de preço, carroceria, combustível e sinais do próprio marketplace.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              O objetivo é facilitar descoberta sem depender de catálogo estático.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/90">
      {text}
    </span>
  )
}
