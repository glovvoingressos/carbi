import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, TrendingUp, Plus, BarChart3, ChevronRight, Home, User, CreditCard, ArrowRight, Heart, MapPin, Fuel, Gauge, Calendar } from 'lucide-react'
import { getLatestPublicListings } from '@/lib/marketplace-server'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import { TextRotate } from '@/components/ui/text-rotate'
import { GridPattern } from '@/components/ui/grid-pattern'
import { cn } from '@/lib/utils'
import { GlareCard } from '@/components/ui/glare-card'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
  description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
  keywords: ['anunciar carros grátis', 'seminovos à venda', 'carros à venda', 'anunciar carro', 'vender carro', 'comprar carro', 'tabela fipe'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
  },
}

type Listing = Awaited<ReturnType<typeof getLatestPublicListings>>[number]

function brandInitials(brand: string) {
  return brand
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function fipePercent(listing: Listing) {
  if (typeof listing.fipe_difference_percent !== 'number') return null
  return Math.round(listing.fipe_difference_percent)
}

function CarCard({ listing, index }: { listing: Listing; index: number }) {
  const fipe = fipePercent(listing)
  const isBelowFipe = fipe !== null && fipe <= -3
  const imageUrls = listing.images?.map((img) => img.url) || []

  return (
    <GlareCard className="fingen-car-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <Link
        href={`/anuncios/${listing.slug}`}
        className="fingen-car-card-link"
      >
        <div className="fingen-car-card-image">
          <MarketplaceListingImage
            brand={listing.brand}
            model={listing.model}
            year={listing.year_model}
            imageUrls={imageUrls}
            alt={`${listing.brand} ${listing.model} ${listing.year_model}`}
            className="h-full w-full object-cover"
            priority={index < 4}
          />
          {isBelowFipe && (
            <div className="fingen-car-card-badge">
              <TrendingUp size={10} />
              {Math.abs(fipe!)}% abaixo FIPE
            </div>
          )}
          <button className="fingen-car-card-fav" aria-label="Favoritar">
            <Heart size={16} />
          </button>
        </div>
        <div className="fingen-car-card-body">
          <div className="fingen-car-card-brand">{listing.brand}</div>
          <div className="fingen-car-card-title">
            {listing.model} {listing.year_model}
          </div>
          <div className="fingen-car-card-price">{formatBRL(Number(listing.price))}</div>
          <div className="fingen-car-card-specs">
            <span><Gauge size={12} /> {listing.mileage?.toLocaleString('pt-BR')} km</span>
            <span><Calendar size={12} /> {listing.year_model}</span>
            <span><MapPin size={12} /> {listing.city}</span>
          </div>
        </div>
      </Link>
    </GlareCard>
  )
}

export default async function HomePage() {
  let listings: Listing[] = []
  let fetchError = false

  try {
    listings = await getLatestPublicListings(16)
  } catch {
    fetchError = true
  }

  const recentListings = listings.slice(0, 8)
  const topBrands = [...new Set(listings.map((l) => l.brand))].slice(0, 6)

  // Stats data
  const statsData = [
    { label: 'Jan', value: 30 },
    { label: 'Fev', value: 45 },
    { label: 'Mar', value: 25 },
    { label: 'Abr', value: 60 },
    { label: 'Mai', value: 40 },
    { label: 'Jun', value: 55 },
  ]
  const maxValue = Math.max(...statsData.map((s) => s.value))

  return (
    <div className="fingen-page">
      <main className="fingen-main">
        {/* Hero Section - Fingen Style with Grid Pattern */}
        <section className="fingen-hero">
          {/* Grid Pattern Background */}
          <div className="fingen-hero-grid-wrapper">
            <GridPattern
              width={30}
              height={30}
              x={-1}
              y={-1}
              squares={[
                [4, 4],
                [5, 1],
                [8, 2],
                [5, 3],
                [5, 5],
                [10, 10],
                [12, 15],
                [15, 10],
                [10, 15],
              ]}
              className={cn(
                "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
                "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
                "fingen-hero-grid"
              )}
            />
          </div>

          {/* Balance Card */}
          <div className="fingen-balance-card">
            <div className="fingen-balance-header">
              <div className="fingen-balance-label">Seu próximo carro</div>
              <div className="fingen-balance-actions">
                <Link href="/anunciar-carro" className="fingen-balance-action-btn">
                  <Plus size={16} />
                </Link>
                <Link href="/carros-a-venda" className="fingen-balance-action-btn">
                  <BarChart3 size={16} />
                </Link>
              </div>
            </div>

            {/* Title */}
            <h1 className="fingen-hero-title">
              Encontre o carro
              <br />
              <TextRotate
                texts={[
                  "perfeito.",
                  "ideal.",
                  "dos sonhos.",
                  "certo.",
                  "novo."
                ]}
                mainClassName="fingen-hero-title-accent"
                staggerFrom="last"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={3000}
              />
            </h1>

            <div className="fingen-balance-sub">Compre, compare e anuncie seminovos com FIPE verificado</div>
          </div>

          {/* Quick Actions */}
          <div className="fingen-actions-row">
            <Link href="/carros-a-venda" className="fingen-action-btn">
              <div className="fingen-action-icon">
                <Search size={22} />
              </div>
              <span>Buscar</span>
            </Link>
            <Link href="/anunciar-carro" className="fingen-action-btn">
              <div className="fingen-action-icon">
                <Plus size={22} />
              </div>
              <span>Anunciar</span>
            </Link>
            <Link href="/qual-carro" className="fingen-action-btn">
              <div className="fingen-action-icon">
                <BarChart3 size={22} />
              </div>
              <span>Comparar</span>
            </Link>
          </div>

          {/* CTA Button - Fingen Style */}
          <div className="fingen-cta-wrapper">
            <Link href="/anunciar-carro" className="fingen-cta-main">
              <div className="fingen-cta-icon">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Anunciar carro agora</span>
              <ArrowRight size={18} />
            </Link>
            <div className="fingen-cta-dots">
              <span className="fingen-cta-dot" />
              <span className="fingen-cta-dot" />
              <span className="fingen-cta-dot" />
            </div>
          </div>
        </section>

        {/* Free Traffic Banner */}
        <section className="fingen-banner">
          <div className="fingen-banner-content">
            <div className="fingen-banner-icon">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="fingen-banner-text">
              <strong>Tráfego pago grátis</strong>
              <span>Seus anúncios são divulgados no Google e Meta Ads sem custo</span>
            </div>
            <Link href="/anunciar-carro" className="fingen-banner-btn">
              Saiba mais
            </Link>
          </div>
        </section>

        {/* Recent Listings - Card Grid */}
        <section className="fingen-section">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Últimos anúncios</div>
              <h2 className="fingen-section-title">Adicionados recentemente</h2>
            </div>
            <Link href="/carros-a-venda" className="fingen-section-link">
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="fingen-cars-grid">
            {recentListings.length > 0 ? (
              recentListings.map((listing, index) => (
                <CarCard key={listing.id} listing={listing} index={index} />
              ))
            ) : (
              <div className="fingen-empty">
                <p>{fetchError ? 'Carregando anúncios...' : 'Nenhum anúncio ainda'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Statistics */}
        <section className="fingen-stats">
          <div className="fingen-stats-header">
            <div className="fingen-stats-title">Estatísticas</div>
            <Link href="/rankings" className="fingen-stats-link">Ver rankings</Link>
          </div>
          <div className="fingen-stats-chart">
            {statsData.map((stat, i) => (
              <div key={stat.label} className="fingen-stats-col">
                <div
                  className="fingen-stats-bar"
                  style={{
                    height: `${(stat.value / maxValue) * 100}%`,
                    background: i === statsData.length - 1 ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                  }}
                />
                <div className="fingen-stats-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Brands */}
        <section className="fingen-section">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Marcas</div>
              <h2 className="fingen-section-title">Comece pela marca</h2>
            </div>
            <Link href="/marcas" className="fingen-section-link">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="fingen-brands-scroll">
            {topBrands.map((brand) => {
              const count = listings.filter((l) => l.brand === brand).length
              return (
                <Link
                  key={brand}
                  href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`}
                  className="fingen-brand-chip"
                >
                  <div className="fingen-brand-initial">{brandInitials(brand)}</div>
                  <div className="fingen-brand-info">
                    <div className="fingen-brand-name">{brand}</div>
                    <div className="fingen-brand-count">{count} anúncio{count === 1 ? '' : 's'}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="fingen-final-cta">
          <div className="fingen-final-cta-card">
            <div className="fingen-final-cta-icon">
              <Plus size={24} />
            </div>
            <h3>Pronto para anunciar?</h3>
            <p>Cadastre seu carro grátis e comece a receber contatos hoje.</p>
            <Link href="/anunciar-carro" className="fingen-final-cta-btn">
              Começar agora
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fingen-bottom-nav">
        <Link href="/" className="fingen-nav-item active">
          <div className="fingen-nav-icon">
            <Home size={20} />
          </div>
          <span>Home</span>
        </Link>
        <Link href="/carros-a-venda" className="fingen-nav-item">
          <div className="fingen-nav-icon">
            <Search size={20} />
          </div>
          <span>Buscar</span>
        </Link>
        <Link href="/anunciar-carro" className="fingen-nav-item">
          <div className="fingen-nav-icon fingen-nav-icon-accent">
            <Plus size={20} />
          </div>
          <span>Anunciar</span>
        </Link>
        <Link href="/minha-conta/conversas" className="fingen-nav-item">
          <div className="fingen-nav-icon">
            <CreditCard size={20} />
          </div>
          <span>Chat</span>
        </Link>
        <Link href="/minha-conta" className="fingen-nav-item">
          <div className="fingen-nav-icon">
            <User size={20} />
          </div>
          <span>Perfil</span>
        </Link>
      </nav>
    </div>
  )
}
