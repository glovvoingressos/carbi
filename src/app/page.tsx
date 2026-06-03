import Link from 'next/link'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight, Sparkles, ShoppingBag, Tag, PlusCircle, Car, ShieldCheck, TrendingDown, Fuel, Gauge
} from 'lucide-react'
import FAQSection from '@/components/layout/FAQSection'
import BrandLogo from '@/components/brand/BrandLogo'
import ListingCard from '@/components/marketplace/ListingCard'
import { getLatestPublicListings, getMarketplaceDiscoverySections } from '@/lib/marketplace-server'
import { getAllCars } from '@/lib/data-fetcher'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  { label: 'SUV', icon: Car, href: '/carros-a-venda?q=SUV', color: 'bg-accent-light text-accent' },
  { label: 'Hatch', icon: Car, href: '/carros-a-venda?q=Hatch', color: 'bg-gold-bg text-gold' },
  { label: 'Sedan', icon: Car, href: '/carros-a-venda?q=Sedan', color: 'bg-accent-light text-accent' },
  { label: 'Picape', icon: Car, href: '/carros-a-venda?q=Picape', color: 'bg-gold-bg text-gold' },
  { label: 'Elétrico', icon: Fuel, href: '/carros-a-venda?q=Elétrico', color: 'bg-accent-light text-accent' },
  { label: 'Até R$ 50k', icon: Tag, href: '/carros-a-venda?q=Até+R$+50k', color: 'bg-gold-bg text-gold' },
]

export default async function HomePage() {
  const cars = await getAllCars()
  const latestListings = await getLatestPublicListings(12)
  const discovery = await getMarketplaceDiscoverySections()
  const brands = [...new Set(cars.map((c) => c.brand))].sort().slice(0, 8)

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-accent px-4 py-1.5 rounded-full mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/95">Marketplace Premium</span>
            </div>
            <h1 className="mb-4">
              Encontre o carro ideal,<br />
              pelo <span className="text-text-primary font-bold">preço justo.</span>
            </h1>
            <p className="body-large text-text-secondary max-w-xl mx-auto mb-8">
              Milhares de anúncios verificados com dados reais de mercado. Compare, negocie e decida com confiança.
            </p>
            <HeroSearchBar />
          </div>
 
          {/* Quick Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 max-w-3xl mx-auto justify-center">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white text-sm font-medium text-text-secondary hover:bg-accent hover:text-white hover:border-transparent transition-all shrink-0`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section className="section-pad bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="label text-accent mb-2">Novidades</p>
              <h2>Rec&eacute;m anunciados</h2>
            </div>
            <Link
              href="/carros-a-venda"
              className="btn btn-ghost btn-sm hidden sm:inline-flex"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {latestListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-text-secondary font-medium mb-4">Ainda não há anúncios ativos.</p>
              <Link href="/anunciar-carro" className="btn btn-primary inline-flex">
                <PlusCircle className="w-4 h-4" /> Seja o primeiro a anunciar
              </Link>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/carros-a-venda" className="btn btn-secondary btn-sm inline-flex">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICE DROPS ── */}
      {discovery.reduced.length > 0 && (
        <section className="section-pad">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="label text-success mb-2">Oportunidades</p>
                <h2>Baixaram de pre&ccedil;o</h2>
              </div>
              <Link
                href="/carros/mais-baratos"
                className="btn btn-ghost btn-sm hidden sm:inline-flex"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {discovery.reduced.slice(0, 4).map((listing) => (
                <ListingCard key={`drop-${listing.id}`} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── VALUE PROPS ── */}
      <section className="section-pad bg-white border-y border-border">
        <div className="container">
          <div className="text-center mb-10">
            <p className="label text-accent mb-2">Por que carbi?</p>
            <h2>A plataforma premium<br className="sm:hidden" /> para decidir com dados</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-elevated p-8 text-center">
              <div className="w-12 h-12 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Dados Reais</h3>
              <p className="text-sm text-text-secondary">Informa&ccedil;&otilde;es t&eacute;cnicas e valores baseados na Tabela FIPE e fontes oficiais.</p>
            </div>
            <div className="card-elevated p-8 text-center">
              <div className="w-12 h-12 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-5">
                <TrendingDown className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Sem An&uacute;ncios</h3>
              <p className="text-sm text-text-secondary">Experi&ecirc;ncia limpa e focada no que realmente importa: o pr&oacute;ximo carro.</p>
            </div>
            <div className="card-elevated p-8 text-center">
              <div className="w-12 h-12 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Atualizado Hoje</h3>
              <p className="text-sm text-text-secondary">Dados sincronizados em tempo real com as principais fontes do mercado automotivo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="section-pad">
        <div className="container text-center">
          <p className="label mb-8">Navegue por marca</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {brands.map((brand) => {
              const slug = brand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link
                  key={brand}
                  href={`/marcas/${slug}`}
                  className="card p-5 flex flex-col items-center justify-center gap-3 hover:border-accent-light hover:bg-accent-light/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-bg-alt rounded-xl flex items-center justify-center p-2 group-hover:bg-white transition-colors">
                    <BrandLogo brandName={brand} domain={`${slug}.com`} className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-semibold text-text-tertiary group-hover:text-accent transition-colors">{brand}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SELL ── */}
      <section className="section-pad px-4">
        <div className="container">
          <div className="bg-accent rounded-3xl md:rounded-[40px] p-10 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-white mb-4">
                Venda seu carro<br />
                com <span className="text-white underline decoration-white/20 underline-offset-4">atrito zero.</span>
              </h2>
              <p className="body-large text-white/60 max-w-lg mx-auto mb-8">
                Publique seu an&uacute;ncio na plataforma mais moderna do Brasil em menos de 2 minutos. &Eacute; gratuito, r&aacute;pido e 100% seguro.
              </p>
              <Link
                href="/anunciar-carro"
                className="btn btn-lg bg-white text-text-primary hover:bg-white/90 inline-flex"
              >
                Anunciar agora <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  )
}
