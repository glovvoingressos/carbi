import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import { fetchPublicListingsPage, ListingSort, getFilterOptions } from '@/lib/marketplace-server'
import { LocalBusinessSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vehicle_type?: string }>
}): Promise<Metadata> {
  const sp = await searchParams
  const query = (sp.q || '').trim()
  return {
    title: query ? `Caminhões à venda: ${query} | Carbi` : 'Caminhões à venda no Brasil | Marketplace Inteligente | Carbi',
    description: 'Encontre o seu próximo caminhão com o marketplace inteligente da Carbi. Ofertas de caminhões, trucks, bitrem, carreta e veículos pesados em todo o Brasil.',
  }
}

export default async function CaminhoesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string; 
    vehicle_type?: string;
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

  // Garante que a URL sempre tenha vehicle_type=truck na página de caminhões
  if (sp.vehicle_type !== 'truck') {
    const params = new URLSearchParams()
    Object.entries(sp).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    params.set('vehicle_type', 'truck')
    redirect(`/caminhoes?${params.toString()}`)
  }

  const query = (sp.q || '').trim()
  const sort = (sp.ordem || 'recent') as ListingSort
  const page = Math.max(Number(sp.pagina || '1') || 1, 1)

  const [result, filterOptions] = await Promise.all([
    fetchPublicListingsPage({
      q: query || undefined,
      vehicle_type: 'truck',
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
            Caminhões à venda.
          </h1>
          <p className="mt-4 text-dark/40 font-bold text-lg">
            Encontre o caminhão perfeito entre os {result.total} anúncios ativos na plataforma.
          </p>
        </div>

        <MarketplaceClient 
          initialListings={result.items}
          initialTotal={result.total}
          initialPage={page}
          initialTotalPages={totalPages}
          filterOptions={filterOptions}
        />

        {/* Bottom SEO Content */}
        <div className="mt-32">
          <section className="bg-white rounded-[48px] p-12 sm:p-20 border border-black/5 shadow-sm">
            <h2 className="text-3xl sm:text-5xl font-black text-dark tracking-tight mb-8">
              Compre seu próximo caminhão com segurança
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <p className="text-xl font-bold text-dark/40 leading-relaxed">
                  O marketplace da Carbi foi desenhado para quem busca caminhões, trucks, bitrems e veículos pesados com transparência e segurança. Cada anúncio é verificado e enriquecido com dados técnicos precisos.
                </p>
                <p className="text-lg font-medium text-dark/40 leading-relaxed">
                  Seja para transporte de cargas, construção civil ou frota empresarial, utilize nossos filtros avançados para encontrar exatamente o que precisa: tipo de caminhão, capacidade de carga, número de eixos e carroceria.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-black text-dark">Por que comprar um caminhão na Carbi?</h3>
                <ul className="space-y-4">
                  {[
                    'Filtros específicos para caminhões (tipo, carga, eixos)',
                    'Comparação de preço com mercado em tempo real',
                    'Anúncios com especificações técnicas completas',
                    'Chat seguro para negociação direta',
                    'Verificação de procedência e histórico'
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
              { 
                q: 'Como filtrar caminhões na Carbi?', 
                a: 'Utilize os filtros disponíveis: tipo de caminhão (truck, bitrem, carreta, etc.), capacidade de carga, número de eixos, marca, ano e quilometragem. Todos os filtros são atualizados em tempo real.' 
              },
              { 
                q: 'Os caminhões possuem comparação com preço de mercado?', 
                a: 'Sim! Cada anúncio de caminhão exibe uma análise comparativa com valores de referência do segmento, ajudando você a identificar se o preço está justo.' 
              },
              { 
                q: 'Como funciona o chat para caminhões?', 
                a: 'Assim como para carros, você pode iniciar uma conversa segura diretamente pelo site. Negocie detalhes como valor, condições de pagamento, documentação e agendar visita ao veículo.' 
              },
              { 
                q: 'Quais tipos de caminhões posso encontrar?', 
                a: 'Temos desde trucks e cavalos mecânicos até carretas, bitrens, caminhões basculantes e de carga seca. Use o filtro "Tipo" para refinar sua busca.' 
              }
            ]} 
          />
        </div>
      </div>
    </main>
  )
}
