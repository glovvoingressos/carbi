import Link from 'next/link'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight, Sparkles,
  ShoppingBag, Tag, PlusCircle
} from 'lucide-react'
import FAQSection from '@/components/layout/FAQSection'
import BrandLogo from '@/components/brand/BrandLogo'
import ListingCard from '@/components/marketplace/ListingCard'
import { getLatestPublicListings, getMarketplaceDiscoverySections } from '@/lib/marketplace-server'
import { getAllCars } from '@/lib/data-fetcher'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const cars = await getAllCars()
  const latestListings = await getLatestPublicListings(12)
  const discovery = await getMarketplaceDiscoverySections()
  const brands = [...new Set(cars.map((c) => c.brand))].sort().slice(0, 8)

  return (
    <main className="bg-[#F7F8FA] min-h-screen pt-20">
      {/* ── HERO SECTION ── */}
      <section className="pt-20 pb-16 px-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-blue-50 to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-violet-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-black/5 px-4 py-2 rounded-full mb-8 animate-slide-up shadow-sm">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/60">O Marketplace Premium</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-black text-dark tracking-tighter leading-[1.05] mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Encontre o carro ideal,<br />
            pelo <span className="text-gradient">preço justo.</span>
          </h1>
          
          <div className="max-w-3xl mx-auto mb-16 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <HeroSearchBar />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {['Até 50k', 'SUVs', 'Elétricos', 'Picapes'].map(label => (
                <Link 
                  key={label}
                  href={`/carros-a-venda?q=${label}`}
                  className="px-5 py-2 bg-white border border-black/5 rounded-full text-xs font-bold text-dark/60 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link href="/carros-a-venda" className="bg-white p-8 rounded-[32px] border border-black/5 flex flex-col items-center gap-4 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-all group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-bold text-xl text-dark">Comprar</p>
                <p className="text-sm font-medium text-dark/50 mt-1">Explore {latestListings.length}+ anúncios</p>
              </div>
            </Link>
            
            <Link href="/anunciar-carro" className="bg-white p-8 rounded-[32px] border border-black/5 flex flex-col items-center gap-4 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-all group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 shadow-sm">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-bold text-xl text-dark">Vender</p>
                <p className="text-sm font-medium text-dark/50 mt-1">Anuncie grátis em minutos</p>
              </div>
            </Link>


          </div>
        </div>
      </section>

      {/* ── LATEST LISTINGS ── */}
      <section className="py-20 md:py-32 bg-white relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Novidades no feed</p>
              <h2 className="text-4xl md:text-5xl font-heading font-black text-dark tracking-tighter">Recém anunciados</h2>
            </div>
            <Link href="/carros-a-venda" className="flex items-center gap-2 text-sm font-bold text-dark/60 hover:text-blue-600 bg-[#F7F8FA] px-6 py-3 rounded-full hover:bg-blue-50 transition-colors shrink-0">
              Ver marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {latestListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-[#F7F8FA] rounded-[32px] p-16 text-center border border-black/5">
              <p className="text-dark/50 font-medium text-lg mb-6">Ainda não há anúncios ativos na sua região.</p>
              <Link href="/anunciar-carro" className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold inline-flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                Seja o primeiro a anunciar <PlusCircle className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── PRICE DROPS ── */}
      {discovery.reduced.length > 0 && (
        <section className="py-20 md:py-32">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">Grandes Oportunidades</p>
                <h2 className="text-4xl md:text-5xl font-heading font-black text-dark tracking-tighter">Baixaram de preço</h2>
              </div>
              <Link href="/carros/mais-baratos" className="flex items-center gap-2 text-sm font-bold text-dark/60 hover:text-emerald-600 bg-white border border-black/5 px-6 py-3 rounded-full hover:bg-emerald-50 transition-colors shrink-0 shadow-sm">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {discovery.reduced.slice(0, 4).map((listing) => (
                <ListingCard key={`drop-${listing.id}`} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BRANDS ── */}
      <section className="py-24 md:py-32">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/40 mb-10">Navegue pelas principais marcas</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
            {brands.map(brand => {
              const slug = brand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link 
                  key={brand}
                  href={`/marcas/${slug}`}
                  className="bg-white p-6 rounded-3xl border border-black/5 flex flex-col items-center justify-center gap-4 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-all group"
                >
                  <div className="w-12 h-12 bg-[#F7F8FA] rounded-2xl flex items-center justify-center p-2 group-hover:bg-blue-50 transition-colors">
                    <BrandLogo brandName={brand} domain={`${slug}.com`} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-dark group-hover:text-blue-600 transition-colors">{brand}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SELL ── */}
      <section className="py-24 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[40px] md:rounded-[64px] p-12 md:p-24 text-center relative overflow-hidden group shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
            {/* Modern Glow Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-blue-500/30 transition-colors duration-1000 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            
            {/* Abstract Decorative Elements */}
            <div className="absolute top-16 left-16 opacity-20 pointer-events-none">
              <Sparkles className="w-16 h-16 text-blue-400 rotate-12" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-heading font-black text-white tracking-tighter leading-[1.05] mb-8">
                Venda seu carro<br />
                com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">atrito zero.</span>
              </h2>
              <p className="text-white/60 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                Publique seu anúncio na plataforma mais moderna do Brasil em menos de 2 minutos. É gratuito, rápido e 100% seguro.
              </p>
              <Link 
                href="/anunciar-carro" 
                className="bg-white text-dark h-16 md:h-20 px-10 md:px-14 rounded-full font-bold text-base md:text-lg uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all inline-flex items-center gap-3"
              >
                Anunciar agora <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </main>
  )
}
