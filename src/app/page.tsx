import Link from 'next/link'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight, Sparkles, ShieldCheck, TrendingDown,
  Fuel, Gauge, Calendar, Car, Zap, Tag,
} from 'lucide-react'
import FAQSection from '@/components/layout/FAQSection'
import BrandLogo from '@/components/brand/BrandLogo'
import ListingCard from '@/components/marketplace/ListingCard'
import { getLatestPublicListings, getMarketplaceDiscoverySections } from '@/lib/marketplace-server'
import { getAllCars } from '@/lib/data-fetcher'

export const dynamic = 'force-dynamic'

const QUICK_FILTERS = [
  { label: 'SUV', icon: Car, href: '/carros/suv' },
  { label: 'Sedan', icon: Car, href: '/carros/sedan' },
  { label: 'Hatch', icon: Car, href: '/carros/hatch' },
  { label: 'Picape', icon: Car, href: '/carros/pickup' },
  { label: 'Elétrico', icon: Zap, href: '/carros/eletrico' },
  { label: 'Até R$ 50k', icon: Tag, href: '/carros/ate-50-mil' },
]

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: 'Verificado de ponta a ponta',
    description: 'Histórico veicular, dados FIPE e informações técnicas validadas antes de cada anúncio.',
  },
  {
    icon: TrendingDown,
    title: 'Preço justo, sempre',
    description: 'Compare com a Tabela FIPE em tempo real e identifique oportunidades reais em segundos.',
  },
  {
    icon: Sparkles,
    title: 'Experiência sem ruído',
    description: 'Sem ligações insistentes, sem spam. Você conversa quando e como quiser, direto com o vendedor.',
  },
]

export default async function HomePage() {
  const cars = await getAllCars()
  const latestListings = await getLatestPublicListings(12)
  const discovery = await getMarketplaceDiscoverySections()
  const brands = [...new Set(cars.map((c) => c.brand))].sort().slice(0, 12)

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 text-[13px] font-medium text-[#525252]">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
              <span>Marketplace automotivo premium do Brasil</span>
            </div>
            <h1 className="text-balance mb-6">
              Encontre o carro certo,<br />
              <span className="text-[#525252]">pelo preço justo.</span>
            </h1>
            <p className="body-large text-[#525252] max-w-xl mx-auto mb-10 text-pretty">
              Milhares de anúncios verificados, dados reais de mercado e a ferramenta mais refinada para decidir sua próxima compra.
            </p>
            <HeroSearchBar />
          </div>

          {/* Quick Filters */}
          <div className="mt-12 -mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 max-w-3xl mx-auto justify-start md:justify-center">
              {QUICK_FILTERS.map((f) => {
                const Icon = f.icon
                return (
                  <Link
                    key={f.label}
                    href={f.href}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FAFAF9] border border-[#EAEAE8] text-[14px] font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A] transition-all shrink-0"
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                    {f.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section className="py-20 md:py-28 bg-[#FAFAF9]">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow mb-2">Novidades</p>
              <h2 className="text-balance">Recém-anunciados</h2>
            </div>
            <Link href="/carros-a-venda" className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0A0A0A] hover:opacity-70 transition-opacity">
              Ver todos <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>

          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {latestListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#EAEAE8] rounded-2xl p-16 text-center">
              <p className="text-[#525252] font-medium mb-5">Ainda não há anúncios ativos.</p>
              <Link href="/anunciar-carro" className="btn btn-primary">
                Anunciar meu carro <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/carros-a-venda" className="btn btn-secondary">
              Ver todos <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="eyebrow mb-3">Por que carbi</p>
            <h2 className="text-balance">Decisões inteligentes começam com dados reais.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[#EAEAE8] border border-[#EAEAE8] rounded-2xl overflow-hidden">
            {VALUE_PROPS.map((prop) => {
              const Icon = prop.icon
              return (
                <div key={prop.title} className="bg-white p-8 md:p-10">
                  <Icon className="w-6 h-6 text-[#0A0A0A] mb-6" strokeWidth={1.75} />
                  <h3 className="text-[18px] font-semibold text-[#0A0A0A] mb-2 tracking-tight">
                    {prop.title}
                  </h3>
                  <p className="text-[15px] text-[#525252] leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRICE DROPS ── */}
      {discovery.reduced.length > 0 && (
        <section className="py-20 md:py-28 bg-[#FAFAF9]">
          <div className="container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="eyebrow mb-2 text-[#10B981]">Oportunidades</p>
                <h2 className="text-balance">Baixaram de preço</h2>
              </div>
              <Link href="/carros/mais-baratos" className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0A0A0A] hover:opacity-70 transition-opacity">
                Ver todos <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {discovery.reduced.slice(0, 4).map((listing) => (
                <ListingCard key={`drop-${listing.id}`} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BRANDS ── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow mb-2">Marcas</p>
              <h2 className="text-balance">Navegue por marca</h2>
            </div>
            <Link href="/marcas" className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0A0A0A] hover:opacity-70 transition-opacity">
              Ver todas <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {brands.map((brand) => {
              const slug = brand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link
                  key={brand}
                  href={`/marcas/${slug}`}
                  className="bg-white border border-[#EAEAE8] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-[#0A0A0A] transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    <BrandLogo brandName={brand} domain={`${slug}.com`} className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[12px] font-medium text-[#525252] group-hover:text-[#0A0A0A] transition-colors">{brand}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SELL ── */}
      <section className="py-20 md:py-28 bg-[#0A0A0A] text-white">
        <div className="container">
          <div className="max-w-3xl">
            <p className="eyebrow text-white/50 mb-4">Vender</p>
            <h2 className="text-white text-balance mb-6">
              Venda seu carro<br />
              com atrito zero.
            </h2>
            <p className="body-large text-white/70 max-w-xl mb-10 text-pretty">
              Publique seu anúncio na plataforma mais moderna do Brasil em menos de 2 minutos. Gratuito, rápido e 100% seguro.
            </p>
            <Link
              href="/anunciar-carro"
              className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] hover:bg-white/90 transition-colors rounded-full min-h-[52px] px-7 text-[15px] font-medium"
            >
              Anunciar agora <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  )
}
