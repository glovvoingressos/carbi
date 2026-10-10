import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import ListingCard from '@/components/marketplace/ListingCard'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import type { ListingPublic } from '@/lib/marketplace'
import { CATEGORY_INTENT_SLUGS, resolveCategoryIntent, type IntentData } from '@/lib/category-intents'

export async function generateStaticParams() {
  return CATEGORY_INTENT_SLUGS.map((intent) => ({ intent }))
}

export async function generateMetadata({ params }: { params: Promise<{ intent: string }> }): Promise<Metadata> {
  const resolved = await params
  const data = resolveCategoryIntent(resolved.intent)
  if (!data) return { title: 'Não Encontrado' }
  const hasInventory = (await getCategoryListings(resolved.intent)).length > 0

  return {
    title: `${data.title}`,
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
    robots: { index: hasInventory, follow: true },
  }
}

export default async function IntentHubPage({ params }: { params: Promise<{ intent: string }> }) {
  const resolved = await params
  const data = resolveCategoryIntent(resolved.intent)

  if (!data) {
    notFound()
  }

  const filteredListings = await getCategoryListings(resolved.intent)

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

async function fetchCategoryListings(data: IntentData): Promise<ListingPublic[]> {
  const firstPage = await fetchPublicListingsPage({
    ...(data.query || {}),
    page: 1,
    pageSize: 48,
  })
  const firstMatches = firstPage.items.filter(data.filter)
  const totalPages = Math.min(Math.ceil(firstPage.total / firstPage.pageSize), 3)

  if (firstMatches.length >= 16 || totalPages <= 1) return firstMatches.slice(0, 16)

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchPublicListingsPage({
        ...(data.query || {}),
        page: index + 2,
        pageSize: 48,
      }),
    ),
  )

  return [...firstPage.items, ...remainingPages.flatMap((page) => page.items)]
    .filter(data.filter)
    .slice(0, 16)
}

const getCategoryListings = cache(async (slug: string): Promise<ListingPublic[]> => {
  const data = resolveCategoryIntent(slug)
  return data ? fetchCategoryListings(data) : []
})

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/90">
      {text}
    </span>
  )
}
