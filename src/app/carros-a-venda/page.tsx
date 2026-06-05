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
    title: query ? `Carros à venda: ${query} | Carbi` : 'Carros à venda no Brasil | Marketplace Inteligente | Carbi',
    description: 'Encontre o seu próximo carro com o marketplace inteligente da Carbi. Ofertas reais com segurança e transparência em todo o Brasil.',
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
    <main className="min-h-screen pt-28 pb-24">
      <LocalBusinessSchema />
      <div className="container">
        <div className="hero-bento p-6 md:p-10 lg:p-12 mb-8">
          <div className="section-heading">
            <div className="section-kicker mb-4">Marketplace</div>
            <h1 className="text-balance">Marketplace inteligente.</h1>
            <p className="body-large mt-4 max-w-2xl text-pretty">
              Encontre o veículo perfeito entre os {result.total} anúncios ativos na plataforma.
            </p>
          </div>
        </div>

        <MarketplaceClient 
          initialListings={listings}
          initialTotal={result.total}
          initialPage={page}
          initialTotalPages={totalPages}
          filterOptions={filterOptions}
        />

        {/* Bottom SEO Content */}
        <div className="mt-20 md:mt-28">
          <section className="surface-strong p-8 sm:p-12 md:p-16">
            <h2 className="text-balance mb-8">Compre seu próximo carro com segurança</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <p className="text-xl font-bold text-[#52607A] leading-relaxed">
                  O marketplace da Carbi foi desenhado para eliminar o atrito na compra e venda de veículos. Aqui, cada detalhe importa: desde a precisão dos dados técnicos até a segurança do chat interno.
                </p>
                <p className="text-lg font-medium text-[#52607A] leading-relaxed">
                  Utilizamos inteligência de dados para comparar preços com a Tabela FIPE em tempo real, garantindo que você faça sempre o melhor negócio, seja comprando seu primeiro carro ou trocando o seminovo da família.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#0A0A0A]">Destaques da Plataforma</h3>
                <ul className="space-y-4">
                  {[
                    'Verificação de procedência via dados técnicos',
                    'Comparação automática com preço de mercado',
                    'Filtros avançados por categoria e opcionais',
                    'Negociação direta sem intermediários',
                    'Chat seguro com criptografia'
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg font-bold text-[#52607A]">
                      <div className="w-2 h-2 rounded-full bg-[#D9F85F]" />
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
