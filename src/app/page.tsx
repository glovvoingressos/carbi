import Link from 'next/link'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight, ArrowUpRight, ArrowLeftRight,
  ChevronRight, Sparkles, BrainCircuit,
  ShoppingBag, Tag, Search, PlusCircle
} from 'lucide-react'
import FAQSection from '@/components/layout/FAQSection'
import HomeComparison from '@/components/home/HomeComparison'
import BrandLogo from '@/components/brand/BrandLogo'
import ListingCard from '@/components/marketplace/ListingCard'
import { getLatestPublicListings, getMarketplaceDiscoverySections } from '@/lib/marketplace-server'
import { QUICK_LINKS } from '@/lib/marketplace-seo'
import { getAllCars } from '@/lib/data-fetcher'

const LOGO_MAP: Record<string, string> = {
  Toyota:     'https://www.carlogos.org/car-logos/toyota-logo.png',
  Honda:      'https://www.carlogos.org/car-logos/honda-logo.png',
  Fiat:       'https://www.carlogos.org/car-logos/fiat-logo.png',
  Volkswagen: 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  Chevrolet:  'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  Hyundai:    'https://www.carlogos.org/car-logos/hyundai-logo.png',
  Jeep:       'https://www.carlogos.org/car-logos/jeep-logo.png',
  BYD:        'https://www.carlogos.org/car-logos/byd-logo.png',
}

export default async function HomePage() {
  const cars = await getAllCars()
  const latestListings = await getLatestPublicListings(12)
  const discovery = await getMarketplaceDiscoverySections()
  const brands = [...new Set(cars.map((c) => c.brand))].sort().slice(0, 8)

  return (
    <main className="bg-[#f5f5f3] min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="pt-32 pb-16 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/50 border border-black/5 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 bg-dark rounded-full animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/40">Marketplace de Confiança</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black text-dark tracking-[-0.04em] leading-[0.95] mb-8">
            Encontre o carro ideal,<br />
            pelo preço justo.
          </h1>
          
          <div className="max-w-3xl mx-auto mb-12">
            <HeroSearchBar />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {['Até 50k', 'SUVs', 'Elétricos', 'Picapes'].map(label => (
                <Link 
                  key={label}
                  href={`/carros-a-venda?q=${label}`}
                  className="px-5 py-2 bg-white border border-black/5 rounded-full text-xs font-bold text-dark/60 hover:text-dark hover:border-black/10 transition-all shadow-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link href="/carros-a-venda" className="bg-white p-8 rounded-[32px] border border-black/5 flex flex-col items-center gap-4 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 bg-[#f5f5f3] rounded-2xl flex items-center justify-center group-hover:bg-dark group-hover:text-white transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-dark">Comprar</p>
                <p className="text-xs text-dark/40">Explore {latestListings.length}+ anúncios</p>
              </div>
            </Link>
            
            <Link href="/anunciar-carro-bh" className="bg-white p-8 rounded-[32px] border border-black/5 flex flex-col items-center gap-4 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 bg-[#f5f5f3] rounded-2xl flex items-center justify-center group-hover:bg-dark group-hover:text-white transition-colors">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-dark">Vender</p>
                <p className="text-xs text-dark/40">Anuncie grátis em minutos</p>
              </div>
            </Link>

            <Link href="/comparar" className="bg-white p-8 rounded-[32px] border border-black/5 flex flex-col items-center gap-4 hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 bg-[#f5f5f3] rounded-2xl flex items-center justify-center group-hover:bg-dark group-hover:text-white transition-colors">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-dark">Comparar</p>
                <p className="text-xs text-dark/40">Decisão baseada em dados</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LATEST LISTINGS ── */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/30 mb-2">Novidades no feed</p>
              <h2 className="text-3xl font-black text-dark tracking-tight">Recém anunciados</h2>
            </div>
            <Link href="/carros-a-venda" className="flex items-center gap-2 text-sm font-bold text-dark/40 hover:text-dark transition-colors">
              Ver marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-12 text-center border border-black/5">
              <p className="text-dark/40 font-medium mb-4">Ainda não há anúncios ativos na sua região.</p>
              <Link href="/anunciar-carro-bh" className="bg-dark text-white px-8 py-3 rounded-full font-bold inline-flex items-center gap-2">
                Seja o primeiro a anunciar <PlusCircle className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── PRICE DROPS ── */}
      {discovery.reduced.length > 0 && (
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/30 mb-2">Oportunidades</p>
                <h2 className="text-3xl font-black text-dark tracking-tight">Baixaram de preço</h2>
              </div>
              <Link href="/carros/mais-baratos" className="text-sm font-bold text-dark/40 hover:text-dark transition-colors">
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discovery.reduced.slice(0, 4).map((listing) => (
                <ListingCard key={`drop-${listing.id}`} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── COMPARATOR ── */}
      <section className="py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <HomeComparison />
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/30 mb-8">Navegue pelas principais marcas</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {brands.map(brand => {
              const slug = brand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link 
                  key={brand}
                  href={`/marcas/${slug}`}
                  className="bg-white p-6 rounded-2xl border border-black/5 flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 bg-[#f5f5f3] rounded-xl flex items-center justify-center p-1.5">
                    <BrandLogo brandName={brand} domain={`${slug}.com`} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight text-dark">{brand}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SELL ── */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="bg-dark rounded-[48px] p-12 sm:p-20 text-center relative overflow-hidden group">
            {/* Modern Mesh Gradient Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-blue-500/30 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -ml-48 -mb-48" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
            
            {/* Abstract Decorative Elements */}
            <div className="absolute top-12 left-12 opacity-5 pointer-events-none">
              <Sparkles className="w-24 h-24 text-white rotate-12" />
            </div>
            <div className="absolute bottom-12 right-12 opacity-10 pointer-events-none">
              <Tag className="w-48 h-48 text-white -rotate-12" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                Venda seu carro<br />
                com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">atrito zero.</span>
              </h2>
              <p className="text-white/40 text-xl font-bold mb-12 max-w-lg mx-auto leading-relaxed">
                Publique seu anúncio em menos de 2 minutos. Gratuito, rápido e 100% seguro.
              </p>
              <Link 
                href="/anunciar-carro-bh" 
                className="bg-white text-dark h-20 px-12 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 transition-all inline-flex items-center gap-3 shadow-2xl shadow-white/5"
              >
                Anunciar agora <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </main>
  )
}
