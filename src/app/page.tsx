import Link from 'next/link'
import CarCard from '@/components/car/CarCard'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight, ArrowUpRight,
  ChevronRight, Sparkles, BrainCircuit
} from 'lucide-react'
import { getAllCars } from '@/lib/data-fetcher'
import FAQSection from '@/components/layout/FAQSection'
import HomeComparison from '@/components/home/HomeComparison'
import BrandLogo from '@/components/brand/BrandLogo'
import ListingCard from '@/components/marketplace/ListingCard'
import { getLatestPublicListings, getMarketplaceDiscoverySections } from '@/lib/marketplace-server'
import { QUICK_LINKS } from '@/lib/marketplace-seo'

// ── Dados estáticos ─────────────────────────────────────────────────────────

const FILTER_CHIPS = [
  { id: 'todos',    label: 'Todos' },
  { id: 'suv',      label: 'SUV' },
  { id: 'hatch',    label: 'Hatch' },
  { id: 'sedan',    label: 'Sedan' },
  { id: 'picape',   label: 'Picape' },
  { id: 'eletrico', label: 'Elétrico' },
]

const REVIEWS = []

const LOGO_MAP: Record<string, string> = {
  Toyota:     'https://www.carlogos.org/car-logos/toyota-logo.png',
  Honda:      'https://www.carlogos.org/car-logos/honda-logo.png',
  Fiat:       'https://www.carlogos.org/car-logos/fiat-logo.png',
  Volkswagen: 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  Chevrolet:  'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  Ford:       'https://www.carlogos.org/car-logos/ford-logo.png',
  Hyundai:    'https://www.carlogos.org/car-logos/hyundai-logo.png',
  Jeep:       'https://www.carlogos.org/car-logos/jeep-logo.png',
  Nissan:     'https://www.carlogos.org/car-logos/nissan-logo.png',
  Peugeot:    'https://www.carlogos.org/car-logos/peugeot-logo.png',
  Renault:    'https://www.carlogos.org/car-logos/renault-logo.png',
  BYD:        'https://www.carlogos.org/car-logos/byd-logo.png',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatK(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'k'
  return n.toString()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOMEPAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default async function HomePage() {
  const cars   = await getAllCars()
  const latestListings = await getLatestPublicListings(12)
  const discovery = await getMarketplaceDiscoverySections()
  const recentListings = latestListings.slice(0, 8)
  const popular = cars.filter((c) => c.isPopular || c.priceBrl > 0).slice(0, 12)
  const electricCars = cars.filter((c) => c.segment === 'electric').slice(0, 8)
  const brands  = [...new Set(cars.map((c) => c.brand))].sort()
  const featured = cars.find((c) => c.isPopular && c.image && c.priceBrl > 100_000) || cars[0]
  const avgPrice = Math.round(cars.reduce((a, b) => a + b.priceBrl, 0) / cars.length)

  return (
    <main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 1.5 — BENTO GRID FEATURES
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'var(--color-bg)', paddingTop: 'clamp(80px, 10vh, 120px)', paddingBottom: 'clamp(48px, 6vh, 80px)' }}>
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
             

             {/* BENTO 2: White Large Card (Valor atualizado) */}
             <div className="md:col-span-12 lg:col-span-8 pastel-card pastel-card-blue rounded-[32px] p-6 sm:p-8 lg:p-12 flex flex-col items-start justify-between relative overflow-hidden">
                <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-surface z-10">2</span>
                
                {/* Abstract Visual representation of a toggle/chart */}
                <div className="absolute right-8 top-8 lg:right-16 lg:top-16 opacity-20 lg:opacity-100 pointer-events-none">
                    <div className="w-48 h-24 bg-surface rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-16 h-8 bg-dark rounded-full p-1 relative">
                            <div className="w-6 h-6 bg-[var(--color-bento-yellow)] rounded-full absolute right-1"></div>
                        </div>
                        <p className="text-xs font-bold font-mono">Price Track</p>
                    </div>
                </div>

                <div className="mt-16 lg:mt-32 max-w-md z-10">
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-dark mb-4">Planeje a compra com valor atualizado</h3>
                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-xs font-bold uppercase tracking-widest min-w-[48px] bg-[var(--color-bento-yellow)] px-3 py-1 rounded-[12px] text-dark">Lançamento</span>
                        <p className="text-text-secondary font-medium text-lg leading-relaxed">Avalie o histórico de desvalorização e tome a decisão financeira correta instantaneamente.</p>
                    </div>
                </div>
             </div>

             {/* BENTO 3: Abstract Image Card (Red) */}
             <div className="md:col-span-12 lg:col-span-4 bg-[var(--color-bento-red)] rounded-[32px] p-6 sm:p-8 lg:p-12 flex flex-col justify-end gap-4 overflow-hidden relative text-white text-left min-h-[210px] sm:min-h-[260px]">
                  <h3 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold z-10 relative max-w-[320px]">
                      Compare qualquer carro lado a lado
                  </h3>
                  <p className="text-white/90 font-semibold leading-relaxed text-base sm:text-lg max-w-[310px] z-10 relative">Faça as melhores escolhas com base científica e sem achismos durante a pesquisa.</p>
                  <div className="absolute top-5 right-5 z-0 opacity-20">
                    <ArrowUpRight className="w-24 h-24 sm:w-16 sm:h-16" strokeWidth={1.6} />
                  </div>
                  {/* Decorative wave */}
                  <svg className="absolute bottom-[-36%] right-[-28%] w-[140%] opacity-10 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                     <path fill="#000000" d="M42.7,-73.4C55.9,-67.8,67.6,-58.2,76.6,-46.3C85.5,-34.4,91.8,-20.3,92.5,-6.1C93.2,8.2,88.4,22.6,80.7,35C73,47.5,62.3,58.1,50.1,65.6C37.8,73.1,23.9,77.5,10.2,78.2C-3.6,78.8,-17.1,75.8,-29.4,69.5C-41.6,63.1,-52.6,53.5,-61.2,42.1C-69.8,30.6,-76.1,17.4,-77.9,3.7C-79.7,-10,-77,-24.2,-70.6,-36.5C-64.2,-48.8,-54.1,-59,-42.2,-64.7C-30.3,-70.5,-16.7,-71.8,-1.9,-68.8C12.9,-65.8,29.5,-79.1,42.7,-73.4Z" transform="translate(100 100)" />
                  </svg>
             </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 1.7 — SEARCH BAR (Relocated Below Grid)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="pb-16 pt-8">
        <div className="container max-w-3xl mx-auto px-4 text-center">
           <HeroSearchBar />
           <p className="text-sm font-bold text-text-secondary mt-4">
              {cars.length}+ veículos listados em tempo real na Carbi
           </p>
        </div>
      </section>

      <section className="pb-14">
        <div className="container">
          <div
            className="announce-card pastel-card rounded-[32px] p-7 sm:p-10 overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #d4ef7d 0%, #cdee63 100%)' }}
          >
            <div className="announce-glow pointer-events-none absolute -left-24 top-0 h-full w-24 bg-white/25 blur-xl" />
            <div className="grid grid-cols-1 items-center">
              <div className="max-w-3xl">
                <h2 data-announce-line className="text-[32px] sm:text-[42px] leading-[1.05] font-extrabold text-dark mt-1">Anuncie seu carro em minutos</h2>
                <p data-announce-line className="mt-3 text-xs sm:text-sm font-semibold text-dark/65">Leva menos de 2 minutos. Após clicar, você preenche e publica seu anúncio de carro com suporte ao Preço FIPE.</p>
                <Link
                  href="/anunciar-carro-bh"
                  data-announce-line
                  className="announce-cta mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0_#000] hover:-translate-y-1 transition-all w-full sm:w-auto"
                  style={{
                    backgroundColor: '#0f0f0f',
                    border: '2px solid #0f0f0f',
                    color: '#ffffff',
                  }}
                >
                  Começar anúncio grátis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-8 sm:pt-10 pb-16">
        <div className="container">
          {latestListings.length > 0 ? (
            <div className="space-y-6">
              <div className="mb-1 flex items-end justify-between">
                <div className="-mt-1.5 sm:-mt-2">
                  <p className="text-eyebrow">Marketplace</p>
                  <h2 className="text-h2">Carros anunciados agora</h2>
                </div>
                <Link href="/carros-a-venda" className="text-sm font-bold text-text-secondary hover:text-dark">
                  Ver todos
                </Link>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="pastel-card pastel-card-green p-6 sm:p-8"
              style={{ background: 'linear-gradient(135deg, #e9f7ee 0%, #f0fbf4 100%)' }}
            >
              <p className="text-sm font-semibold text-text-secondary">Ainda não há anúncios ativos.</p>
              <p className="mt-1 text-lg font-black text-dark">Seja o primeiro a publicar e ganhar destaque na home.</p>
              <Link
                href="/anunciar-carro-bh"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-dark px-5 py-2.5 text-sm font-black text-white"
              >
                Anunciar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {discovery.latest.length > 0 ? (
        <section className="pb-16">
          <div className="container space-y-10">
            <div className="pastel-card pastel-card-lilac p-6 sm:p-8">
              <p className="text-eyebrow">Explorar anúncios</p>
              <h2 className="text-h2">Descubra por preço, categoria e novidades</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-wide text-dark"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {discovery.reduced.length > 0 ? (
              <div>
                <div className="mb-3 flex items-end justify-between">
                  <h3 className="text-xl font-black text-dark">Baixaram o preço</h3>
                  <Link href="/carros/mais-baratos" className="text-sm font-bold text-text-secondary">Ver mais</Link>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {discovery.reduced.slice(0, 8).map((listing) => (
                    <ListingCard key={`drop-${listing.id}`} listing={listing} />
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </section>
      ) : null}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 3 — FILTER CHIPS (sticky)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          position: 'relative',
          zIndex: 90,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          paddingBlock: 12,
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 2,
              scrollbarWidth: 'none',
            }}
          >
            {FILTER_CHIPS.map((chip, i) => (
              <Link
                key={chip.id}
                href={chip.id === 'todos' ? '/rankings' : `/rankings?segment=${chip.id}`}
                className={`chip${chip.id === 'todos' ? ' active' : ''}`}
                style={{ fontSize: 13 }}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 4 — GRID DE VEÍCULOS
          3 col desktop · 2 tablet · 1 mobile
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="container">

          {/* Cabeçalho da seção */}
          <div
            className="scroll-reveal"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 32,
            }}
          >
            <div>
              <p className="text-eyebrow" style={{ marginBottom: 8 }}>Catálogo</p>
              <h2 className="text-h2">Mais buscados</h2>
            </div>
            <Link
              href="/rankings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-2)',
              }}
            >
              Ver todos <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {popular.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>

          {/* CTA ver mais */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/rankings" className="btn btn-outline" style={{ height: 48, fontSize: 14 }}>
              Ver todos os {cars.length} veículos
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 4.1 — ESCOLHAS SUSTENTÁVEIS (Elétricos)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {electricCars.length > 0 && (
        <section style={{ paddingBottom: 64 }}>
          <div className="container">
            <div
              className="scroll-reveal"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <div>
                <p className="text-eyebrow" style={{ color: 'var(--color-accent)', marginBottom: 8 }}>Inovação</p>
                <h2 className="text-h2">Mobilidade Elétrica</h2>
              </div>
              <Link
                href="/rankings?segment=electric"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-2)',
                }}
              >
                Ver todos os elétricos <ChevronRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {electricCars.map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 6 — MARCAS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: 'clamp(48px, 7vh, 80px)' }}>
        <div className="container">
          <div
            className="scroll-reveal"
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}
          >
            <div>
              <p className="text-eyebrow" style={{ marginBottom: 8 }}>Fabricantes</p>
              <h2 className="text-h2">Explore por marca</h2>
            </div>
            <Link href="/marcas" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todas <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 16,
              scrollbarWidth: 'none',
              paddingLeft: 4, // prevent clipping
            }}
          >
            {brands.slice(0, 12).map((brand) => {
              const count = cars.filter((c) => c.brand === brand).length
              const slug = brand.toLowerCase().replace(/\s+/g, '-')

              // Domain mapping function inline
              const getDomain = (b: string) => {
                const map: Record<string, string> = {
                  'bmw': 'bmw.com',
                  'toyota': 'toyota.com',
                  'honda': 'honda.com',
                  'fiat': 'fiat.com.br',
                  'chevrolet': 'chevrolet.com',
                  'volkswagen': 'vw.com',
                  'vw': 'vw.com',
                  'peugeot': 'peugeot.com',
                  'renault': 'renault.com.br',
                  'nissan': 'nissan.com',
                  'hyundai': 'hyundai.com',
                  'caoa chery': 'caoachery.com.br',
                  'jeep': 'jeep.com',
                  'ford': 'ford.com',
                  'audi': 'audi.com',
                  'porsche': 'porsche.com',
                  'mini': 'mini.com',
                  'byd': 'byd.com',
                  'gwm': 'gwmbrasil.com.br',
                  'ram': 'ram.com',
                  'citroen': 'citroen.com',
                }
                return map[b.toLowerCase()] || `${b.toLowerCase().replace(/\s+/g, '')}.com`
              }

              return (
                <Link
                  key={brand}
                  href={`/marcas/${slug}`}
                  className="flex-shrink-0 group relative rounded-3xl p-5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center min-w-[140px] select-none"
                  style={{
                    backgroundColor: '#f5f5f7',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div 
                     className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 p-1.5"
                     style={{
                       backgroundColor: '#ffffff',
                       border: '1px solid rgba(15, 23, 42, 0.08)',
                       boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                     }}
                  >
                     <BrandLogo 
                       brandName={brand} 
                       domain={getDomain(brand)} 
                       className="w-full h-full object-contain filter mix-blend-multiply" 
                     />
                  </div>
                  <p className="text-[13px] font-black text-dark tracking-tight uppercase text-center w-full truncate">{brand}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-dark/40 mt-1">{count} modelo{count !== 1 ? 's' : ''}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 7 — COMPARATIVO INTERATIVO carbi
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <HomeComparison />


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 9 — FOOTER CTA FINAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          paddingBlock: 'clamp(56px, 8vh, 96px)',
          background: 'var(--color-bg)',
          textAlign: 'center',
        }}
      >
        <div className="container max-w-4xl">
          <div
            className="pastel-card pastel-card-blue rounded-[36px] p-7 sm:p-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(140deg, #d6f53d 0%, #c9ef2e 55%, #bee51f 100%)' }}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/35 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 bottom-2 h-28 w-28 rounded-full bg-white/30 blur-2xl" />
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="anime-float inline-flex items-center gap-1 rounded-full bg-[var(--color-bento-yellow)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.09em] text-dark">
                <Sparkles className="h-3.5 w-3.5" />
                IA carbi
              </span>
              <span className="anime-float inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e6509f] text-white">
                <BrainCircuit className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="text-eyebrow scroll-reveal" style={{ marginBottom: 14 }}>Pronto para decidir?</p>
          <h2
            className="text-h2 scroll-reveal sr-delay-1"
            style={{ maxWidth: 480, marginInline: 'auto', marginBottom: 12 }}
          >
            Use nossa IA e encontre os modelos ideais para você.
          </h2>
          <p
            className="scroll-reveal sr-delay-2"
            style={{
              fontSize: 15,
              color: 'rgba(10, 10, 10, 0.68)',
              maxWidth: 380,
              marginInline: 'auto',
              marginBottom: 36,
              lineHeight: 1.65,
            }}
          >
            A IA da carbi cruza preço, perfil e uso para sugerir os modelos certos em segundos.
          </p>
          <div className="scroll-reveal sr-delay-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/qual-carro"
              className="btn btn-primary"
              style={{
                height: 52,
                fontSize: 15,
                background: '#0A0A0A',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px rgba(10, 10, 10, 0.22)',
              }}
            >
              Encontrar meu carro
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link
              href="/rankings"
              className="btn btn-outline"
              style={{
                height: 52,
                fontSize: 15,
                background: '#FFFFFF',
                color: '#0A0A0A',
                border: '1.5px solid rgba(10, 10, 10, 0.14)',
              }}
            >
              Explorar catálogo
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § FAQ SECTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FAQSection />

    </main>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CSS específico desta página (injected via style tag)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
// Desktop hero grid: 2 colunas lado a lado
// Injetado via <style> no global ou tailwind config
// O grid responsivo está inline via auto-fill minmax
