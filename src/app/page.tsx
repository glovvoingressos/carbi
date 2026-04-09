import Link from 'next/link'
import { formatBRL } from '@/data/cars'
import CarCard from '@/components/car/CarCard'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight, ArrowUpRight, Star,
  ChevronRight, CheckCircle2, Zap, Fuel, Users
} from 'lucide-react'
import { getAllCars } from '@/lib/data-fetcher'
import FAQSection from '@/components/layout/FAQSection'

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
  const popular = cars.filter((c) => c.isPopular || c.priceBrl > 0).slice(0, 12)
  const electricCars = cars.filter((c) => c.segment === 'electric').slice(0, 8)
  const brands  = [...new Set(cars.map((c) => c.brand))].sort()
  const featured = cars.find((c) => c.isPopular && c.image && c.priceBrl > 100_000) || cars[0]
  const avgPrice = Math.round(cars.reduce((a, b) => a + b.priceBrl, 0) / cars.length)

  const trustMetrics = [
    { value: `${cars.length}+`,          label: 'Fichas catalogadas' },
    { value: `${brands.length}`,         label: 'Marcas disponíveis' },
    { value: '100%',                      label: 'Dados Oficiais' },
    { value: 'Expert',                    label: 'Avaliação Média' },
  ]

  return (
    <main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 1.5 — BENTO GRID FEATURES
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'var(--color-bg)', paddingBottom: 'clamp(48px, 6vh, 80px)' }}>
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 auto-rows-[minmax(320px,auto)]">
             
             {/* BENTO 1: FEATURED HERO PHRASE (Lime/Yellow) */}
             <div className="md:col-span-12 bg-[var(--color-bento-yellow)] rounded-[32px] p-10 md:p-16 flex flex-col items-center justify-center shadow-sm relative overflow-hidden text-center min-h-[400px]">
                  <h1 className="text-hero mx-auto" style={{ maxWidth: '100%', marginBottom: 0 }}>
                    A ferramenta que ajuda <span className="inline-block translate-y-[2px] mx-1">👥</span> você a descobrir <span className="inline-block translate-y-[2px] mx-1">🚗</span> o carro ideal, consultar a <span className="inline-block translate-y-[2px] mx-1">💸</span> tabela FIPE e fazer a <span className="inline-block translate-y-[2px] mx-1">🎯</span> melhor escolha <span className="inline-block translate-y-[2px] mx-1">📝</span>
                  </h1>
             </div>

             {/* BENTO 2: White Large Card (FIPE) */}
             <div className="md:col-span-12 lg:col-span-8 bg-white border border-border rounded-[32px] p-8 lg:p-12 flex flex-col items-start justify-between shadow-sm relative overflow-hidden">
                <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-bold text-sm bg-surface z-10">2</span>
                
                {/* Abstract Visual representation of a toggle/chart */}
                <div className="absolute right-8 top-8 lg:right-16 lg:top-16 opacity-20 lg:opacity-100 pointer-events-none">
                    <div className="w-48 h-24 bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-16 h-8 bg-dark rounded-full p-1 relative">
                            <div className="w-6 h-6 bg-[var(--color-bento-yellow)] rounded-full absolute right-1"></div>
                        </div>
                        <p className="text-xs font-bold font-mono">FIPE Track</p>
                    </div>
                </div>

                <div className="mt-16 lg:mt-32 max-w-md z-10">
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-dark mb-4">Planeje a compra com a Tabela FIPE atualizada</h3>
                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-xs font-bold uppercase tracking-widest min-w-[48px] bg-[var(--color-bento-yellow)] px-3 py-1 rounded-[12px] text-dark">Lançamento</span>
                        <p className="text-text-secondary font-medium text-lg leading-relaxed">Avalie o histórico de desvalorização e tome a decisão financeira correta instantaneamente.</p>
                    </div>
                </div>
             </div>

             {/* BENTO 3: Abstract Image Card (Red) */}
             <div className="md:col-span-12 lg:col-span-4 bg-[var(--color-bento-red)] rounded-[32px] p-8 lg:p-12 flex flex-col justify-between overflow-hidden relative text-white text-center md:text-left">
                  <h3 className="text-2xl lg:text-3xl font-extrabold mb-8 z-10 relative">
                      Compare qualquer carro lado a lado
                  </h3>
                  <div className="mt-8 z-10 relative">
                     <p className="text-white/80 font-medium leading-relaxed max-w-[280px] mx-auto md:mx-0">Faça as melhores escolhas com base científica e sem achismos durante a pesquisa.</p>
                  </div>
                  {/* Decorative wave */}
                  <svg className="absolute bottom-[-10%] right-[-10%] w-[120%] opacity-20 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                     <path fill="#000000" d="M42.7,-73.4C55.9,-67.8,67.6,-58.2,76.6,-46.3C85.5,-34.4,91.8,-20.3,92.5,-6.1C93.2,8.2,88.4,22.6,80.7,35C73,47.5,62.3,58.1,50.1,65.6C37.8,73.1,23.9,77.5,10.2,78.2C-3.6,78.8,-17.1,75.8,-29.4,69.5C-41.6,63.1,-52.6,53.5,-61.2,42.1C-69.8,30.6,-76.1,17.4,-77.9,3.7C-79.7,-10,-77,-24.2,-70.6,-36.5C-64.2,-48.8,-54.1,-59,-42.2,-64.7C-30.3,-70.5,-16.7,-71.8,-1.9,-68.8C12.9,-65.8,29.5,-79.1,42.7,-73.4Z" transform="translate(100 100)" />
                  </svg>
             </div>

             {/* BENTO 4: White Small Card (Templates/Catalogue) */}
             <div className="md:col-span-6 lg:col-span-3 bg-white border border-border rounded-[32px] p-8 flex flex-col justify-between shadow-sm">
                <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-sm bg-surface mb-8">4</span>
                <h3 className="text-xl font-extrabold text-dark mb-4">Catálogo completo de modelos atualizados</h3>
                <p className="text-text-secondary font-medium text-sm">Do popular zero km ao sedã premium, todas as informações em um só lugar.</p>
             </div>

             {/* BENTO 5: Abstract Graphic (Blue) */}
             <div className="md:col-span-6 lg:col-span-4 bg-[var(--color-bento-blue)] rounded-[32px] overflow-hidden flex flex-col justify-end min-h-[320px] relative text-white">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-full h-[150%] bg-white/20 rotate-12 blur-3xl"></div>
                  </div>
                  <div className="p-8 z-10">
                     <h3 className="text-2xl font-extrabold mb-2 text-white">Estatísticas Reais</h3>
                     <p className="text-white/80 font-medium text-sm">Foque nos dados concretos esquecendo as métricas de vaidade.</p>
                  </div>
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 3 — FILTER CHIPS (sticky)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          position: 'sticky',
          top: 64,
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

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
              gap: 'clamp(12px, 2vw, 16px)',
            }}
          >
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
                gap: 'clamp(12px, 2vw, 16px)',
              }}
            >
              {electricCars.map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 5 — TRUST STRIP (métricas)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="trust-strip" style={{ paddingBlock: 'clamp(40px, 6vh, 72px)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'clamp(24px, 4vw, 48px)',
              textAlign: 'center',
            }}
          >
            {trustMetrics.map((m, i) => (
              <div key={i} className="scroll-reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                <p
                  style={{
                    fontSize: 'clamp(28px, 4vw, 40px)',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-text)',
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {m.value}
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-3)', fontWeight: 500 }}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none' as const,
            }}
          >
            {brands.slice(0, 12).map((brand) => {
              const count = cars.filter((c) => c.brand === brand).length
              const logo = LOGO_MAP[brand]
              return (
                <Link
                  key={brand}
                  href={`/marcas/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                  className="brand-chip"
                >
                  <div className="brand-chip-logo">
                    {logo ? (
                      <img src={logo} alt={brand} style={{ width: 24, height: 24, objectFit: 'contain', filter: 'grayscale(1)', opacity: 0.7 }} />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-2)' }}>{brand[0]}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{brand}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-3)', fontWeight: 500 }}>{count} modelo{count !== 1 ? 's' : ''}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 7 — COMPARATIVO CTA DARK
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: 'clamp(32px, 5vh, 64px)', background: 'var(--color-bg)' }}>
        <div className="container">
          <div
            className="bento-card-dark scroll-reveal"
            style={{
              borderRadius: 'var(--radius-2xl)',
              padding: 'clamp(32px, 5vw, 56px)',
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decoração de fundo */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                right: -60,
                top: -60,
                width: 320,
                height: 320,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ maxWidth: 540 }}>
              <p className="text-eyebrow" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                Ferramenta de comparação
              </p>
              <h2
                className="font-heading"
                style={{
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  fontWeight: 400,
                  color: '#fff',
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  marginBottom: 16,
                }}
              >
                Em dúvida entre<br />dois carros?
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 400 }}>
                Compare lado a lado com destaque visual de quem vence em cada critério. Motor, segurança, consumo e mais.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
              <Link
                href="/comparar"
                className="cta-dark-primary"
              >
                Comparar agora
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/qual-carro"
                className="cta-dark-secondary"
              >
                Qual carro é pra mim?
              </Link>
            </div>
          </div>
        </div>
      </section>


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
        <div className="container">
          <p className="text-eyebrow scroll-reveal" style={{ marginBottom: 16 }}>Pronto para decidir?</p>
          <h2
            className="text-h2 scroll-reveal sr-delay-1"
            style={{ maxWidth: 480, marginInline: 'auto', marginBottom: 12 }}
          >
            Seu próximo carro começa aqui.
          </h2>
          <p
            className="scroll-reveal sr-delay-2"
            style={{
              fontSize: 15,
              color: 'var(--color-text-2)',
              maxWidth: 380,
              marginInline: 'auto',
              marginBottom: 36,
              lineHeight: 1.65,
            }}
          >
            Use nosso guia personalizado e encontre o veículo que combina com seu estilo e orçamento.
          </p>
          <div className="scroll-reveal sr-delay-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/qual-carro" className="btn btn-primary" style={{ height: 52, fontSize: 15 }}>
              Encontrar meu carro
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/rankings" className="btn btn-outline" style={{ height: 52, fontSize: 15 }}>
              Explorar catálogo
            </Link>
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
