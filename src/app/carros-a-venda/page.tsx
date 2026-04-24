import type { Metadata } from 'next'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { fetchPublicListingsPage, ListingSort, getFilterOptions } from '@/lib/marketplace-server'
import { LocalBusinessSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const sp = await searchParams
  const query = (sp.q || '').trim()
  return {
    title: query ? `Carros à venda: ${query} | Carbi` : 'Carros à venda em BH e região | Carbi',
    description: 'Encontre o seu próximo carro com o marketplace inteligente da Carbi. Ofertas reais em Belo Horizonte, Contagem, Betim e região metropolitana.',
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
    <main className="bg-[#f5f5f3] min-h-screen pt-32 pb-24">
      <LocalBusinessSchema />
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-white/50 border border-black/5 px-3 py-1 rounded-full mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-dark/40">Marketplace</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-dark tracking-tight leading-[0.95]">
            Marketplace inteligente.
          </h1>
          <p className="mt-4 text-dark/40 font-bold text-lg">
            Encontre o veículo perfeito entre os {result.total} anúncios ativos em BH.
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
        <div className="mt-32">
          <section className="bg-white rounded-[48px] p-12 sm:p-20 border border-black/5 shadow-sm">
            <h2 className="text-3xl sm:text-5xl font-black text-dark tracking-tight mb-8">Compre seu próximo carro com segurança</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <p className="text-xl font-bold text-dark/40 leading-relaxed">
                  O marketplace da Carbi foi desenhado para eliminar o atrito na compra e venda de veículos. Aqui, cada detalhe importa: desde a precisão dos dados técnicos até a segurança do chat interno.
                </p>
                <p className="text-lg font-medium text-dark/40 leading-relaxed">
                  Utilizamos inteligência de dados para comparar preços com a Tabela FIPE em tempo real, garantindo que você faça sempre o melhor negócio, seja comprando seu primeiro carro ou trocando o seminovo da família.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-black text-dark">Destaques da Plataforma</h3>
                <ul className="space-y-4">
                  {[
                    'Verificação de procedência via dados técnicos',
                    'Comparação automática com preço de mercado',
                    'Filtros avançados por categoria e opcionais',
                    'Negociação direta sem intermediários',
                    'Chat seguro com criptografia'
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg font-bold text-dark/60">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
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
