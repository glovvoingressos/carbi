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
    alternates: {
      canonical: '/carros-a-venda',
    },
    robots: hasFilters
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
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
    <main className="fingen-shell">
      <LocalBusinessSchema />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Carros à venda', url: '/carros-a-venda' },
      ]} />
      <div className="fingen-shell-content">
        <div className="fingen-shell-hero">
          <div className="fingen-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Carros à venda</span>
          </div>
          <h1 className="text-balance">Carros à venda</h1>
          <p className="text-pretty">
            Encontre o veículo perfeito entre os {result.total} anúncios ativos na plataforma. Compare com FIPE e negocie com segurança.
          </p>
        </div>

        <MarketplaceClient 
          initialListings={listings}
          initialTotal={result.total}
          initialPage={page}
          initialTotalPages={totalPages}
          filterOptions={filterOptions}
        />

        {/* Bottom SEO Content */}
        <div className="mt-16 md:mt-24">
          <section className="fingen-card-dark">
            <h2 className="text-balance mb-6" style={{ color: '#fff' }}>Compre seu próximo carro com segurança</h2>
            <div className="fingen-grid-2" style={{ gap: '32px' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '16px' }}>
                  O marketplace da Carbi foi desenhado para eliminar o atrito na compra e venda de veículos. Aqui, cada detalhe importa: desde a precisão dos dados técnicos até a segurança do chat interno.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                  Utilizamos inteligência de dados para comparar preços com a Tabela FIPE em tempo real, garantindo que você faça sempre o melhor negócio.
                </p>
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Destaques da Plataforma</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'Verificação de procedência via dados técnicos',
                    'Comparação automática com preço de mercado',
                    'Filtros avançados por categoria e opcionais',
                    'Negociação direta sem intermediários',
                    'Chat seguro com criptografia'
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <FAQSection
            items={[
              { q: 'Como comprar um carro com segurança na Carbi?', a: 'Sempre utilize nosso chat interno para negociação, verifique as fotos detalhadas e agende visitas em locais públicos e movimentados.' },
              { q: 'Os preços dos carros são negociáveis?', a: 'Sim, a Carbi facilita a conexão direta entre comprador e vendedor, permitindo que vocês cheguem ao melhor valor sem taxas de corretagem.' },
              { q: 'Como saber se o carro está com preço justo?', a: 'Cada anúncio exibe uma comparação automática com a Tabela FIPE do mês vigente, indicando se o valor está abaixo, na média ou acima do mercado.' }
            ]}
          />
        </div>
      </div>
    </main>
  )
}
