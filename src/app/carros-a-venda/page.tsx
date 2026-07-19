import type { Metadata } from 'next'
import Link from 'next/link'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { fetchPublicListingsPage, ListingSort, getFilterOptions } from '@/lib/marketplace-server'
import { BreadcrumbSchema, LocalBusinessSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    ordem?: ListingSort
    pagina?: string
    brand?: string | string[]
    fuel?: string | string[]
    transmission?: string | string[]
    color?: string | string[]
    body_type?: string | string[]
    price_min?: string
    price_max?: string
    year_min?: string
    year_max?: string
    mileage_min?: string
    mileage_max?: string
  }>
}): Promise<Metadata> {
  const sp = await searchParams
  const query = (sp.q || '').trim()
  const hasFilters = Boolean(
    query ||
    sp.ordem ||
    sp.pagina ||
    sp.brand ||
    sp.fuel ||
    sp.transmission ||
    sp.color ||
    sp.body_type ||
    sp.price_min ||
    sp.price_max ||
    sp.year_min ||
    sp.year_max ||
    sp.mileage_min ||
    sp.mileage_max,
  )
  return {
    title: query ? `Carros à venda: ${query} | Carbi` : 'Carros à venda, seminovos e usados | Carbi',
    description: 'Encontre carros à venda, seminovos e usados com preços reais, comparação FIPE e chat interno seguro na Carbi.',
    keywords: ['carros à venda', 'seminovos à venda', 'carros usados', 'comprar carro', 'carro seminovo', 'anunciar carro grátis'],
    alternates: { canonical: '/carros-a-venda' },
    robots: hasFilters
      ? { index: false, follow: true, googleBot: { index: false, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      title: 'Carros à venda, seminovos e usados | Carbi',
      description: 'Encontre carros à venda, seminovos e usados com preços reais, comparação FIPE e chat interno seguro na Carbi.',
      type: 'website',
      url: '/carros-a-venda',
    },
  }
}

export default async function CarrosAVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string; 
    ordem?: ListingSort; 
    pagina?: string;
    brand?: string | string[];
    fuel?: string | string[];
    transmission?: string | string[];
    color?: string | string[];
    body_type?: string | string[];
    price_min?: string;
    price_max?: string;
    year_min?: string;
    year_max?: string;
    mileage_min?: string;
    mileage_max?: string;
  }>
}) {
  const sp = await searchParams
  const query = (sp.q || '').trim()
  const sort = (sp.ordem || 'recent') as ListingSort
  const page = Math.max(Number(sp.pagina || '1') || 1, 1)

  const [result, filterOptions] = await Promise.all([
    fetchPublicListingsPage({
      q: query || undefined,
      brand: sp.brand,
      fuel: sp.fuel,
      transmission: sp.transmission,
      color: sp.color,
      bodyType: sp.body_type,
      priceMin: sp.price_min ? Number(sp.price_min) : undefined,
      priceMax: sp.price_max ? Number(sp.price_max) : undefined,
      yearMin: sp.year_min ? Number(sp.year_min) : undefined,
      yearMax: sp.year_max ? Number(sp.year_max) : undefined,
      mileageMin: sp.mileage_min ? Number(sp.mileage_min) : undefined,
      mileageMax: sp.mileage_max ? Number(sp.mileage_max) : undefined,
      sort,
      page,
      pageSize: 24,
    }),
    getFilterOptions()
  ])

  const listings = result.items
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))

  return (
    <div className="cbi-page">
      <main className="cbi-main">
        <LocalBusinessSchema />
        <BreadcrumbSchema items={[
          { name: 'Home', url: '/' },
          { name: 'Carros à venda', url: '/carros-a-venda' },
        ]} />

        {/* Minimalist Hero */}
        <section className="cbi-hero">
          <div className="cbi-hero-eyebrow">Marketplace</div>
          <h1 className="cbi-hero-title">
            {query ? (
              <>Resultados para <em>&ldquo;{query}&rdquo;</em></>
            ) : (
              <>Encontre o carro <em>perfeito</em></>
            )}
          </h1>
          <p className="cbi-hero-sub">
            {result.total} anúncios ativos na plataforma. Compare com a Tabela FIPE e negocie com segurança.
          </p>
        </section>

        {/* Marketplace */}
        <MarketplaceClient 
          initialListings={listings}
          initialTotal={result.total}
          initialPage={page}
          initialTotalPages={totalPages}
          filterOptions={filterOptions}
        />

        {/* FAQ */}
        <section className="cbi-section">
          <FAQSection
            items={[
              { q: 'Como comprar um carro com segurança na Carbi?', a: 'Sempre utilize nosso chat interno para negociação, verifique as fotos detalhadas e agende visitas em locais públicos e movimentados.' },
              { q: 'Os preços dos carros são negociáveis?', a: 'Sim, a Carbi facilita a conexão direta entre comprador e vendedor, permitindo que vocês cheguem ao melhor valor sem taxas de corretagem.' },
              { q: 'Como saber se o carro está com preço justo?', a: 'Cada anúncio exibe uma comparação automática com a Tabela FIPE do mês vigente, indicando se o valor está abaixo, na média ou acima do mercado.' }
            ]}
          />
        </section>
      </main>

      {/* Bottom navigation */}
      <nav className="cbi-nav">
        <Link href="/"><span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Home</span></Link>
        <Link href="/carros-a-venda" className="active"><span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Buscar</span></Link>
        <Link href="/anunciar-carro"><span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Anunciar</span></Link>
        <Link href="/minha-conta/conversas"><span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Chat</span></Link>
        <Link href="/minha-conta"><span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
          Perfil</span></Link>
      </nav>
    </div>
  )
}
